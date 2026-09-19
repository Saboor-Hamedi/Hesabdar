import { useTranslation } from 'react-i18next'
import { Globe, Check } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { LANGUAGES, type LangCode } from '../../../i18n'

interface LanguageCardProps {
  currentLanguage: LangCode
  onSwitchLanguage: (lang: LangCode) => void
}

/**
 * LanguageCard: Sleek trilingual selection card (English, Persian/Dari, Pashto).
 */
export function LanguageCard({ currentLanguage, onSwitchLanguage }: LanguageCardProps) {
  const { t } = useTranslation()

  return (
    <Card
      title={t('settings.languageSection')}
      subtitle={t('settings.languageSubtitle')}
    >
      <div className="flex flex-col gap-2 py-1">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-gray-500 dark:text-slate-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-slate-200">{t('settings.chooseLanguage')}</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-1">
          {LANGUAGES.map(({ code, name, dir }) => {
            const isSelected = currentLanguage === code
            return (
              <div
                key={code}
                onClick={() => onSwitchLanguage(code as LangCode)}
                className={`
                  flex items-center justify-between p-2.5 rounded-[5px] border cursor-pointer
                  transition-colors duration-150
                  ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 shadow-xs'
                      : 'border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-gray-300 dark:hover:border-slate-700 hover:bg-gray-50/50 dark:hover:bg-slate-800/60 text-gray-700 dark:text-slate-200'
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{name}</span>
                  <span className="text-[10px] text-gray-400 dark:text-slate-500 uppercase tracking-wider">
                    {code} • {dir.toUpperCase()}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
