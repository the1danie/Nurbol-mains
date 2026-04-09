'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/hooks/useAuth'
import { CheckCircle, RefreshCw, Brain } from 'lucide-react'

type Answers = Record<string, number | null>

const QUESTIONS = [
  {
    scale: 'wellbeing',
    label: 'Самочувствие',
    items: [
      { key: 'q1',  neg: 'Плохое',      pos: 'Хорошее'  },
      { key: 'q2',  neg: 'Слабость',    pos: 'Сила'      },
      { key: 'q3',  neg: 'Усталость',   pos: 'Бодрость'  },
      { key: 'q4',  neg: 'Болезненное', pos: 'Здоровое'  },
    ],
  },
  {
    scale: 'activity',
    label: 'Активность',
    items: [
      { key: 'q5',  neg: 'Пассивность',  pos: 'Активность'         },
      { key: 'q6',  neg: 'Вялость',      pos: 'Энергичность'       },
      { key: 'q7',  neg: 'Медлительность', pos: 'Быстрота'         },
      { key: 'q8',  neg: 'Безразличие',  pos: 'Заинтересованность' },
    ],
  },
  {
    scale: 'mood',
    label: 'Настроение',
    items: [
      { key: 'q9',  neg: 'Плохое',      pos: 'Хорошее'   },
      { key: 'q10', neg: 'Грустное',    pos: 'Радостное'  },
      { key: 'q11', neg: 'Напряжённое', pos: 'Спокойное'  },
      { key: 'q12', neg: 'Тревожное',   pos: 'Уверенное'  },
    ],
  },
]

const SCALE_STYLES: Record<string, {
  header: string
  headerText: string
  selected: string
}> = {
  wellbeing: {
    header: 'bg-blue-50',
    headerText: 'text-blue-700',
    selected: 'bg-blue-600 border-blue-600 text-white',
  },
  activity: {
    header: 'bg-emerald-50',
    headerText: 'text-emerald-700',
    selected: 'bg-emerald-600 border-emerald-600 text-white',
  },
  mood: {
    header: 'bg-violet-50',
    headerText: 'text-violet-700',
    selected: 'bg-violet-600 border-violet-600 text-white',
  },
}

function getLevel(score: number): { label: string; color: string } {
  if (score <= 3.0) return { label: 'Низкий', color: 'text-red-600' }
  if (score <= 5.0) return { label: 'Средний', color: 'text-yellow-600' }
  return { label: 'Высокий', color: 'text-green-600' }
}

function avg(values: (number | null)[]): number {
  const nums = values.filter((v): v is number => v !== null)
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}

const defaultAnswers: Answers = {
  q1: null, q2: null, q3: null, q4: null,
  q5: null, q6: null, q7: null, q8: null,
  q9: null, q10: null, q11: null, q12: null,
}

export default function SanPage() {
  const { user } = useAuth()
  const [answers, setAnswers] = useState<Answers>(defaultAnswers)
  const [result, setResult] = useState<{ wellbeing: number; activity: number; mood: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [existingId, setExistingId] = useState<string | null>(null)
  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    if (!user) return
    supabase
      .from('san_tests')
      .select('*')
      .eq('teacher_id', user.id)
      .eq('date', today)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (data) {
          setExistingId(data.id)
          const loaded: Answers = {}
          for (let i = 1; i <= 12; i++) loaded[`q${i}`] = data[`q${i}`] ?? null
          setAnswers(loaded)
          setResult({ wellbeing: data.wellbeing, activity: data.activity, mood: data.mood })
        }
      })
  }, [user, today])

  const allAnswered = Object.values(answers).every(v => v !== null)

  const handleSubmit = async () => {
    if (!allAnswered || !user) return

    const wellbeing = parseFloat(avg([answers.q1, answers.q2, answers.q3, answers.q4]).toFixed(2))
    const activity  = parseFloat(avg([answers.q5, answers.q6, answers.q7, answers.q8]).toFixed(2))
    const mood      = parseFloat(avg([answers.q9, answers.q10, answers.q11, answers.q12]).toFixed(2))

    setResult({ wellbeing, activity, mood })
    setSaving(true)

    const payload = {
      teacher_id: user.id,
      date: today,
      ...answers,
      wellbeing,
      activity,
      mood,
    }

    if (existingId) {
      await supabase.from('san_tests').update(payload).eq('id', existingId)
    } else {
      const { data } = await supabase.from('san_tests').insert(payload).select().single()
      if (data) setExistingId(data.id)
    }

    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  const handleReset = () => {
    setAnswers(defaultAnswers)
    setResult(null)
    setExistingId(null)
    setSaved(false)
  }

  return (
    <div className="p-4 sm:p-6 max-w-3xl mx-auto pb-24 lg:pb-6">
      {/* Заголовок */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
          <Brain className="w-5 h-5 text-violet-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-slate-800">САН-тест</h1>
          <p className="text-sm text-slate-500">Самочувствие · Активность · Настроение</p>
        </div>
      </div>

      {/* Инструкция */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 text-sm text-blue-800">
        Оцените своё текущее состояние по каждой строке, выбрав значение от <b>1</b> (максимально негативное) до <b>7</b> (максимально позитивное).
      </div>

      {/* Вопросы */}
      <div className="space-y-6">
        {QUESTIONS.map((section) => {
          const styles = SCALE_STYLES[section.scale]
          return (
            <div key={section.scale} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
              <div className={`px-5 py-3 ${styles.header}`}>
                <h2 className={`font-semibold ${styles.headerText}`}>{section.label}</h2>
              </div>
              <div className="divide-y divide-slate-100">
                {section.items.map(({ key, neg, pos }) => (
                  <div key={key} className="px-4 py-3 space-y-2">
                    {/* Метки — на мобилке сверху, на десктопе по бокам */}
                    <div className="flex items-center justify-between sm:hidden">
                      <span className="text-xs text-slate-500 leading-tight">{neg}</span>
                      <span className="text-xs text-slate-500 leading-tight">{pos}</span>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3">
                      {/* Левая метка — только десктоп */}
                      <span className="hidden sm:block text-xs text-slate-500 w-28 text-right shrink-0 leading-tight">{neg}</span>
                      {/* Кнопки */}
                      <div className="flex items-center justify-between sm:justify-center gap-1 sm:gap-2 flex-1">
                        {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                          <label key={val} className="cursor-pointer">
                            <input
                              type="radio"
                              name={key}
                              value={val}
                              checked={answers[key] === val}
                              onChange={() => setAnswers(prev => ({ ...prev, [key]: val }))}
                              className="sr-only"
                            />
                            <div
                              className={`w-9 h-9 sm:w-9 sm:h-9 rounded-full border-2 flex items-center justify-center text-sm font-semibold transition-all active:scale-95 ${
                                answers[key] === val
                                  ? styles.selected
                                  : 'border-slate-300 text-slate-400'
                              }`}
                            >
                              {val}
                            </div>
                          </label>
                        ))}
                      </div>
                      {/* Правая метка — только десктоп */}
                      <span className="hidden sm:block text-xs text-slate-500 w-28 shrink-0 leading-tight">{pos}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Кнопка */}
      {!result && (
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || saving}
            className="w-full bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors"
          >
            {saving ? 'Сохранение...' : 'Получить результат'}
          </button>
          {!allAnswered && (
            <p className="text-center text-xs text-slate-400 mt-2">Ответьте на все вопросы</p>
          )}
        </div>
      )}

      {/* Результат */}
      {result && (
        <div className="mt-6 space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              { key: 'wellbeing', label: 'Самочувствие', score: result.wellbeing, card: 'bg-blue-50 border-blue-200', text: 'text-blue-700' },
              { key: 'activity',  label: 'Активность',   score: result.activity,  card: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
              { key: 'mood',      label: 'Настроение',   score: result.mood,      card: 'bg-violet-50 border-violet-200', text: 'text-violet-700' },
            ].map(({ key, label, score, card, text }) => {
              const level = getLevel(score)
              return (
                <div key={key} className={`${card} border rounded-xl p-4 text-center`}>
                  <div className={`text-2xl font-bold ${text}`}>{score.toFixed(1)}</div>
                  <div className="text-xs font-medium text-slate-600 mt-0.5">{label}</div>
                  <div className={`text-xs font-semibold mt-1 ${level.color}`}>{level.label}</div>
                </div>
              )
            })}
          </div>

          {/* Интерпретация */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-slate-700 space-y-1">
            <div className="font-semibold text-slate-800 mb-2">Интерпретация</div>
            <div className="flex gap-4 text-xs">
              <span className="text-red-600 font-medium">1.0–3.0 — Низкий</span>
              <span className="text-yellow-600 font-medium">3.1–5.0 — Средний</span>
              <span className="text-green-600 font-medium">5.1–7.0 — Высокий</span>
            </div>
          </div>

          {/* Рекомендация */}
          {(result.wellbeing < 3.5 || result.activity < 3.5 || result.mood < 3.5) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800">
              <b>Рекомендация:</b> один или несколько показателей ниже нормы. Рекомендуется обратить внимание на режим отдыха и уровень рабочей нагрузки.
            </div>
          )}

          {saved && (
            <div className="flex items-center gap-2 text-green-700 bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm">
              <CheckCircle className="w-4 h-4 shrink-0" />
              Результат сохранён
            </div>
          )}

          <button
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 border border-slate-300 text-slate-600 hover:bg-slate-50 font-medium py-3 rounded-xl transition-colors text-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Пройти тест заново
          </button>
        </div>
      )}
    </div>
  )
}
