'use client'

export const dynamic = 'force-dynamic'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Sidebar from '@/components/Sidebar'
import I18nProvider from '@/components/I18nProvider'
import { useAuth } from '@/hooks/useAuth'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login')
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-slate-500">Загрузка...</div>
      </div>
    )
  }

  if (!user) return null

  return (
    <I18nProvider>
      <div className="flex min-h-screen bg-slate-50">
        <Sidebar />
        <main className="flex-1 overflow-auto pt-14 pb-16 lg:pt-0 lg:pb-0">
          {children}
        </main>
      </div>
    </I18nProvider>
  )
}
