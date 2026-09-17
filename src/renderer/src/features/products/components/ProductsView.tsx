import { useTranslation } from 'react-i18next'
import { Plus, Package } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { Button } from '../../../components/ui/Button'
import { type CatalogItem, findCatalogItemByQuery } from '../../../core/products/catalogData'
import { ProductStats } from '../stats/ProductStats'
import { ProductsTable } from '../table/ProductsTable'
import { ProductModal } from '../modal/ProductModal'

/**
 * ProductsView: Sleek inventory view cleanly orchestrated with modular subcomponents.
 */
export function ProductsView() {
  const { t } = useTranslation()
  const {
    products,
    isModalOpen,
    editingProduct,
    form,
    setForm,
    errors,
    openCreateModal,
    openEditModal,
    closeModal,
    submitProduct,
    removeProduct,
    adjustStock,
  } = useProducts()

  // Select catalog preset to auto-fill English, Persian, and Pashto names and unit
  const handleSelectCatalogItem = (item: CatalogItem) => {
    setForm((f) => ({
      ...f,
      name_en: item.name_en,
      name_fa: item.name_fa,
      name_ps: item.name_ps,
      unit: item.unit,
      cost_price: item.suggested_price ? Math.round(item.suggested_price * 0.75) : f.cost_price,
      sell_price: item.suggested_price || f.sell_price,
    }))
  }

  // Handle smart auto-fill when user types in English name (e.g. "Oil")
  const handleEnglishNameChange = (val: string) => {
    setForm((f) => {
      const match = findCatalogItemByQuery(val)
      if (match && (!f.name_fa || f.name_fa === match.name_fa || !f.name_ps)) {
        return {
          ...f,
          name_en: val,
          name_fa: match.name_fa,
          name_ps: match.name_ps,
          unit: match.unit,
        }
      }
      return { ...f, name_en: val }
    })
  }

  // Handle smart auto-fill when user types in Persian name
  const handlePersianNameChange = (val: string) => {
    setForm((f) => {
      const match = findCatalogItemByQuery(val)
      if (match && (!f.name_en || !f.name_ps)) {
        return {
          ...f,
          name_fa: val,
          name_en: f.name_en || match.name_en,
          name_ps: f.name_ps || match.name_ps,
          unit: match.unit,
        }
      }
      return { ...f, name_fa: val }
    })
  }

  return (
    <div className="flex flex-col gap-4 max-w-7xl mx-auto select-none">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold text-gray-800 flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-600" />
            {t('products.title')}
          </h2>
          <p className="text-[11px] text-gray-400 mt-0.5">{t('products.subtitle')}</p>
        </div>

        <Button variant="primary" onClick={openCreateModal} icon={<Plus className="w-3.5 h-3.5" />}>
          {t('products.addProduct')}
        </Button>
      </div>

      {/* 1. Inventory Summary KPI Cards */}
      <ProductStats products={products} />

      {/* 2. Products Data Table */}
      <ProductsTable
        products={products}
        onAdjustStock={adjustStock}
        onEditProduct={openEditModal}
        onRemoveProduct={removeProduct}
      />

      {/* 3. Spacious Add/Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        form={form}
        errors={errors}
        editingProduct={editingProduct}
        onSelectCatalogItem={handleSelectCatalogItem}
        onEnglishNameChange={handleEnglishNameChange}
        onPersianNameChange={handlePersianNameChange}
        onChangeForm={setForm}
        onSubmit={submitProduct}
      />
    </div>
  )
}

export default ProductsView
