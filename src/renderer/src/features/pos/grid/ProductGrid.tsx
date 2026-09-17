import { PackagePlus, Plus } from 'lucide-react'
import type { Product } from '../../../core/types'
import { Button } from '../../../components/ui/Button'
import { CategoryPills } from './CategoryPills'
import { ProductCard } from './ProductCard'

interface ProductGridProps {
  products: Product[]
  categories: string[]
  selectedCategory: string
  onSelectCategory: (cat: string) => void
  onAddToCart: (product: Product) => void
  onOpenQuickAdd: () => void
}

/**
 * ProductGrid: Complete modular product catalog grid for POS.
 */
export function ProductGrid({
  products,
  categories,
  selectedCategory,
  onSelectCategory,
  onAddToCart,
  onOpenQuickAdd,
}: ProductGridProps) {
  return (
    <div className="flex-1 flex flex-col gap-2 min-h-0">
      {/* Category Pills Navigation */}
      {categories.length > 1 && (
        <CategoryPills
          categories={categories}
          selectedCategory={selectedCategory}
          onSelectCategory={onSelectCategory}
        />
      )}

      {/* Grid Content */}
      {products.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8 bg-white border border-gray-200/90 rounded-[5px] text-center shadow-xs">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
            <PackagePlus className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-gray-800 mb-1">
            {selectedCategory === 'all' ? 'No products added yet' : `No products in ${selectedCategory}`}
          </h3>
          <p className="text-xs text-gray-400 max-w-sm mb-4">
            Add products with their price, stock amount, and unit of measure to start selling.
          </p>
          <Button
            variant="primary"
            onClick={onOpenQuickAdd}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            Add First Item
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 overflow-y-auto pr-0.5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} />
          ))}
        </div>
      )}
    </div>
  )
}
