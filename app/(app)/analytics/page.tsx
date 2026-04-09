'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter
} from 'recharts'

type SummaryRow = {
  date: string
  health_index: number | null
  workload_index: number | null
  stress_index: number | null
  fatigue_index: number | null
  blood_pressure_sys: number | null
  blood_pressure_dia: number | null
  heart_rate: number | null
  sleep_quality: number | null
  energy_level: number | null
  lessons_count: number | null
}

function StatCard({ label, value, unit = '' }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
      <div className="text-2xl font-bold text-slate-800">{value}<span className="text-sm font-normal text-slate-400 ml-1">{unit}</span></div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  )
}

export default function AnalyticsPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [data, setData] = useState<SummaryRow[]>([])
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')

  useEffect(() => {
    if (!user) return
    const days = { week: 7, month: 30, quarter: 90, year: 365 }[period]
    const from = new Date()
    from.setDate(from.getDate() - days)
    const fromStr = from.toISOString().split('T')[0]

    supabase
      .from('daily_summary' as 'teachers')
      .select('*')
      .eq('teacher_id', user.id)
      .gte('date', fromStr)
      .order('date', { ascending: true })
      .then(({ data: rows }) => setData((rows as SummaryRow[]) || []))
  }, [user, period])

  const fmt = (row: SummaryRow) => ({
    ...row,
    label: new Date(row.date + 'T12:00').toLocaleDateString('ru-RU', {
      day: 'numeric', month: 'short'
    }),
  })

  const chartData = data.map(fmt)

  const avg = (arr: (number | null | undefined)[]) => {
    const valid = arr.filter((v): v is number => v != null)
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : null
  }

  const avgHealth   = avg(data.map(d => d.health_index))
  const avgWorkload = avg(data.map(d => d.workload_index))
  const avgStress   = avg(data.map(d => d.stress_index))
  const avgFatigue  = avg(data.map(d => d.fatigue_index))

  // Сезонный анализ — группируем по месяцам
  const monthly = data.reduce((acc, row) => {
    const month = row.date.slice(0, 7)
    if (!acc[month]) acc[month] = { month, health: [], workload: [], stress: [] }
    if (row.health_index != null) acc[month].health.push(row.health_index)
    if (row.workload_index != null) acc[month].workload.push(row.workload_index)
    if (row.stress_index != null) acc[month].stress.push(row.stress_index)
    return acc
  }, {} as Record<string, { month: string; health: number[]; workload: number[]; stress: number[] }>)

  const monthlyData = Object.values(monthly).map(m => ({
    month: new Date(m.month + '-01').toLocaleDateString('ru-RU', { month: 'short', year: '2-digit' }),
    health: avg(m.health) ?? 0,
    workload: avg(m.workload) ?? 0,
    stress: avg(m.stress) ?? 0,
  }))

  // Корреляция нагрузка vs здоровье
  const scatterData = data
    .filter(d => d.workload_index != null && d.health_index != null)
    .map(d => ({ x: d.workload_index!, y: d.health_index!, date: d.date }))

  if (data.length === 0) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-4">{t('analytics.title')}</h1>
        <div className="text-center py-16 text-slate-400">{t('analytics.noData')}</div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('analytics.title')}</h1>
        <div className="flex gap-2">
          {(['week', 'month', 'quarter', 'year'] as const).map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                period === p ? 'bg-blue-600 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {t(`analytics.${p}`)}
            </button>
          ))}
        </div>
      </div>

      {/* Средние значения */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard label={t('analytics.avgHealth')}   value={avgHealth ?? '—'}   />
        <StatCard label={t('analytics.avgWorkload')} value={avgWorkload ?? '—'} />
        <StatCard label={t('analytics.avgStress')}   value={avgStress ?? '—'}   />
        <StatCard label={t('analytics.avgFatigue')}  value={avgFatigue ?? '—'}  />
      </div>

      {/* Динамика индексов */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
        <h2 className="font-semibold text-slate-800 mb-4">{t('analytics.indices')}</h2>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="label" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Legend />
            <Line dataKey="health_index"   name={t('dashboard.healthIndex')}   stroke="#22c55e" strokeWidth={2} dot={false} />
            <Line dataKey="workload_index" name={t('dashboard.workloadIndex')} stroke="#3b82f6" strokeWidth={2} dot={false} />
            <Line dataKey="stress_index"   name={t('dashboard.stressIndex')}   stroke="#a855f7" strokeWidth={2} dot={false} />
            <Line dataKey="fatigue_index"  name={t('dashboard.fatigueIndex')}  stroke="#f97316" strokeWidth={2} dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        {/* Давление и ЧСС */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('analytics.bloodPressure')}</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="label" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Legend />
              <Line dataKey="blood_pressure_sys" name="Сис." stroke="#ef4444" strokeWidth={2} dot={false} />
              <Line dataKey="blood_pressure_dia" name="Диа." stroke="#3b82f6" strokeWidth={2} dot={false} />
              <Line dataKey="heart_rate"          name="ЧСС"  stroke="#f97316" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Корреляция нагрузки и здоровья */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('analytics.correlation')}</h2>
          {scatterData.length > 1 ? (
            <ResponsiveContainer width="100%" height={200}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="x" name={t('analytics.avgWorkload')} tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: 'Нагрузка', position: 'insideBottom', offset: -5, fontSize: 10 }} />
                <YAxis dataKey="y" name={t('analytics.avgHealth')}   tick={{ fontSize: 10 }} domain={[0, 100]} label={{ value: 'Здоровье', angle: -90, position: 'insideLeft', fontSize: 10 }} />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Scatter data={scatterData} fill="#3b82f6" opacity={0.7} />
              </ScatterChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-sm text-slate-400">{t('analytics.noData')}</div>
          )}
        </div>
      </div>

      {/* Сезонный анализ */}
      {monthlyData.length > 1 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('analytics.seasonalAnalysis')}</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="health"   name={t('analytics.avgHealth')}   fill="#22c55e" radius={[4, 4, 0, 0]} />
              <Bar dataKey="workload" name={t('analytics.avgWorkload')} fill="#3b82f6" radius={[4, 4, 0, 0]} />
              <Bar dataKey="stress"   name={t('analytics.avgStress')}   fill="#a855f7" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
