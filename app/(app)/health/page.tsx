'use client'

import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, Save } from 'lucide-react'

type HealthForm = {
  blood_pressure_sys: string
  blood_pressure_dia: string
  heart_rate: string
  stress_level: number
  sleep_quality: number
  fatigue_level: number
  energy_level: number
  steps: string
  water_ml: string
  exercises_done: boolean
  exercise_minutes: string
  pain_head: boolean
  pain_back: boolean
  pain_neck: boolean
  pain_eyes: boolean
  pain_other: string
  notes: string
}

type SurveyForm = {
  mood: number
  anxiety_level: number
  satisfaction_work: number
  lessons_count: string
  felt_overwhelmed: boolean
  had_conflicts: boolean
  extra_work_hours: string
  complaints: string
}

function SliderField({ label, value, onChange, hint }: {
  label: string; value: number; onChange: (v: number) => void; hint?: string
}) {
  const color = value <= 3 ? 'text-green-600' : value <= 6 ? 'text-yellow-600' : 'text-red-600'
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className={`text-lg font-bold ${color}`}>{value}</span>
      </div>
      {hint && <p className="text-xs text-slate-400 mb-2">{hint}</p>}
      <input
        type="range" min={1} max={10} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-blue-600"
      />
      <div className="flex justify-between text-xs text-slate-400 mt-0.5">
        <span>1</span><span>5</span><span>10</span>
      </div>
    </div>
  )
}

const defaultHealth: HealthForm = {
  blood_pressure_sys: '', blood_pressure_dia: '', heart_rate: '',
  stress_level: 5, sleep_quality: 5, fatigue_level: 5, energy_level: 5,
  steps: '', water_ml: '',
  exercises_done: false, exercise_minutes: '',
  pain_head: false, pain_back: false, pain_neck: false, pain_eyes: false,
  pain_other: '', notes: '',
}

const defaultSurvey: SurveyForm = {
  mood: 5, anxiety_level: 5, satisfaction_work: 5,
  lessons_count: '', felt_overwhelmed: false, had_conflicts: false,
  extra_work_hours: '', complaints: '',
}

export default function HealthPage() {
  const { t } = useTranslation()
  const { user } = useAuth()
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [health, setHealth] = useState<HealthForm>(defaultHealth)
  const [survey, setSurvey] = useState<SurveyForm>(defaultSurvey)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingHealthId, setExistingHealthId] = useState<string | null>(null)
  const [existingSurveyId, setExistingSurveyId] = useState<string | null>(null)

  // Загрузка существующих данных при смене даты
  useEffect(() => {
    if (!user) return
    supabase.from('health_records').select('*').eq('teacher_id', user.id).eq('date', date).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingHealthId(data.id)
          setHealth({
            blood_pressure_sys: data.blood_pressure_sys?.toString() ?? '',
            blood_pressure_dia: data.blood_pressure_dia?.toString() ?? '',
            heart_rate: data.heart_rate?.toString() ?? '',
            stress_level: data.stress_level ?? 5,
            sleep_quality: data.sleep_quality ?? 5,
            fatigue_level: data.fatigue_level ?? 5,
            energy_level: data.energy_level ?? 5,
            steps: data.steps?.toString() ?? '',
            water_ml: data.water_ml?.toString() ?? '',
            exercises_done: data.exercises_done ?? false,
            exercise_minutes: data.exercise_minutes?.toString() ?? '',
            pain_head: data.pain_head ?? false,
            pain_back: data.pain_back ?? false,
            pain_neck: data.pain_neck ?? false,
            pain_eyes: data.pain_eyes ?? false,
            pain_other: data.pain_other ?? '',
            notes: data.notes ?? '',
          })
        } else {
          setExistingHealthId(null)
          setHealth(defaultHealth)
        }
      })

    supabase.from('daily_surveys').select('*').eq('teacher_id', user.id).eq('date', date).maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingSurveyId(data.id)
          setSurvey({
            mood: data.mood ?? 5,
            anxiety_level: data.anxiety_level ?? 5,
            satisfaction_work: data.satisfaction_work ?? 5,
            lessons_count: data.lessons_count?.toString() ?? '',
            felt_overwhelmed: data.felt_overwhelmed ?? false,
            had_conflicts: data.had_conflicts ?? false,
            extra_work_hours: data.extra_work_hours?.toString() ?? '',
            complaints: data.complaints ?? '',
          })
        } else {
          setExistingSurveyId(null)
          setSurvey(defaultSurvey)
        }
      })
  }, [user, date])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    setSaved(false)

    const healthData = {
      teacher_id: user.id,
      date,
      blood_pressure_sys: health.blood_pressure_sys ? Number(health.blood_pressure_sys) : null,
      blood_pressure_dia: health.blood_pressure_dia ? Number(health.blood_pressure_dia) : null,
      heart_rate: health.heart_rate ? Number(health.heart_rate) : null,
      stress_level: health.stress_level,
      sleep_quality: health.sleep_quality,
      fatigue_level: health.fatigue_level,
      energy_level: health.energy_level,
      steps: health.steps ? Number(health.steps) : 0,
      water_ml: health.water_ml ? Number(health.water_ml) : 0,
      exercises_done: health.exercises_done,
      exercise_minutes: health.exercise_minutes ? Number(health.exercise_minutes) : 0,
      pain_head: health.pain_head,
      pain_back: health.pain_back,
      pain_neck: health.pain_neck,
      pain_eyes: health.pain_eyes,
      pain_other: health.pain_other || null,
      notes: health.notes || null,
    }

    const surveyData = {
      teacher_id: user.id,
      date,
      mood: survey.mood,
      anxiety_level: survey.anxiety_level,
      satisfaction_work: survey.satisfaction_work,
      lessons_count: survey.lessons_count ? Number(survey.lessons_count) : 0,
      felt_overwhelmed: survey.felt_overwhelmed,
      had_conflicts: survey.had_conflicts,
      extra_work_hours: survey.extra_work_hours ? Number(survey.extra_work_hours) : 0,
      complaints: survey.complaints || null,
    }

    if (existingHealthId) {
      await supabase.from('health_records').update(healthData).eq('id', existingHealthId)
    } else {
      const { data } = await supabase.from('health_records').insert(healthData).select().single()
      if (data) setExistingHealthId(data.id)
    }

    if (existingSurveyId) {
      await supabase.from('daily_surveys').update(surveyData).eq('id', existingSurveyId)
    } else {
      const { data } = await supabase.from('daily_surveys').insert(surveyData).select().single()
      if (data) setExistingSurveyId(data.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const h = (field: keyof HealthForm) => (v: number) => setHealth(prev => ({ ...prev, [field]: v }))
  const s = (field: keyof SurveyForm) => (v: number) => setSurvey(prev => ({ ...prev, [field]: v }))

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-800">{t('health.title')}</h1>
        <div className="flex items-center gap-3">
          <input
            type="date"
            value={date}
            max={new Date().toISOString().split('T')[0]}
            onChange={e => setDate(e.target.value)}
            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saved ? t('health.saved') : saving ? t('common.loading') : t('health.save')}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Физиологические показатели */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('health.bloodPressure')}</h2>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('health.bloodPressureSys')}</label>
              <input
                type="number" min={60} max={220}
                value={health.blood_pressure_sys}
                onChange={e => setHealth(p => ({ ...p, blood_pressure_sys: e.target.value }))}
                placeholder="120"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('health.bloodPressureDia')}</label>
              <input
                type="number" min={40} max={140}
                value={health.blood_pressure_dia}
                onChange={e => setHealth(p => ({ ...p, blood_pressure_dia: e.target.value }))}
                placeholder="80"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t('health.heartRate')}</label>
            <input
              type="number" min={40} max={220}
              value={health.heart_rate}
              onChange={e => setHealth(p => ({ ...p, heart_rate: e.target.value }))}
              placeholder="72"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Самочувствие — слайдеры */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5">
          <h2 className="font-semibold text-slate-800">{t('health.scale110')}</h2>
          <SliderField label={t('health.stressLevel')} value={health.stress_level} onChange={h('stress_level')} />
          <SliderField label={t('health.sleepQuality')} value={health.sleep_quality} onChange={h('sleep_quality')} />
          <SliderField label={t('health.fatigueLevel')} value={health.fatigue_level} onChange={h('fatigue_level')} />
          <SliderField label={t('health.energyLevel')} value={health.energy_level} onChange={h('energy_level')} />
        </div>

        {/* Активность и вода */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">Активность</h2>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('health.steps')}</label>
              <input
                type="number" min={0}
                value={health.steps}
                onChange={e => setHealth(p => ({ ...p, steps: e.target.value }))}
                placeholder="5000"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('health.waterIntake')}</label>
              <input
                type="number" min={0} step={100}
                value={health.water_ml}
                onChange={e => setHealth(p => ({ ...p, water_ml: e.target.value }))}
                placeholder="1500"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={health.exercises_done}
                onChange={e => setHealth(p => ({ ...p, exercises_done: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">{t('health.exercises')}</span>
            </label>
            {health.exercises_done && (
              <input
                type="number" min={0}
                value={health.exercise_minutes}
                onChange={e => setHealth(p => ({ ...p, exercise_minutes: e.target.value }))}
                placeholder="мин"
                className="w-20 border border-slate-300 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            )}
          </div>
        </div>

        {/* Боль и дискомфорт */}
        <div className="bg-white rounded-xl border border-slate-200 p-5">
          <h2 className="font-semibold text-slate-800 mb-4">{t('health.pain')}</h2>
          <div className="space-y-2 mb-3">
            {([
              ['pain_head', 'painHead'],
              ['pain_back', 'painBack'],
              ['pain_neck', 'painNeck'],
              ['pain_eyes', 'painEyes']
            ] as const).map(([field, key]) => (
              <label key={field} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={health[field]}
                  onChange={e => setHealth(p => ({ ...p, [field]: e.target.checked }))}
                  className="w-4 h-4 accent-blue-600"
                />
                <span className="text-sm text-slate-700">{t(`health.${key}`)}</span>
              </label>
            ))}
          </div>
          <input
            type="text"
            value={health.pain_other}
            onChange={e => setHealth(p => ({ ...p, pain_other: e.target.value }))}
            placeholder={t('health.painOther')}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Опросник */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 space-y-5 lg:col-span-2">
          <h2 className="font-semibold text-slate-800">{t('survey.title')}</h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <SliderField label={t('survey.mood')} value={survey.mood} onChange={s('mood')} />
            <SliderField label={t('survey.anxiety')} value={survey.anxiety_level} onChange={s('anxiety_level')} />
            <SliderField label={t('survey.workSatisfaction')} value={survey.satisfaction_work} onChange={s('satisfaction_work')} />
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('survey.lessonsCount')}</label>
              <input
                type="number" min={0} max={10}
                value={survey.lessons_count}
                onChange={e => setSurvey(p => ({ ...p, lessons_count: e.target.value }))}
                placeholder="4"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-500 mb-1">{t('survey.extraHours')}</label>
              <input
                type="number" min={0} step={0.5}
                value={survey.extra_work_hours}
                onChange={e => setSurvey(p => ({ ...p, extra_work_hours: e.target.value }))}
                placeholder="0"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={survey.felt_overwhelmed}
                onChange={e => setSurvey(p => ({ ...p, felt_overwhelmed: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">{t('survey.feltOverwhelmed')}</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={survey.had_conflicts}
                onChange={e => setSurvey(p => ({ ...p, had_conflicts: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-slate-700">{t('survey.hadConflicts')}</span>
            </label>
          </div>
          <div>
            <label className="block text-xs text-slate-500 mb-1">{t('survey.complaints')}</label>
            <textarea
              value={survey.complaints}
              onChange={e => setSurvey(p => ({ ...p, complaints: e.target.value }))}
              rows={2}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Опишите жалобы за день..."
            />
          </div>
        </div>

        {/* Заметки */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 lg:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-2">{t('health.notes')}</label>
          <textarea
            value={health.notes}
            onChange={e => setHealth(p => ({ ...p, notes: e.target.value }))}
            rows={3}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            placeholder="Дополнительные заметки о самочувствии..."
          />
        </div>
      </div>
    </div>
  )
}
