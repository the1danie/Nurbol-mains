'use client'

import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import ru from '@/locales/ru.json'
import kz from '@/locales/kz.json'

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .init({
      resources: {
        ru: { translation: ru },
        kz: { translation: kz },
      },
      lng: typeof window !== 'undefined'
        ? (localStorage.getItem('lang') || 'ru')
        : 'ru',
      fallbackLng: 'ru',
      interpolation: { escapeValue: false },
    })
}

export default i18n
