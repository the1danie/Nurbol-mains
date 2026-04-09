'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { useTeacher } from '@/hooks/useTeacher'
import { Heart, Activity, Brain, Zap, Plus, TrendingUp, Calendar } from 'lucide-react'

type DailySummary = {
  date: string
  health_index: number | null
  workload_index: number | null
  stress_index: number | null
  fatigue_index: number | null
  blood_pressure_sys: number | null
  blood_pressure_dia: number | null
  heart_rate: number | null
  lessons_count: number | null
}

function IndexCard({
  label, value, icon: Icon, color, max = 100
}: {
  label: string; value: number | null; icon: React.ElementType; color: string; max?: number
}) {
  const pct = value != null ? Math.round((value / max) * 100) : null
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4 h-4 text-white" />
        </div>
      </div>
      <div className="text-3xl font-bold text-slate-800 mb-2">
        {value != null ? value : '—'}
        {value != null && <span className="text-lg text-slate-400 font-normal">/100</span>}
      </div>
      {pct != null && (
        <div className="w-full bg-slate-100 rounded-full h-1.5">
          <div
            className={`h-1.5 rounded-full transition-all ${
              pct >= 70 ? 'bg-green-500' : pct >= 40 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${pct}%` }}
          />
        </div>
      )}
    </div>
  )
}

export default function DashboardPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const { teacher } = useTeacher()
  const [todayData, setTodayData] = useState<DailySummary | null>(null)
  const [recentData, setRecentData] = useState<DailySummary[]>([])
  const [todaySchedule, setTodaySchedule] = useState<{ subject: string; lesson_type: string; hours: number }[]>([])
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    // Данные сводки за сегодня
    supabase
      .from('daily_summary' as 'teachers')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('date', today)
      .maybeSingle()
      .then(({ data }) => setTodayData(data as DailySummary | null))

    // Последние 7 записей
    supabase
      .from('daily_summary' as 'teachers')
      .select('*')
      .eq('teacher_id', user.id)
      .order('date', { ascending: false })
      .limit(7)
      .then(({ data }) => setRecentData((data as DailySummary[]) || []))

    // Расписание на сегодня
    supabase
      .from('schedules')
      .select('subject, lesson_type, hours')
      .eq('teacher_id', user.id)
      .eq('date', today)
      .then(({ data }) => setTodaySchedule(data || []))
  }, [user, today])

  const name = teacher?.full_name?.split(' ')[0] || ''

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto pb-24 lg:pb-6">
      {/* Приветствие */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          {t('dashboard.greeting')}{name ? `, ${name}` : ''}!
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {t('dashboard.today')}: {new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}
        </p>
      </div>

      {/* Индексы здоровья */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <IndexCard label={t('dashboard.healthIndex')}   value={todayData?.health_index ?? null}   icon={Heart}    color="bg-green-500" />
        <IndexCard label={t('dashboard.workloadIndex')} value={todayData?.workload_index ?? null} icon={Activity} color="bg-blue-500" />
        <IndexCard label={t('dashboard.stressIndex')}   value={todayData?.stress_index ?? null}   icon={Brain}    color="bg-purple-500" />
        <IndexCard label={t('dashboard.fatigueIndex')}  value={todayData?.fatigue_index ?? null}  icon={Zap}      color="bg-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Витальные показатели */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800">{t('dashboard.today')}</h2>
            <Link href="/health" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="w-3 h-3" />
              {t('dashboard.addData')}
            </Link>
          </div>
          {todayData ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{t('health.bloodPressure')}</div>
                <div className="text-lg font-bold text-slate-800">
                  {todayData.blood_pressure_sys && todayData.blood_pressure_dia
                    ? `${todayData.blood_pressure_sys}/${todayData.blood_pressure_dia}`
                    : '—'
                  } <span className="text-xs font-normal text-slate-400">{t('health.mmHg')}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{t('health.heartRate')}</div>
                <div className="text-lg font-bold text-slate-800">
                  {todayData.heart_rate ?? '—'} <span className="text-xs font-normal text-slate-400">{t('health.bpm')}</span>
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{t('health.stressLevel')}</div>
                <div className="text-lg font-bold text-slate-800">
                  {todayData.stress_index != null ? `${todayData.stress_index}/100` : '—'}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg p-3">
                <div className="text-xs text-slate-500 mb-1">{t('schedule.title')}</div>
                <div className="text-lg font-bold text-slate-800">
                  {todayData.lessons_count ?? todaySchedule.length} <span className="text-xs font-normal text-slate-400">пар</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <div className="text-slate-400 text-sm mb-3">{t('dashboard.noDataToday')}</div>
              <Link
                href="/health"
                className="inline-flex items-center gap-2 bg-blue-600 text-white text-sm px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                {t('dashboard.addHealthRecord')}
              </Link>
            </div>
          )}
        </div>

        {/* Расписание на сегодня */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-500" />
              {t('dashboard.todaySchedule')}
            </h2>
            <Link href="/schedule" className="text-sm text-blue-600 hover:underline">
              <Plus className="w-3 h-3" />
            </Link>
          </div>
          {todaySchedule.length > 0 ? (
            <div className="space-y-2">
              {todaySchedule.map((item, i) => (
                <div key={i} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  <div>
                    <div className="text-sm font-medium text-slate-700">{item.subject}</div>
                    <div className="text-xs text-slate-400">{item.hours} ч</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-slate-400">{t('dashboard.noSchedule')}</div>
          )}
        </div>
      </div>

      {/* Последние записи */}
      {recentData.length > 0 && (
        <div className="mt-4 bg-white rounded-xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-slate-500" />
              {t('dashboard.recentRecords')}
            </h2>
            <Link href="/analytics" className="text-sm text-blue-600 hover:underline">
              {t('dashboard.viewAnalytics')}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-slate-500 border-b border-slate-100">
                  <th className="text-left pb-2 font-medium">Дата</th>
                  <th className="text-right pb-2 font-medium">Здоровье</th>
                  <th className="text-right pb-2 font-medium">Нагрузка</th>
                  <th className="text-right pb-2 font-medium">Стресс</th>
                  <th className="text-right pb-2 font-medium">Усталость</th>
                </tr>
              </thead>
              <tbody>
                {recentData.map(row => (
                  <tr key={row.date} className="border-b border-slate-50 hover:bg-slate-50">
                    <td className="py-2 text-slate-600">
                      {new Date(row.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                    </td>
                    <td className="py-2 text-right">
                      <span className={`font-medium ${
                        (row.health_index ?? 0) >= 70 ? 'text-green-600' :
                        (row.health_index ?? 0) >= 40 ? 'text-yellow-600' : 'text-red-600'
                      }`}>{row.health_index ?? '—'}</span>
                    </td>
                    <td className="py-2 text-right font-medium text-slate-700">{row.workload_index ?? '—'}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{row.stress_index ?? '—'}</td>
                    <td className="py-2 text-right font-medium text-slate-700">{row.fatigue_index ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
