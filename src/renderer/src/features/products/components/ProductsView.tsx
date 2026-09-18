import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Plus, Package, BookOpen } from 'lucide-react'
import { useProducts } from '../hooks/useProducts'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/layout/PageHeader'
import { ProductStats } from '../stats/ProductStats'
import { ProductsTable } from '../table/ProductsTable'
import { ProductModal } from '../modal/ProductModal'
import { CatalogTableModal } from '../catalog/CatalogTableModal'

/**
 * ProductsView: Sleek inventory view cleanly orchestrated with modular subcomponents.
 */
export function ProductsView() {
  const { t } = useTranslation()
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)
  const {
    products,
    isModalOpen,
    editingProduct,
    form,
    errors,
    setForm,
    openCreateModal,
    openCreateModalWithCatalogItem,
    openEditModal,
    closeModal,
    submitProduct,
    removeProduct,
    adjustStock,
  } = useProducts()

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5 max-w-7xl mx-auto w-full select-none">
      {/* Unified Page Header */}
      <PageHeader
        title={t('products.title')}
        subtitle={t('products.subtitle')}
        icon={Package}
        action={
          <div className="flex items-center gap-2.5">
            <Button
              variant="secondary"
              onClick={() => setIsCatalogOpen(true)}
              icon={<BookOpen className="w-3.5 h-3.5 text-emerald-800" />}
            >
              {t('products.browseCatalog', 'Commodity Catalog')}
            </Button>
            <Button variant="primary" onClick={openCreateModal} icon={<Plus className="w-3.5 h-3.5" />}>
              {t('products.addProduct')}
            </Button>
          </div>
        }
      />

      {/* 1. Inventory Summary KPI Cards */}
      <ProductStats products={products} />

      {/* 2. Full-Viewport Sticky Products Data Table */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <ProductsTable
          products={products}
          onAdjustStock={adjustStock}
          onEditProduct={openEditModal}
          onRemoveProduct={removeProduct}
        />
      </div>

      {/* 3. Standard Commodity Catalog Table Modal */}
      <CatalogTableModal
        isOpen={isCatalogOpen}
        onClose={() => setIsCatalogOpen(false)}
        existingProducts={products}
        onSelectForCustomize={(item) => {
          openCreateModalWithCatalogItem(item)
        }}
      />

      {/* 4. Spacious Add/Edit Product Modal */}
      <ProductModal
        isOpen={isModalOpen}
        onClose={closeModal}
        form={form}
        errors={errors}
        editingProduct={editingProduct}
        onChangeForm={setForm}
        onSubmit={submitProduct}
        onOpenCatalog={() => setIsCatalogOpen(true)}
      />
    </div>
  )
}

export default ProductsView
