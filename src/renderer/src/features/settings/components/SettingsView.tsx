import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Settings } from 'lucide-react'
import { PageHeader } from '../../../components/layout/PageHeader'
import { useSettings } from '../hooks/useSettings'
import { SettingTabs, type SettingTabId } from './SettingTabs'
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
  const [activeTab, setActiveTab] = useState<SettingTabId>('profile')
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
    <div className="flex flex-col h-full min-h-0 gap-3.5 max-w-5xl mx-auto w-full select-none pr-1 pb-2">
      {/* Unified Page Header */}
      <PageHeader
        title={t('settings.title')}
        subtitle={t('settings.subtitle')}
        icon={Settings}
      />

      {/* Main Settings Body: Left Navigation Tabs + Right Active Tab Content */}
      <div className="flex-1 min-h-0 flex flex-col md:flex-row gap-4">
        {/* Left Side Navigation Tabs */}
        <div className="w-full md:w-64 shrink-0 h-full flex flex-col">
          <SettingTabs activeTab={activeTab} onChangeTab={setActiveTab} />
        </div>

        {/* Right Side Active Panel with full vertical room and zero squishing */}
        <div className="flex-1 min-w-0 overflow-y-auto pr-1 pb-4">
          {activeTab === 'profile' && (
            <StoreProfileCard
              form={form}
              errors={errors}
              savedSuccess={savedSuccess}
              onChangeForm={setForm}
              onSave={saveProfile}
            />
          )}

          {activeTab === 'language' && (
            <LanguageCard
              currentLanguage={language}
              onSwitchLanguage={switchLanguage}
            />
          )}

          {activeTab === 'icon' && (
            <TitlebarIconCard
              iconUrl={iconUrl}
              loadingIcon={loadingIcon}
              onPickIcon={pickIcon}
              onResetIcon={resetIcon}
            />
          )}

          {activeTab === 'backup' && (
            <BackupCard />
          )}

          {activeTab === 'update' && (
            <AppUpdateCard />
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsView
