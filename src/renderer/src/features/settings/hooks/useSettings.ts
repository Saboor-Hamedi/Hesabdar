import { useState, useEffect, useCallback } from 'react'
import { setAppLanguage, type LangCode } from '../../../i18n'
import { SettingsSchema, type SettingsFormValues } from '../../../core/validation/schemas'
import { validateForm } from '../../../core/validation/validator'

export function useSettings() {
  const [iconUrl, setIconUrl] = useState<string | null>(null)
  const [language, setLanguageState] = useState<LangCode>('en')
  const [form, setForm] = useState<SettingsFormValues>(() => {
    try {
      const cached = localStorage.getItem('hesabdar_store_profile')
      if (cached) return JSON.parse(cached)
    } catch {}
    return {
      storeName: 'Hesabdar Supermarket',
      phone: '0799123456',
      address: 'Kabul, Afghanistan',
      currency: 'AFN',
      taxRate: 0,
      language: 'en',
    }
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [savedSuccess, setSavedSuccess] = useState(false)
  const [loadingIcon, setLoadingIcon] = useState(false)

  // Load initial settings and subscribe to icon updates
  useEffect(() => {
    // Fetch active user icon
    window.api?.settings?.get?.('userIcon')?.then?.((icon) => {
      if (icon) setIconUrl(icon)
    })

    // Fetch active language
    window.api?.language?.get?.().then?.((lang) => {
      if (lang) {
        setLanguageState(lang as LangCode)
        setForm((f) => ({ ...f, language: lang as LangCode }))
      }
    })

    // Fetch store profile
    window.api?.settings?.get?.('storeProfile')?.then?.((profile) => {
      if (profile) setForm((f) => ({ ...f, ...profile }))
    })

    // Real-time listener for titlebar icon changes
    const unsub = window.api?.settings?.onIconChange?.((newIcon) => {
      setIconUrl(newIcon)
    })

    return () => {
      unsub?.()
    }
  }, [])

  // Change app icon on titlebar via native file picker dialog
  const pickIcon = useCallback(async () => {
    try {
      setLoadingIcon(true)
      const newIcon = await window.api?.settings?.pickIcon?.()
      if (newIcon) {
        setIconUrl(newIcon)
      }
    } catch (err) {
      console.error('Failed to pick icon:', err)
    } finally {
      setLoadingIcon(false)
    }
  }, [])

  // Reset titlebar icon back to default Store icon
  const resetIcon = useCallback(async () => {
    try {
      setLoadingIcon(true)
      await window.api?.settings?.resetIcon?.()
      setIconUrl(null)
    } catch (err) {
      console.error('Failed to reset icon:', err)
    } finally {
      setLoadingIcon(false)
    }
  }, [])

  // Switch application language and persist to language.json
  const switchLanguage = useCallback(async (lang: LangCode) => {
    setLanguageState(lang)
    setForm((f) => ({ ...f, language: lang }))
    await setAppLanguage(lang)
  }, [])

  // Save store profile with super advanced validation
  const saveProfile = useCallback(async () => {
    const result = validateForm(SettingsSchema, form)
    if (!result.success) {
      setErrors(result.errors)
      return false
    }

    setErrors({})
    try {
      localStorage.setItem('hesabdar_store_profile', JSON.stringify(form))
      await window.api?.settings?.set?.('storeProfile', form)
      setSavedSuccess(true)
      setTimeout(() => setSavedSuccess(false), 3000)
      return true
    } catch (err) {
      console.error('Failed to save settings:', err)
      return false
    }
  }, [form])

  return {
    iconUrl,
    language,
    form,
    setForm,
    errors,
    savedSuccess,
    loadingIcon,
    pickIcon,
    resetIcon,
    switchLanguage,
    saveProfile,
  }
}
