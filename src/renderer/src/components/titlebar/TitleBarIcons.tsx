import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Store } from 'lucide-react'
import { ThemeToggle } from '../../core/theme/ThemeContext'

export function TitleBarIcons() {
  const { t } = useTranslation()
  const [iconUrl, setIconUrl] = useState<string | null>(null)

  useEffect(() => {
    window.api?.settings?.get?.('userIcon')?.then?.(setIconUrl)
    const unsubscribe = window.api?.settings?.onIconChange?.((newIcon) => {
      setIconUrl(newIcon)
    })
    return () => {
      unsubscribe?.()
    }
  }, [])

  return (
    <div
      className="flex items-center gap-2 px-3"
      style={{ WebkitAppRegion: 'no-drag' } as React.CSSProperties}
    >
      {iconUrl ? (
        <img src={iconUrl} alt="User" className="h-4 w-4 rounded-full object-cover" />
      ) : (
        <Store className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
      )}
      <span className="text-xs font-medium text-gray-600 dark:text-slate-200">
        {t('app.titlebar')}
      </span>
      <div className="flex items-center ml-1.5" title="Switch Theme">
        <ThemeToggle size="8px" />
      </div>
    </div>
  )
}