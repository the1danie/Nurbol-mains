'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Download, FileText, Table, FileSpreadsheet } from 'lucide-react'
import * as XLSX from 'xlsx'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

type ExportOptions = {
  includeHealth: boolean
  includeSchedule: boolean
  includeSurveys: boolean
  includeIndices: boolean
}

export default function ExportPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1)
    return d.toISOString().split('T')[0]
  })
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0])
  const [options, setOptions] = useState<ExportOptions>({
    includeHealth: true,
    includeSchedule: true,
    includeSurveys: true,
    includeIndices: true,
  })
  const [exporting, setExporting] = useState<string | null>(null)

  const fetchData = async () => {
    const results: Record<string, unknown[]> = {}

    if (options.includeHealth || options.includeIndices) {
      const { data } = await supabase
        .from('health_records')
        .select('*')
        .eq('teacher_id', user!.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date')
      results.health = data || []
    }

    if (options.includeSchedule) {
      const { data } = await supabase
        .from('schedules')
        .select('*')
        .eq('teacher_id', user!.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date')
      results.schedules = data || []
    }

    if (options.includeSurveys) {
      const { data } = await supabase
        .from('daily_surveys')
        .select('*')
        .eq('teacher_id', user!.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date')
      results.surveys = data || []
    }

    if (options.includeIndices) {
      const { data } = await supabase
        .from('daily_summary' as 'teachers')
        .select('*')
        .eq('teacher_id', user!.id)
        .gte('date', dateFrom)
        .lte('date', dateTo)
        .order('date')
      results.indices = data || []
    }

    return results
  }

  const exportCSV = async () => {
    setExporting('csv')
    const data = await fetchData()

    // Создаём CSV из индексов + основных показателей
    const rows = (data.indices || data.health || []) as Record<string, unknown>[]
    if (!rows.length) { setExporting(null); return }

    const headers = Object.keys(rows[0]).filter(k => k !== 'teacher_id' && k !== 'id').join(',')
    const lines = rows.map(r =>
      Object.entries(r)
        .filter(([k]) => k !== 'teacher_id' && k !== 'id')
        .map(([, v]) => (v == null ? '' : String(v)))
        .join(',')
    )
    const csv = [headers, ...lines].join('\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url
    a.download = `health_data_${dateFrom}_${dateTo}.csv`
    a.click(); URL.revokeObjectURL(url)
    setExporting(null)
  }

  const exportExcel = async () => {
    setExporting('excel')
    const data = await fetchData()
    const wb = XLSX.utils.book_new()

    const cleanRows = (rows: unknown[]) =>
      (rows as Record<string, unknown>[]).map(r => {
        const clean: Record<string, unknown> = {}
        for (const [k, v] of Object.entries(r)) {
          if (k !== 'teacher_id' && k !== 'id') clean[k] = v
        }
        return clean
      })

    if (options.includeIndices && data.indices?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleanRows(data.indices)), 'Индексы здоровья')
    }
    if (options.includeHealth && data.health?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleanRows(data.health)), 'Показатели здоровья')
    }
    if (options.includeSchedule && data.schedules?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleanRows(data.schedules)), 'Расписание')
    }
    if (options.includeSurveys && data.surveys?.length) {
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(cleanRows(data.surveys)), 'Опросники')
    }

    XLSX.writeFile(wb, `health_data_${dateFrom}_${dateTo}.xlsx`)
    setExporting(null)
  }

  const exportPDF = async () => {
    setExporting('pdf')
    const data = await fetchData()
    const doc = new jsPDF({ orientation: 'landscape' })

    doc.setFont('helvetica')
    doc.setFontSize(16)
    doc.text('Health Impact Monitor', 14, 16)
    doc.setFontSize(11)
    doc.text(`Период: ${dateFrom} - ${dateTo}`, 14, 24)
    doc.text('СКУ им. М.Козыбаева', 14, 30)

    let startY = 38

    if (options.includeIndices && data.indices?.length) {
      doc.setFontSize(12)
      doc.text('Индексы здоровья', 14, startY)
      startY += 4
      const rows = data.indices as Record<string, unknown>[]
      autoTable(doc, {
        startY,
        head: [['Дата', 'Инд. здоровья', 'Инд. нагрузки', 'Инд. стресса', 'Инд. усталости', 'ЧСС', 'АД (сис/диа)']],
        body: rows.map(r => [
          r.date as string,
          r.health_index ?? '—',
          r.workload_index ?? '—',
          r.stress_index ?? '—',
          r.fatigue_index ?? '—',
          r.heart_rate ?? '—',
          r.blood_pressure_sys && r.blood_pressure_dia
            ? `${r.blood_pressure_sys}/${r.blood_pressure_dia}`
            : '—',
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [59, 130, 246] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
        didDrawPage: (info) => { startY = (info.cursor?.y ?? startY) + 8 },
      })
      startY = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10
    }

    if (options.includeHealth && data.health?.length) {
      if (startY > 160) { doc.addPage(); startY = 14 }
      doc.setFontSize(12)
      doc.text('Физиологические показатели', 14, startY)
      startY += 4
      const rows = data.health as Record<string, unknown>[]
      autoTable(doc, {
        startY,
        head: [['Дата', 'АД сис.', 'АД диа.', 'ЧСС', 'Стресс', 'Сон', 'Усталость', 'Энергия', 'Шаги', 'Вода мл']],
        body: rows.map(r => [
          r.date as string,
          r.blood_pressure_sys ?? '—',
          r.blood_pressure_dia ?? '—',
          r.heart_rate ?? '—',
          r.stress_level ?? '—',
          r.sleep_quality ?? '—',
          r.fatigue_level ?? '—',
          r.energy_level ?? '—',
          r.steps ?? '—',
          r.water_ml ?? '—',
        ]),
        styles: { fontSize: 9 },
        headStyles: { fillColor: [34, 197, 94] },
        alternateRowStyles: { fillColor: [248, 250, 252] },
      })
    }

    doc.save(`health_report_${dateFrom}_${dateTo}.pdf`)
    setExporting(null)
  }

  const toggle = (field: keyof ExportOptions) =>
    setOptions(p => ({ ...p, [field]: !p[field] }))

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-2">{t('export.title')}</h1>
      <p className="text-slate-500 text-sm mb-6">{t('export.description')}</p>

      {/* Период */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="font-semibold text-slate-800 mb-3">Период экспорта</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t('export.dateFrom')}</label>
            <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t('export.dateTo')}</label>
            <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
      </div>

      {/* Что включить */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-6">
        <h2 className="font-semibold text-slate-800 mb-3">Включить данные</h2>
        <div className="grid grid-cols-2 gap-3">
          {([
            ['includeIndices',  t('export.includeIndices')],
            ['includeHealth',   t('export.includeHealth')],
            ['includeSchedule', t('export.includeSchedule')],
            ['includeSurveys',  t('export.includeSurveys')],
          ] as [keyof ExportOptions, string][]).map(([field, label]) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={options[field]}
                onChange={() => toggle(field)}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Кнопки экспорта */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <button
          onClick={exportExcel}
          disabled={!!exporting}
          className="flex flex-col items-center gap-3 bg-white border border-slate-200 hover:border-green-300 hover:bg-green-50 rounded-xl p-5 transition-colors disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <FileSpreadsheet className="w-6 h-6 text-green-600" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-800">Excel (.xlsx)</div>
            <div className="text-xs text-slate-500 mt-0.5">Для Excel / SPSS / R</div>
          </div>
          {exporting === 'excel' && (
            <div className="text-xs text-green-600">{t('export.exporting')}</div>
          )}
        </button>

        <button
          onClick={exportCSV}
          disabled={!!exporting}
          className="flex flex-col items-center gap-3 bg-white border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl p-5 transition-colors disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <Table className="w-6 h-6 text-blue-600" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-800">CSV</div>
            <div className="text-xs text-slate-500 mt-0.5">Для Python / R / любых инструментов</div>
          </div>
          {exporting === 'csv' && (
            <div className="text-xs text-blue-600">{t('export.exporting')}</div>
          )}
        </button>

        <button
          onClick={exportPDF}
          disabled={!!exporting}
          className="flex flex-col items-center gap-3 bg-white border border-slate-200 hover:border-red-300 hover:bg-red-50 rounded-xl p-5 transition-colors disabled:opacity-50"
        >
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
            <FileText className="w-6 h-6 text-red-600" />
          </div>
          <div className="text-center">
            <div className="font-semibold text-slate-800">PDF отчёт</div>
            <div className="text-xs text-slate-500 mt-0.5">Для диссертации и презентации</div>
          </div>
          {exporting === 'pdf' && (
            <div className="text-xs text-red-600">{t('export.exporting')}</div>
          )}
        </button>
      </div>

      <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl">
        <div className="text-xs text-amber-800">
          <strong>Совет для диссертации:</strong> Экспортируйте данные в Excel и откройте в SPSS для проведения корреляционного анализа (коэффициент Пирсона) между индексом нагрузки и индексами здоровья/стресса.
        </div>
      </div>
    </div>
  )
}
