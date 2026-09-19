import { useTranslation } from 'react-i18next'
import {
  Store,
  Languages,
  Image,
  Database,
  ArrowUpCircle,
  ChevronRight,
} from 'lucide-react'
import Version from '@renderer/components/Version'

export type SettingTabId = 'profile' | 'language' | 'icon' | 'backup' | 'update'

interface SettingTabsProps {
  activeTab: SettingTabId
  onChangeTab: (tab: SettingTabId) => void
}

/**
 * SettingTabs: Left-side navigation tabs for clean separation of application settings.
 */
export function SettingTabs({ activeTab, onChangeTab }: SettingTabsProps) {
  const { t } = useTranslation()

  const tabs: Array<{
    id: SettingTabId
    title: string
    subtitle: string
    icon: typeof Store
  }> = [
    {
      id: 'profile',
      title: t('settings.storeProfile', 'Store Profile'),
      subtitle: t('settings.storeProfileNav', 'Business info & receipts'),
      icon: Store,
    },
    {
      id: 'language',
      title: t('settings.languageSection', 'Language & Region'),
      subtitle: t('settings.languageNav', 'Farsi, Pashto, English'),
      icon: Languages,
    },
    {
      id: 'icon',
      title: t('settings.titlebarIcon', 'Titlebar & Logo'),
      subtitle: t('settings.titlebarIconNav', 'Window icon & receipt logo'),
      icon: Image,
    },
    {
      id: 'backup',
      title: t('settings.backupNav', 'Database & Backup'),
      subtitle: t('settings.backupSubtitleNav', 'Excel export & snapshots'),
      icon: Database,
    },
    {
      id: 'update',
      title: t('settings.updatesNav', 'Software Updates'),
      subtitle: t('settings.updatesSubtitleNav', 'Version & release sync'),
      icon: ArrowUpCircle,
    },
  ]

  return (
    <nav className="bg-white dark:bg-slate-900 border border-gray-200/80 dark:border-slate-800 rounded-xl p-2.5 shadow-xs flex flex-col justify-between h-full select-none">
      <div className="flex flex-col gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChangeTab(tab.id)}
              className={`
                w-full flex items-center justify-between p-2.5 rounded-lg text-left transition-all duration-150 cursor-pointer
                ${
                  isActive
                    ? 'bg-[#5A8F7B]/10 dark:bg-[#5A8F7B]/20 text-[#3D665B] dark:text-[#7EBCA8] shadow-2xs font-semibold'
                    : 'text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-slate-800 font-medium'
                }
              `}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`
                    w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors
                    ${
                      isActive
                        ? 'bg-[#5A8F7B] text-white shadow-xs'
                        : 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400 group-hover:bg-gray-200 dark:group-hover:bg-slate-700'
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-xs truncate font-semibold leading-tight text-gray-900 dark:text-slate-100">
                    {tab.title}
                  </span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-400 truncate leading-normal mt-0.5">
                    {tab.subtitle}
                  </span>
                </div>
              </div>

              <ChevronRight
                className={`w-3.5 h-3.5 shrink-0 rtl:rotate-180 transition-transform ${
                  isActive ? 'text-[#3D665B] dark:text-[#7EBCA8] opacity-100 translate-x-0.5 rtl:-translate-x-0.5' : 'text-gray-300 dark:text-slate-600 opacity-60'
                }`}
              />
            </button>
          )
        })}
      </div>

      <div className="mt-auto pt-3 border-t border-gray-100 dark:border-slate-800 flex flex-col gap-1 px-2.5 pb-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-gray-700 dark:text-slate-300">Hesabdar POS</span>
          <Version showBadge className="bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/50 font-mono font-bold text-[10px]" />
        </div>
        <span className="text-[10px] text-gray-400 dark:text-slate-500">Store &amp; Inventory Management</span>
      </div>
    </nav>
  )
}

export default SettingTabs
