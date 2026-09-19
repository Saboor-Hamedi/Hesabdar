import { useTranslation } from 'react-i18next'
import {
  ShoppingCart,
  Receipt,
  Package,
  LayoutDashboard,
  Users,
  Truck,
  BarChart3,
  Settings,
  ShieldCheck,
  Sun,
  Moon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useTheme } from '../../core/theme/ThemeContext'

export interface ActivityItem {
  id: string
  icon: LucideIcon
}

export const ACTIVITY_ITEMS: ActivityItem[] = [
  { id: 'pos',       icon: ShoppingCart },
  { id: 'sold',      icon: Receipt },
  { id: 'products',  icon: Package },
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'customers', icon: Users },
  { id: 'suppliers', icon: Truck },
  { id: 'reports',   icon: BarChart3 },
  { id: 'settings',  icon: Settings },
]

interface Props {
  active: string
  onChange: (id: string) => void
  isAdmin?: boolean
}

/**
 * ActivityBar: Side icon rail with live translations, dark mode styling,
 * and an animated Sun/Moon theme toggle button at the bottom.
 */
export function ActivityBar({ active, onChange, isAdmin = false }: Props) {
  const { t } = useTranslation()
  const { isDark, toggleTheme } = useTheme()
  const items = isAdmin
    ? [...ACTIVITY_ITEMS, { id: 'admin', icon: ShieldCheck }]
    : ACTIVITY_ITEMS

  return (
    <nav className="flex w-14 flex-col items-center gap-2.5 border-e border-gray-200/60 dark:border-slate-800 bg-[#FAFAFA] dark:bg-slate-900 py-3 select-none h-full shrink-0 transition-colors duration-200">
      {/* Navigation items list */}
      <div className="flex flex-col items-center gap-2.5 w-full">
        {items.map(({ id, icon: Icon }) => {
          const isActive = active === id
          const label = t(`nav.${id}`)
          return (
            <button
              key={id}
              onClick={() => onChange(id)}
              aria-label={label}
              title={label}
              className={
                'group relative flex h-10 w-10 items-center justify-center rounded-[8px] ' +
                'transition-all duration-150 cursor-pointer ' +
                (isActive
                  ? 'bg-[#4A7C6F]/12 dark:bg-[#5A8F7B]/20 text-[#3D665B] dark:text-[#7EBCA8] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                  : 'text-gray-400 dark:text-slate-400 hover:bg-gray-200/60 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200')
              }
            >
              {isActive && (
                <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-[#4A7C6F] dark:bg-[#5A8F7B]" />
              )}
              <Icon className="h-4.5 w-4.5" />
            </button>
          )
        })}
      </div>

      {/* Subtle separator and Animated Theme Switcher at bottom */}
      <div className="mt-auto flex flex-col items-center gap-2 pt-2 border-t border-gray-200/60 dark:border-slate-800 w-10">
        <button
          type="button"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            toggleTheme({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          }}
          aria-label={isDark ? t('theme.light', 'Switch to Light Mode') : t('theme.dark', 'Switch to Dark Mode')}
          title={isDark ? t('theme.light', 'Switch to Light Mode') : t('theme.dark', 'Switch to Dark Mode')}
          className="group relative flex h-10 w-10 items-center justify-center rounded-[8px] text-gray-400 dark:text-slate-400 hover:bg-gray-200/70 dark:hover:bg-slate-800 hover:text-gray-700 dark:hover:text-slate-200 transition-all duration-150 cursor-pointer active:scale-92"
        >
          <div className="relative w-5 h-5 flex items-center justify-center">
            {/* Sun Icon (Slight rotation & scale transition) */}
            <Sun
              className={`w-4.5 h-4.5 transition-all duration-300 ease-out transform ${
                isDark
                  ? 'rotate-90 scale-0 opacity-0 text-amber-400'
                  : 'rotate-0 scale-100 opacity-100 text-amber-500 group-hover:rotate-45'
              }`}
            />
            {/* Moon Icon (Slight rotation & scale transition) */}
            <Moon
              className={`absolute w-4.5 h-4.5 transition-all duration-300 ease-out transform ${
                isDark
                  ? 'rotate-0 scale-100 opacity-100 text-indigo-400 group-hover:-rotate-12'
                  : '-rotate-90 scale-0 opacity-0 text-indigo-400'
              }`}
            />
          </div>
        </button>
      </div>
    </nav>
  )
}