import { useTranslation } from 'react-i18next'
import { Store, Upload, RotateCcw } from 'lucide-react'
import { Card } from '../../../components/ui/Card'
import { Button } from '../../../components/ui/Button'

interface TitlebarIconCardProps {
  iconUrl: string | null
  loadingIcon: boolean
  onPickIcon: () => void
  onResetIcon: () => void
}

/**
 * TitlebarIconCard: Sleek UI card for titlebar icon customization.
 */
export function TitlebarIconCard({
  iconUrl,
  loadingIcon,
  onPickIcon,
  onResetIcon,
}: TitlebarIconCardProps) {
  const { t } = useTranslation()

  return (
    <Card
      title={t('settings.titlebarIcon')}
      subtitle={t('settings.titlebarIconSubtitle')}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-1">
        {/* Current Icon Preview */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-12 h-12 rounded-[5px] border border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-800 overflow-hidden shrink-0 shadow-xs">
            {iconUrl ? (
              <img src={iconUrl} alt="Titlebar Icon" className="w-full h-full object-cover" />
            ) : (
              <Store className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-800 dark:text-slate-100">
                {iconUrl ? t('settings.customIconActive') : t('settings.defaultStoreIcon')}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-[5px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-medium">
                {t('common.live')}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
              {t('settings.liveUpdateNotice')}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <Button
            variant="primary"
            onClick={onPickIcon}
            isLoading={loadingIcon}
            icon={<Upload className="w-3.5 h-3.5" />}
          >
            {t('settings.changeIcon')}
          </Button>

          {iconUrl && (
            <Button
              variant="outline"
              onClick={onResetIcon}
              disabled={loadingIcon}
              icon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              {t('common.reset')}
            </Button>
          )}
        </div>
      </div>
    </Card>
  )
}
