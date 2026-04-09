'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslation } from 'react-i18next'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import {
  LayoutDashboard, Heart, Calendar, BarChart3,
  Download, User, LogOut, Languages, Menu, X
} from 'lucide-react'
import i18n from '@/lib/i18n'

const navItems = [
  { key: 'dashboard', href: '/dashboard', icon: LayoutDashboard },
  { key: 'health',    href: '/health',    icon: Heart },
  { key: 'schedule',  href: '/schedule',  icon: Calendar },
  { key: 'analytics', href: '/analytics', icon: BarChart3 },
  { key: 'export',    href: '/export',    icon: Download },
  { key: 'profile',   href: '/profile',   icon: User },
]

export default function Sidebar() {
  const { t } = useTranslation()
  const pathname = usePathname()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  const toggleLang = () => {
    const newLang = i18n.language === 'ru' ? 'kz' : 'ru'
    i18n.changeLanguage(newLang)
    localStorage.setItem('lang', newLang)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const SidebarContent = () => (
    <>
      {/* Логотип */}
      <div className="p-5 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-800 leading-tight">Health Impact</div>
            <div className="text-xs text-slate-500">Monitor</div>
          </div>
        </div>
        <div className="mt-1 text-xs text-slate-400">СКУ им. М.Козыбаева</div>
      </div>

      {/* Навигация */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ key, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={key}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(`nav.${key}`)}
            </Link>
          )
        })}
      </nav>

      {/* Язык + Выход */}
      <div className="p-3 border-t border-slate-200 space-y-1">
        <button
          onClick={toggleLang}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <Languages className="w-4 h-4" />
          {i18n.language === 'ru' ? 'Қазақша' : 'Русский'}
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          {t('nav.logout')}
        </button>
      </div>
    </>
  )

  return (
    <>
      {/* Десктоп — боковая панель */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-white border-r border-slate-200 flex-col shadow-sm">
        <SidebarContent />
      </aside>

      {/* Мобилка — верхний хедер */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-white border-b border-slate-200 flex items-center justify-between px-4 h-14 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
            <Heart className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-bold text-slate-800">Health Monitor</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg text-slate-600 hover:bg-slate-100"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Мобилка — выдвижное меню (drawer) */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          {/* Затемнение */}
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setMobileOpen(false)}
          />
          {/* Панель */}
          <aside className="relative w-72 bg-white flex flex-col shadow-xl">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Мобилка — нижняя навигация */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 flex items-center justify-around px-2 h-16 shadow-lg">
        {navItems.slice(0, 5).map(({ key, href, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/')
          return (
            <Link
              key={key}
              href={href}
              className={`flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg transition-colors ${
                active ? 'text-blue-600' : 'text-slate-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{t(`nav.${key}`)}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
