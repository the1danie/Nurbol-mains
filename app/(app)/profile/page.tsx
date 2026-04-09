'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import { useTeacher } from '@/hooks/useTeacher'
import { CheckCircle, User } from 'lucide-react'

export default function ProfilePage() {
  const { t } = useTranslation()
  const { teacher, loading, updateTeacher } = useTeacher()
  const [form, setForm] = useState({
    full_name: '',
    department: '',
    position: '',
    years_of_experience: '',
  })
  const [saved, setSaved] = useState(false)
  const [saving, setSaving] = useState(false)

  // Заполнить форму при загрузке
  if (teacher && !form.full_name && teacher.full_name) {
    setForm({
      full_name: teacher.full_name || '',
      department: teacher.department || '',
      position: teacher.position || '',
      years_of_experience: teacher.years_of_experience?.toString() || '',
    })
  }

  const handleSave = async () => {
    setSaving(true)
    await updateTeacher({
      full_name: form.full_name,
      department: form.department || null,
      position: form.position || null,
      years_of_experience: form.years_of_experience ? Number(form.years_of_experience) : null,
    })
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  if (loading) return <div className="p-6 text-slate-500">{t('common.loading')}</div>

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">{t('profile.title')}</h1>

      <div className="bg-white rounded-xl border border-slate-200 p-6">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-100">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <User className="w-8 h-8 text-blue-600" />
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-lg">{teacher?.full_name}</div>
            <div className="text-sm text-slate-500">{teacher?.department || 'Кафедра не указана'}</div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.fullName')}</label>
            <input
              type="text"
              value={form.full_name}
              onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.department')}</label>
            <input
              type="text"
              value={form.department}
              onChange={e => setForm(p => ({ ...p, department: e.target.value }))}
              placeholder="Кафедра информатики и математики"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.position')}</label>
            <input
              type="text"
              value={form.position}
              onChange={e => setForm(p => ({ ...p, position: e.target.value }))}
              placeholder="Старший преподаватель"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.experience')}</label>
            <input
              type="number"
              min={0}
              value={form.years_of_experience}
              onChange={e => setForm(p => ({ ...p, years_of_experience: e.target.value }))}
              placeholder="10"
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="mt-6 flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          {saved ? <CheckCircle className="w-4 h-4" /> : null}
          {saved ? t('profile.saved') : saving ? t('common.loading') : t('profile.save')}
        </button>
      </div>
    </div>
  )
}
