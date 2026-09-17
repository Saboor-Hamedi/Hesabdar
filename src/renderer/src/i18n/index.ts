import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import fa from './fa.json'
import ps from './ps.json'
import en from './en.json'

export const LANGUAGES = [
  { code: 'en', name: 'English',     dir: 'ltr' },
  { code: 'fa', name: 'فارسی / دری', dir: 'rtl' },
  { code: 'ps', name: 'پښتو',        dir: 'rtl' },
] as const

export type LangCode = (typeof LANGUAGES)[number]['code']

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fa: { translation: fa },
    ps: { translation: ps },
  },
  lng: 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function applyDirection(lang: string) {
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? 'ltr'
  document.documentElement.dir = dir
  document.documentElement.lang = lang
}

export async function initLanguage(): Promise<string> {
  try {
    const saved = await window.api?.language?.get?.()
    const lang = (saved as LangCode) || 'en'
    await i18n.changeLanguage(lang)
    applyDirection(lang)
    return lang
  } catch {
    applyDirection('en')
    return 'en'
  }
}

export async function setAppLanguage(lang: LangCode): Promise<void> {
  await i18n.changeLanguage(lang)
  applyDirection(lang)
  try {
    await window.api?.language?.set?.(lang)
  } catch (err) {
    console.error('Failed to persist language to language.json:', err)
  }
}

export default i18n