import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { Receipt, RotateCcw } from 'lucide-react'
import type { Sale, Customer } from '../../../core/types'
import { usePOS } from '../hooks/usePOS'
import { ItemEntryBar } from '../entry/ItemEntryBar'
import { InvoiceTable } from '../table/InvoiceTable'
import { CalculatorNumpad } from '../numpad/CalculatorNumpad'
import { SettlementPanel } from '../settlement/SettlementPanel'
import { ReceiptModal } from '../receipt/ReceiptModal'
import { CustomerLedgerModal } from '../../customers/ledger/CustomerLedgerModal'
import { CustomerModal } from '../../customers/modal/CustomerModal'
import { DebtPaymentModal } from '../../customers/payment/DebtPaymentModal'
import { recordCustomerPayment } from '../../../core/store'
import { formatCurrency } from '../../../core/utils/formatters'
import { CustomerSchema, type CustomerFormValues } from '../../../core/validation/schemas'
import { validateForm } from '../../../core/validation/validator'
import { notify } from '../../../core/notifications'
import { Button } from '../../../components/ui/Button'

/**
 * POSView: Standard Afghan Retail Cashier Terminal.
 * Zero-scroll right sidebar: Calculator, Settlement, and Checkout button
 * all fit in the viewport with high visibility and ergonomic proportions.
 */
export function POSView() {
  const { t } = useTranslation()

  const {
    products,
    customers,
    cart,
    subtotal,
    discount,
    setDiscount,
    total,
    cashPaid,
    setCashPaid,
    selectedCustomerId,
    setSelectedCustomerId,
    paymentMode,
    setPaymentMode,
    entryProduct,
    entrySearchQuery,
    entryAmount,
    entryPrice,
    entryUnit,
    setEntryAmount,
    setEntryPrice,
    setEntryUnit,
    setEntrySearchQuery,
    handleSelectProduct,
    handleAddEntryItem,
    activeField,
    setActiveField,
    updateQty,
    setItemQty,
    removeItem,
    clearCart,
    processCheckout,
    addCustomer,
  } = usePOS()

  // State for receipt modal & post-checkout clearing
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [completedSale, setCompletedSale] = useState<Sale | null>(null)
  const [ledgerCustomer, setLedgerCustomer] = useState<Customer | null>(null)
  const [isCheckoutComplete, setIsCheckoutComplete] = useState(false)
  const [calculatorResetKey, setCalculatorResetKey] = useState(0)

  // State for Debt Payment & Settlement modal opened from Ledger
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null)
  const [paymentAmount, setPaymentAmount] = useState<number>(0)

  // State for Customer Registration Modal opened directly from POS '+' button
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false)
  const [customerForm, setCustomerForm] = useState<CustomerFormValues>({
    name: '',
    phone: '',
    address: '',
    balance: 0,
  })
  const [customerErrors, setCustomerErrors] = useState<Record<string, string>>({})

  const isUnderpaidCash =
    paymentMode === 'cash' && total > 0 && cashPaid > 0 && cashPaid < total
  const isCreditWithoutCustomer = paymentMode === 'credit' && !selectedCustomerId
  const isCartEmpty = cart.length === 0
  const isCheckoutDisabled = isCartEmpty || isUnderpaidCash || isCreditWithoutCustomer

  // Start a new sale
  const handleNewSale = useCallback(() => {
    setIsReceiptOpen(false)
    setCompletedSale(null)
    setIsCheckoutComplete(false)
    clearCart()
  }, [clearCart])

  // Complete Sale: records sale, triggers Thermal Receipt modal,
  // clears right side prices & calculator, but keeps items in table as requested.
  const handleCompleteSale = useCallback(() => {
    if (isCheckoutComplete) {
      handleNewSale()
      return
    }
    if (isCheckoutDisabled) return

    const sale = processCheckout()
    if (sale) {
      setCompletedSale(sale)
      setIsReceiptOpen(true)

      // Clear the right side completely
      setDiscount(0)
      setCashPaid(0)
      setSelectedCustomerId(null)
      setPaymentMode('cash')
      setCalculatorResetKey((k) => k + 1)
      setIsCheckoutComplete(true)
    }
  }, [
    isCheckoutComplete,
    isCheckoutDisabled,
    processCheckout,
    setDiscount,
    setCashPaid,
    setSelectedCustomerId,
    setPaymentMode,
    handleNewSale,
  ])

  // Keyboard shortcut listener for F12 (Checkout) and F2 (Focus item search)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') {
        e.preventDefault()
        handleCompleteSale()
      } else if (e.key === 'F2') {
        e.preventDefault()
        const searchInput = document.querySelector<HTMLInputElement>('input[data-testid="pos-item-search"]')
        searchInput?.focus()
        searchInput?.select()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleCompleteSale])

  // Open the 900px x 700px CustomerModal directly from POS
  const handleOpenAddCustomer = () => {
    setCustomerForm({ name: '', phone: '', address: '', balance: 0 })
    setCustomerErrors({})
    setIsAddCustomerOpen(true)
  }

  // Submit new customer from POS and instantly select them
  const handleCreateCustomerFromPOS = (e: React.FormEvent) => {
    e.preventDefault()
    const result = validateForm(CustomerSchema, customerForm)
    if (!result.success) {
      setCustomerErrors(result.errors)
      return
    }

    const created = addCustomer(result.data!)
    setSelectedCustomerId(created.id)
    setIsAddCustomerOpen(false)
    setCustomerForm({ name: '', phone: '', address: '', balance: 0 })
    setCustomerErrors({})

    notify({
      type: 'success',
      title: 'Customer Registered',
      message: `${created.name} added and selected for current sale.`,
    })
  }

  // Handle debt settlement payment directly from POS ledger view
  const handleConfirmReceivePayment = (
    e: React.FormEvent,
    customAmount?: number,
    customNote?: string
  ) => {
    e.preventDefault()
    if (!payingCustomer) return

    const payAmt = customAmount !== undefined ? customAmount : paymentAmount
    if (payAmt <= 0) return

    const curDebt = payingCustomer.balance || 0
    let note = customNote
    if (!note) {
      if (payAmt > curDebt && curDebt > 0) {
        note = `Debt payment of ${formatCurrency(curDebt)} + ${formatCurrency(payAmt - curDebt)} advance credit`
      } else {
        note = `Debt settlement payment via POS Terminal`
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

    // Update the ledger customer if currently open
    setLedgerCustomer((prev) =>
      prev && prev.id === payingCustomer.id ? { ...prev, balance: nextBal } : prev
    )
    setPayingCustomer(null)
    setPaymentAmount(0)
  }

  // If cashier adds a new item after a completed checkout, auto-reset table for new sale
  const handleAddItemWithAutoReset = () => {
    if (isCheckoutComplete) {
      clearCart()
      setIsCheckoutComplete(false)
    }
    handleAddEntryItem()
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3 select-none overflow-hidden">
      {/* ========================================================
          LEFT COLUMN: Cashier Direct Inputs & Invoice Table
          ======================================================== */}
      <div className="flex-1 flex flex-col gap-3 min-w-0 h-full overflow-hidden">
        {/* Fast Item Typing Bar (Commodity Search/Scan, Amount, Unit, Price, Add) */}
        <ItemEntryBar
          products={products}
          selectedProduct={entryProduct}
          searchQuery={entrySearchQuery}
          onChangeSearchQuery={setEntrySearchQuery}
          amount={entryAmount}
          price={entryPrice}
          unit={entryUnit}
          onSelectProduct={(p) => {
            if (isCheckoutComplete) {
              clearCart()
              setIsCheckoutComplete(false)
            }
            handleSelectProduct(p)
          }}
          onChangeAmount={setEntryAmount}
          onChangePrice={setEntryPrice}
          onChangeUnit={setEntryUnit}
          onAddItem={handleAddItemWithAutoReset}
          onFocusField={(f) => setActiveField(f)}
          activeField={activeField}
        />

        {/* Live Customer Purchased Items Table (Maintained on checkout) */}
        <InvoiceTable
          items={cart}
          onUpdateQty={updateQty}
          onSetItemQty={setItemQty}
          onRemoveItem={removeItem}
          onClearAll={() => {
            clearCart()
            setIsCheckoutComplete(false)
          }}
        />
      </div>

      {/* ========================================================
          RIGHT COLUMN: Cashier Calculator & Financial Settlement
          (Zero Scroll: Fits 100% in viewport without any scrollbar)
          ======================================================== */}
      <div className="w-full lg:w-88 xl:w-96 flex flex-col h-full shrink-0 overflow-hidden select-none gap-2">
        {/* On-screen Cashier Calculator (clears on checkout via resetKey) */}
        <CalculatorNumpad
          onApplyToPaid={setCashPaid}
          totalPayable={isCheckoutComplete ? 0 : total}
          resetKey={calculatorResetKey}
        />

        {/* Settlement, Discount, Cash Paid & Remaining Change Console (clears on checkout) */}
        <SettlementPanel
          subtotal={subtotal}
          discount={discount}
          onChangeDiscount={setDiscount}
          total={total}
          cashPaid={cashPaid}
          onChangeCashPaid={setCashPaid}
          paymentMode={paymentMode}
          onChangePaymentMode={setPaymentMode}
          customers={customers}
          selectedCustomerId={selectedCustomerId}
          onSelectCustomer={setSelectedCustomerId}
          onOpenAddCustomer={handleOpenAddCustomer}
          onOpenCustomerLedger={(c) => setLedgerCustomer(c)}
          isCheckoutComplete={isCheckoutComplete}
          completedInvoiceNo={completedSale?.invoice_no}
        />

        {/* Fixed Bottom Checkout Action Button */}
        <div className="shrink-0">
          <Button
            variant="primary"
            onClick={handleCompleteSale}
            disabled={!isCheckoutComplete && isCheckoutDisabled}
            icon={
              isCheckoutComplete ? (
                <RotateCcw className="w-4 h-4" />
              ) : (
                <Receipt className="w-4 h-4" />
              )
            }
            className={`w-full h-11 text-xs font-bold text-white rounded-[5px] shadow-sm flex items-center justify-center gap-2 transition-all active:scale-[0.99] cursor-pointer ${
              isCheckoutComplete
                ? 'bg-blue-600 hover:bg-blue-700'
                : isUnderpaidCash
                  ? 'bg-red-600 hover:bg-red-700 opacity-90 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <span>
              {isCheckoutComplete
                ? `${t('pos.checkedOut', 'Checked Out')} • ${t('pos.newSale', 'New Sale')}`
                : isUnderpaidCash
                  ? `${t('pos.underpaid', 'Underpaid')} (-${total - cashPaid} AFN)`
                  : isCreditWithoutCustomer
                    ? t('pos.customerRequired', 'Select Customer for Credit')
                    : `${t('pos.checkout', 'Checkout (F12)')}`}
            </span>
          </Button>
        </div>
      </div>

      {/* ========================================================
          RECEIPT MODAL: Thermal Receipt Print
          ======================================================== */}
      <ReceiptModal
        isOpen={isReceiptOpen}
        onClose={() => setIsReceiptOpen(false)}
        sale={completedSale}
        customers={customers}
        onNewSale={handleNewSale}
      />

      {/* ========================================================
          CUSTOMER STATEMENT & LEDGER MODAL: Complete history
          ======================================================== */}
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

      {/* ========================================================
          DEBT PAYMENT & SETTLEMENT MODAL (900px x 700px, zIndex=70)
          ======================================================== */}
      <DebtPaymentModal
        isOpen={Boolean(payingCustomer)}
        customer={payingCustomer}
        amount={paymentAmount}
        onChangeAmount={setPaymentAmount}
        onClose={() => {
          setPayingCustomer(null)
          setPaymentAmount(0)
        }}
        onSubmit={handleConfirmReceivePayment}
      />

      {/* ========================================================
          CUSTOMER REGISTRATION MODAL: 900px x 700px Full Modal from POS
          ======================================================== */}
      <CustomerModal
        isOpen={isAddCustomerOpen}
        onClose={() => setIsAddCustomerOpen(false)}
        form={customerForm}
        errors={customerErrors}
        onChangeForm={setCustomerForm}
        onSubmit={handleCreateCustomerFromPOS}
      />
    </div>
  )
}

export default POSView
