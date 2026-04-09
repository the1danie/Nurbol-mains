'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { Plus, Trash2, BookOpen } from 'lucide-react'

type Schedule = {
  id: string
  date: string
  subject: string
  lesson_type: string
  hours: number
  group_name: string | null
  room: string | null
  windows_count: number
}

type ScheduleForm = {
  date: string
  subject: string
  lesson_type: string
  hours: string
  group_name: string
  room: string
  windows_count: string
}

const defaultForm: ScheduleForm = {
  date: new Date().toISOString().split('T')[0],
  subject: '',
  lesson_type: 'lecture',
  hours: '2',
  group_name: '',
  room: '',
  windows_count: '0',
}

export default function SchedulePage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [schedules, setSchedules] = useState<Schedule[]>([])
  const [form, setForm] = useState<ScheduleForm>(defaultForm)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7))

  const loadSchedules = async () => {
    if (!user) return
    const start = `${filterMonth}-01`
    const [y, m] = filterMonth.split('-').map(Number)
    const lastDay = new Date(y, m, 0).getDate()
    const end = `${filterMonth}-${String(lastDay).padStart(2, '0')}`
    const { data } = await supabase
      .from('schedules')
      .select('*')
      .eq('teacher_id', user.id)
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: true })
    setSchedules(data || [])
  }

  useEffect(() => { loadSchedules() }, [user, filterMonth])

  const handleSave = async () => {
    if (!user || !form.subject || !form.date) return
    setSaving(true)
    await supabase.from('schedules').insert({
      teacher_id: user.id,
      date: form.date,
      subject: form.subject,
      lesson_type: form.lesson_type,
      hours: Number(form.hours) || 2,
      group_name: form.group_name || null,
      room: form.room || null,
      windows_count: Number(form.windows_count) || 0,
    })
    setSaving(false)
    setForm({ ...defaultForm, date: form.date })
    setShowForm(false)
    loadSchedules()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('schedules').delete().eq('id', id)
    setSchedules(prev => prev.filter(s => s.id !== id))
  }

  const totalHours = schedules.reduce((sum, s) => sum + s.hours, 0)

  const grouped = schedules.reduce((acc, s) => {
    if (!acc[s.date]) acc[s.date] = []
    acc[s.date].push(s)
    return acc
  }, {} as Record<string, Schedule[]>)

  const lessonTypeColors: Record<string, string> = {
    lecture: 'bg-blue-100 text-blue-700',
    practice: 'bg-green-100 text-green-700',
    lab: 'bg-purple-100 text-purple-700',
    seminar: 'bg-orange-100 text-orange-700',
  }

  return (
    <div className="p-4 sm:p-6 max-w-4xl mx-auto pb-24 lg:pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('schedule.title')}</h1>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="flex-1 sm:flex-none border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">{t('schedule.addLesson')}</span>
            <span className="sm:hidden">+</span>
          </button>
        </div>
      </div>

      {/* Форма добавления */}
      {showForm && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 mb-4">
          <h2 className="font-semibold text-slate-800 mb-4">{t('schedule.addLesson')}</h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.date')}</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(p => ({ ...p, date: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.subject')}</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
                placeholder="Математический анализ"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.lessonType')}</label>
              <select
                value={form.lesson_type}
                onChange={e => setForm(p => ({ ...p, lesson_type: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {Object.entries(t('schedule.types', { returnObjects: true }) as Record<string, string>).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.hours')}</label>
              <input
                type="number" min={1} max={8} step={0.5}
                value={form.hours}
                onChange={e => setForm(p => ({ ...p, hours: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.windows')}</label>
              <input
                type="number" min={0} max={5}
                value={form.windows_count}
                onChange={e => setForm(p => ({ ...p, windows_count: e.target.value }))}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.group')}</label>
              <input
                type="text"
                value={form.group_name}
                onChange={e => setForm(p => ({ ...p, group_name: e.target.value }))}
                placeholder="ИСТ-21"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('schedule.room')}</label>
              <input
                type="text"
                value={form.room}
                onChange={e => setForm(p => ({ ...p, room: e.target.value }))}
                placeholder="А-201"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleSave}
              disabled={saving || !form.subject}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {saving ? t('common.loading') : t('common.save')}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="border border-slate-300 text-slate-600 hover:bg-slate-50 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}

      {/* Сводка */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            {filterMonth}: {schedules.length} занятий, {totalHours} ч.
          </span>
        </div>
      </div>

      {/* Список по дням */}
      {Object.keys(grouped).length > 0 ? (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, items]) => (
            <div key={date} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">
                  {new Date(date + 'T12:00:00').toLocaleDateString('ru-RU', {
                    weekday: 'long', day: 'numeric', month: 'long'
                  })}
                </span>
                <span className="ml-2 text-xs text-slate-500">
                  {items.reduce((s, i) => s + i.hours, 0)} ч.
                </span>
              </div>
              <div className="divide-y divide-slate-100">
                {items.map(item => (
                  <div key={item.id} className="flex items-center justify-between px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${lessonTypeColors[item.lesson_type] || 'bg-slate-100 text-slate-600'}`}>
                        {t(`schedule.types.${item.lesson_type}`)}
                      </span>
                      <div>
                        <div className="text-sm font-medium text-slate-800">{item.subject}</div>
                        <div className="text-xs text-slate-400">
                          {item.hours} ч.
                          {item.group_name && ` • ${item.group_name}`}
                          {item.room && ` • ${item.room}`}
                          {item.windows_count > 0 && ` • ${item.windows_count} окн.`}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-slate-400">{t('schedule.noSchedule')}</div>
      )}
    </div>
  )
}
