import { Tag } from 'lucide-react'

interface CategoryPillsProps {
  categories: string[]
  selectedCategory: string
  onSelectCategory: (cat: string) => void
}

/**
 * CategoryPills: Sleek filter pill row for rapid touch browsing of commodities.
 */
export function CategoryPills({
  categories,
  selectedCategory,
  onSelectCategory,
}: CategoryPillsProps) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
      <div className="flex items-center gap-1 text-[10px] text-gray-400 font-medium pe-1 shrink-0">
        <Tag className="w-3 h-3 text-emerald-600" />
        <span>Categories:</span>
      </div>
      {categories.map((cat) => {
        const isSelected = selectedCategory === cat
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelectCategory(cat)}
            className={`text-[11px] px-2.5 py-1 rounded-[5px] font-medium shrink-0 transition-colors ${
              isSelected
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700 hover:border-gray-300 dark:hover:border-slate-600'
            }`}
          >
            {cat === 'all' ? 'All Items' : cat}
          </button>
        )
      })}
    </div>
  )
}
