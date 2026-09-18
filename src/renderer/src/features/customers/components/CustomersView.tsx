import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, Plus } from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { PageHeader } from '../../../components/layout/PageHeader'
import { CustomerSchema, type CustomerFormValues } from '../../../core/validation/schemas'
import { validateForm } from '../../../core/validation/validator'
import { formatCurrency } from '../../../core/utils/formatters'
import {
  getCustomers,
  addCustomer,
  updateCustomer,
  deleteCustomer,
  recordCustomerPayment,
  onStoreChange,
} from '../../../core/store'
import { notify } from '../../../core/notifications'
import type { Customer } from '../../../core/types'
import { CustomerMetrics } from '../metrics/CustomerMetrics'
import { CustomersTable } from '../table/CustomersTable'
import { CustomerModal } from '../modal/CustomerModal'
import { DebtPaymentModal } from '../payment/DebtPaymentModal'
import { CustomerLedgerModal } from '../ledger/CustomerLedgerModal'

/**
 * CustomersView: Sleek customer debt management view composed of modular subcomponents.
 */
export function CustomersView() {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState<Customer[]>(() => getCustomers())

  useEffect(() => {
    setCustomers(getCustomers())
    const unsubscribe = onStoreChange(() => {
      setCustomers(getCustomers())
    })
    return unsubscribe
  }, [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [form, setForm] = useState<CustomerFormValues>({ name: '', phone: '', address: '', balance: 0 })
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Receive Payment Modal state
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)

  // Customer Statement & Ledger Modal state
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null)

  const handleOpenCreateCustomer = () => {
    setEditingCustomer(null)
    setForm({ name: '', phone: '', address: '', balance: 0 })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleOpenEditCustomer = (customer: Customer) => {
    setEditingCustomer(customer)
    setForm({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      balance: customer.balance || 0,
    })
    setErrors({})
    setIsModalOpen(true)
  }

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateForm(CustomerSchema, form)
    if (!result.success) {
      setErrors(result.errors)
      return
    }

    if (editingCustomer) {
      updateCustomer(editingCustomer.id, result.data!)
      notify({
        type: 'success',
        title: 'Customer Updated',
        message: `${result.data!.name} details updated successfully.`,
      })
    } else {
      addCustomer(result.data!)
      notify({
        type: 'success',
        title: 'Customer Added',
        message: `${result.data!.name} registered successfully.`,
      })
    }

    setIsModalOpen(false)
    setEditingCustomer(null)
    setForm({ name: '', phone: '', address: '', balance: 0 })
    setErrors({})
  }

  // Handle debt settlement / payment receipt
  const handleConfirmReceivePayment = (
    e: React.FormEvent,
    customAmount?: number,
    customNote?: string
  ) => {
    e.preventDefault()
    const payAmt = customAmount != null ? customAmount : paymentAmount
    if (!payingCustomer || payAmt <= 0) return

    const curDebt = payingCustomer.balance || 0
    let note = customNote
    if (!note) {
      if (payAmt > curDebt && curDebt > 0) {
        note = `Debt payment of ${formatCurrency(curDebt)} + ${formatCurrency(payAmt - curDebt)} advance credit`
      } else {
        note = `Debt settlement payment via Cashier`
      }
    }

    // Record persistent customer payment log and adjust customer balance
    recordCustomerPayment(payingCustomer.id, payAmt, note)

    const nextBal = Math.round(((payingCustomer.balance || 0) - payAmt) * 100) / 100
    notify({
      type: 'success',
      title: 'Payment Recorded',
      message:
        nextBal < 0
          ? `Received ${formatCurrency(payAmt)} from ${payingCustomer.name}. Customer now has ${formatCurrency(Math.abs(nextBal))} advance credit.`
          : nextBal === 0
            ? `Received ${formatCurrency(payAmt)} from ${payingCustomer.name}. Debt is fully settled (0 AFN).`
            : `Received ${formatCurrency(payAmt)} from ${payingCustomer.name}. Remaining debt: ${formatCurrency(nextBal)}.`,
    })

    setPayingCustomer(null)
    setPaymentAmount(0)
  }

  return (
    <div className="flex flex-col h-full min-h-0 gap-3.5 max-w-7xl mx-auto w-full select-none">
      {/* Unified Page Header */}
      <PageHeader
        title={t('customers.title')}
        subtitle={t('customers.subtitle')}
        icon={Users}
        action={
          <Button
            variant="primary"
            onClick={handleOpenCreateCustomer}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            {t('customers.addCustomer')}
          </Button>
        }
      />

      {/* 1. KPI Summary Cards */}
      <CustomerMetrics customers={customers} />

      {/* 2. Full-Viewport Sticky Customer Accounts Data Table */}
      <div className="flex-1 min-h-0 flex flex-col mt-1">
        <CustomersTable
          customers={customers}
          onOpenPaymentModal={(c) => {
            setPayingCustomer(c)
            setPaymentAmount(c.balance || 0)
          }}
          onOpenLedger={(c) => setLedgerCustomer(c)}
          onEditCustomer={handleOpenEditCustomer}
          onDeleteCustomer={(id) => {
            if (window.confirm('Delete customer account?')) {
              deleteCustomer(id)
            }
          }}
        />
      </div>

      {/* 3. Add/Edit Customer Modal (900px x 700px) */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setEditingCustomer(null)
        }}
        form={form}
        errors={errors}
        editingCustomer={editingCustomer}
        onChangeForm={setForm}
        onSubmit={handleSaveCustomer}
      />

      {/* 4. Receive Debt Settlement Modal */}
      <DebtPaymentModal
        customer={payingCustomer}
        amount={paymentAmount}
        onChangeAmount={setPaymentAmount}
        onClose={() => {
          setPayingCustomer(null)
          setPaymentAmount(0)
        }}
        onSubmit={handleConfirmReceivePayment}
      />

      {/* 5. Customer History Statement & Debt Ledger Modal */}
      <CustomerLedgerModal
        customer={ledgerCustomer}
        allCustomers={customers}
        isOpen={Boolean(ledgerCustomer)}
        onClose={() => setLedgerCustomer(null)}
        onSelectCustomer={(c) => setLedgerCustomer(c)}
        onOpenReceivePayment={(c) => {
          setPayingCustomer(c)
          setPaymentAmount(c.balance || 0)
        }}
      />
    </div>
  )
}

export default CustomersView
