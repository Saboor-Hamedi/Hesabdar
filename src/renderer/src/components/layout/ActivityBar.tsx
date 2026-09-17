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
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

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
}

/**
 * ActivityBar: Side icon rail with live translations and 5px radius buttons.
 */
export function ActivityBar({ active, onChange }: Props) {
  const { t } = useTranslation()

  return (
    <nav className="flex w-14 flex-col items-center gap-1 border-e border-gray-200 bg-gray-50 py-2 select-none">
      {ACTIVITY_ITEMS.map(({ id, icon: Icon }) => {
        const isActive = active === id
        const label = t(`nav.${id}`)
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            aria-label={label}
            title={label}
            className={
              'group relative flex h-10 w-10 items-center justify-center rounded-[5px] ' +
              'transition-colors duration-150 ' +
              (isActive
                ? 'bg-emerald-50 text-emerald-700 font-medium'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800')
            }
          >
            {isActive && (
              <span className="absolute inset-y-1.5 start-0 w-0.5 rounded-full bg-emerald-600" />
            )}
            <Icon className="h-4.5 w-4.5" />
          </button>
        )
      })}
    </nav>
  )
}