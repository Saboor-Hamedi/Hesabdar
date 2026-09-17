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
          <Globe className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">{t('settings.chooseLanguage')}</span>
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
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-900 shadow-xs'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50 text-gray-700'
                  }
                `}
              >
                <div className="flex flex-col">
                  <span className="text-xs font-semibold">{name}</span>
                  <span className="text-[10px] text-gray-400 uppercase tracking-wider">
                    {code} • {dir.toUpperCase()}
                  </span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-emerald-600" />}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}
