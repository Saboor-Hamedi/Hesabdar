import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Truck, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/layout/PageHeader'
import { SupplierSchema, type SupplierFormValues } from '../../../core/validation/schemas'
import { validateForm } from '../../../core/validation/validator'
import { formatCurrency } from '../../../core/utils/formatters'
import {
  getSuppliers,
  addSupplier,
  deleteSupplier,
  adjustSupplierBalance,
  onStoreChange,
} from '../../../core/store'
import { notify } from '../../../core/notifications'
import type { Supplier } from '../../../core/types'
import { SupplierMetrics } from '../metrics/SupplierMetrics'
import { SuppliersTable } from '../table/SuppliersTable'
import { SupplierModal } from '../modal/SupplierModal'
import { SupplierPaymentModal } from '../payment/SupplierPaymentModal'

/**
 * SuppliersView: Sleek wholesale vendor view composed of modular subcomponents.
 */
export function SuppliersView() {
  const { t } = useTranslation()
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => getSuppliers())

  useEffect(() => {
    setSuppliers(getSuppliers())
    const unsubscribe = onStoreChange(() => {
      setSuppliers(getSuppliers())
    })
    return unsubscribe
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [form, setForm] = useState<SupplierFormValues>({ name: '', company: '', phone: '', balance: 0 })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Pay Supplier Modal state
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)

  const handleCreateSupplier = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateForm(SupplierSchema, form)
    if (!result.success) {
      setErrors(result.errors)
      return
    }

    addSupplier({
      name: result.data!.name,
      company: result.data!.company || null,
      phone: result.data!.phone || null,
      balance: result.data!.balance || 0,
    })

    setIsModalOpen(false)
    setForm({ name: '', company: '', phone: '', balance: 0 })
    setErrors({})
    notify({
      type: 'success',
      title: 'Supplier Added',
      message: `${result.data!.name} registered successfully.`,
    })
  }

  // Handle paying wholesale supplier to reduce debt balance
  const handleConfirmPaySupplier = (e: React.FormEvent) => {
    e.preventDefault()
    if (!payingSupplier || paymentAmount <= 0) return

    adjustSupplierBalance(payingSupplier.id, -paymentAmount)
    notify({
      type: 'success',
      title: 'Payment Sent / پرداخت به تامین‌کننده',
      message: `Paid ${formatCurrency(paymentAmount)} to ${payingSupplier.name}. Remaining balance: ${formatCurrency(Math.max(0, (payingSupplier.balance || 0) - paymentAmount))}`,
    })

    setPayingSupplier(null)
    setPaymentAmount(0)
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5 max-w-7xl mx-auto w-full select-none">
      {/* Unified Page Header */}
      <PageHeader
        title={t('suppliers.title')}
        subtitle={t('suppliers.subtitle')}
        icon={Truck}
        action={
          <Button
            variant="primary"
            onClick={() => {
              setErrors({})
              setIsModalOpen(true)
            }}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('suppliers.addSupplier')}
          </Button>
        }
      />

      {/* 1. KPI Summary Cards */}
      <SupplierMetrics suppliers={suppliers} />

      {/* 2. Full-Viewport Sticky Suppliers Data Table */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <SuppliersTable
          suppliers={suppliers}
          onOpenPaymentModal={(s) => {
            setPayingSupplier(s)
            setPaymentAmount(s.balance || 0)
          }}
          onDeleteSupplier={(id) => {
            if (window.confirm('Delete supplier record?')) {
              deleteSupplier(id)
            }
          }}
        />
      </div>

      {/* 3. Add Supplier Modal */}
      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        form={form}
        errors={errors}
        onChangeForm={setForm}
        onSubmit={handleCreateSupplier}
      />

      {/* 4. Pay Supplier Modal */}
      <SupplierPaymentModal
        supplier={payingSupplier}
        amount={paymentAmount}
        onChangeAmount={setPaymentAmount}
        onClose={() => {
          setPayingSupplier(null)
          setPaymentAmount(0)
        }}
        onSubmit={handleConfirmPaySupplier}
      />
    </div>
  )
}

export default SuppliersView
