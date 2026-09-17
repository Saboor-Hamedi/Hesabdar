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
    <nav className="flex w-14 flex-col items-center gap-2.5 border-e border-gray-200/60 bg-[#FAFAFA] py-3 select-none">
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
              'group relative flex h-10 w-10 items-center justify-center rounded-[8px] ' +
              'transition-all duration-150 cursor-pointer ' +
              (isActive
                ? 'bg-[#4A7C6F]/12 text-[#3D665B] shadow-[0_1px_2px_rgba(0,0,0,0.03)]'
                : 'text-gray-400 hover:bg-gray-200/60 hover:text-gray-700')
            }
          >
            {isActive && (
              <span className="absolute inset-y-2 start-0 w-0.5 rounded-full bg-[#4A7C6F]" />
            )}
            <Icon className="h-4.5 w-4.5" />
          </button>
        )
      })}
    </nav>
  )
}