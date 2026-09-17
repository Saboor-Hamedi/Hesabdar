import { useTranslation } from 'react-i18next'
import { useSettings } from '../hooks/useSettings'
import { TitlebarIconCard } from '../icon/TitlebarIconCard'
import { LanguageCard } from '../language/LanguageCard'
import { StoreProfileCard } from '../profile/StoreProfileCard'
import { BackupCard } from '../backup/BackupCard'
import { AppUpdateCard } from '../update/AppUpdateCard'

/**
 * SettingsView: Modular configuration view orchestrating separated icon, language, profile, and backup cards.
 */
export function SettingsView() {
  const { t } = useTranslation()
  const {
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
  } = useSettings()

  return (
    <div className="flex flex-col gap-4 max-w-4xl mx-auto select-none">
      {/* Page Header */}
      <div>
        <h2 className="text-sm font-bold text-gray-800">{t('settings.title')}</h2>
        <p className="text-[11px] text-gray-400 mt-0.5">{t('settings.subtitle')}</p>
      </div>

      {/* 1. App Titlebar Icon Card */}
      <TitlebarIconCard
        iconUrl={iconUrl}
        loadingIcon={loadingIcon}
        onPickIcon={pickIcon}
        onResetIcon={resetIcon}
      />

      {/* 2. Application Language Card */}
      <LanguageCard
        currentLanguage={language}
        onSwitchLanguage={switchLanguage}
      />

      {/* 3. Shop Profile & Business Info */}
      <StoreProfileCard
        form={form}
        errors={errors}
        savedSuccess={savedSuccess}
        onChangeForm={setForm}
        onSave={saveProfile}
      />

      {/* 4. Database Backup & Safety */}
      <BackupCard />

      {/* 5. Software & App Updates */}
      <AppUpdateCard />
    </div>
  )
}

export default SettingsView
