import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { RotateCcw, CheckCircle2, ArrowLeft } from 'lucide-react'
import type { Sale, Customer } from '../../../core/types'
import { usePOS } from '../hooks/usePOS'
import { ItemEntryBar } from '../entry/ItemEntryBar'
import { InvoiceTable } from '../table/InvoiceTable'
import { CalculatorNumpad } from '../numpad/CalculatorNumpad'
import { SettlementPanel } from '../settlement/SettlementPanel'
import { ReceiptModal } from '../receipt/ReceiptModal'
import { HeldCartsModal } from '../hold/HeldCartsModal'
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
    addToCart,
    processCheckout,
    addCustomer,
    heldCarts,
    handleHoldCart,
    handleResumeCart,
    handleDeleteHeldCart,
    handleClearAllHeldCarts,
  } = usePOS()

  // State for receipt modal & post-checkout clearing
  const [isReceiptOpen, setIsReceiptOpen] = useState(false)
  const [isHeldCartsOpen, setIsHeldCartsOpen] = useState(false)
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
  const [mobileView, setMobileView] = useState<'table' | 'checkout'>('table')

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
    setMobileView('table')
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
    setMobileView('table')
    handleAddEntryItem()
  }

  return (
    <div className="flex flex-col lg:flex-row h-full gap-3.5 xl:gap-4 select-none overflow-hidden pr-2 xl:pr-3">
      {/* ========================================================
          LEFT COLUMN: Cashier Direct Inputs & Invoice Table
          (Closes/hides on small screens when cashier opens Checkout)
          ======================================================== */}
      <div
        className={`flex-1 flex-col gap-3 min-w-0 h-full overflow-hidden ${
          mobileView === 'table' ? 'flex' : 'hidden lg:flex'
        }`}
      >
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
          onFastScanAdd={(p) => {
            if (isCheckoutComplete) {
              clearCart()
              setIsCheckoutComplete(false)
            }
            addToCart(p)
          }}
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
          onHoldCart={handleHoldCart}
          onOpenHeldCarts={() => setIsHeldCartsOpen(true)}
          heldCount={heldCarts.length}
        />

        {/* Responsive Mobile "Proceed to Checkout" Action Bar (Visible only on screens < lg) */}
        <div className="lg:hidden shrink-0 pt-1">
          <Button
            variant="primary"
            onClick={() => setMobileView('checkout')}
            disabled={cart.length === 0}
            className="w-full h-11 bg-[#5A8F7B] hover:bg-[#4A7C6F] text-white font-bold text-sm rounded-lg flex items-center justify-between px-4 shadow-sm cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <span>{t('pos.proceedToCheckout', 'Proceed to Checkout')}</span>
              <span className="text-xs font-normal opacity-85">({cart.length} {t('pos.items', 'items')})</span>
            </span>
            <span className="font-mono font-bold text-sm">{total.toLocaleString()} AFN →</span>
          </Button>
        </div>
      </div>

      {/* ========================================================
          RIGHT COLUMN: Cashier Calculator & Financial Settlement
          (Appears full-screen on small screens, side-by-side on lg:+)
          (Zero Scroll: grouped compactly without artificial gaps)
          ======================================================== */}
      <div
        className={`w-full lg:w-76 xl:w-80 flex-col h-full shrink-0 overflow-y-auto select-none gap-2 ${
          mobileView === 'checkout' ? 'flex' : 'hidden lg:flex'
        }`}
      >
        {/* Responsive Mobile "Back to Items" Navigation Bar (Visible only on screens < lg) */}
        <div className="lg:hidden flex items-center justify-between pb-1.5 shrink-0 border-b border-gray-200">
          <button
            type="button"
            onClick={() => setMobileView('table')}
            className="flex items-center gap-1.5 text-xs font-bold text-[#4A7C6F] hover:underline cursor-pointer py-1"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t('pos.backToItems', '← Back to Items Table')}</span>
          </button>
          <span className="text-xs font-semibold text-gray-600">
            {cart.length} items • <strong className="font-mono text-gray-900">{total.toLocaleString()} AFN</strong>
          </span>
        </div>

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
                <RotateCcw className="w-4.5 h-4.5 text-white" />
              ) : (
                <CheckCircle2 className="w-4.5 h-4.5 text-white" />
              )
            }
            className={`w-full h-10.5 text-sm font-bold text-white rounded-lg shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer ${
              isCheckoutComplete
                ? 'bg-slate-800 hover:bg-slate-900'
                : isUnderpaidCash
                  ? 'bg-rose-600 hover:bg-rose-700 opacity-90 cursor-not-allowed'
                  : 'bg-[#5A8F7B] hover:bg-[#4A7C6F]'
            }`}
          >
            <span className="flex items-center tracking-wider uppercase font-bold">
              {isCheckoutComplete ? (
                <span>{t('pos.checkedOut', 'Checked Out')} • {t('pos.newSale', 'New Sale')}</span>
              ) : isUnderpaidCash ? (
                <span className="tracking-normal font-semibold">{t('pos.underpaid', 'Underpaid')} (-{total - cashPaid} AFN)</span>
              ) : isCreditWithoutCustomer ? (
                <span className="tracking-normal font-semibold">{t('pos.customerRequired', 'Select Customer for Credit')}</span>
              ) : (
                <>
                  <span>CHECKOUT</span>
                  <span className="opacity-75 font-normal text-xs ms-1.5 tracking-normal">(F12)</span>
                </>
              )}
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
          HELD CARTS MODAL: Multi-cart parking
          ======================================================== */}
      <HeldCartsModal
        isOpen={isHeldCartsOpen}
        onClose={() => setIsHeldCartsOpen(false)}
        heldCarts={heldCarts}
        onResume={(hc) => {
          handleResumeCart(hc)
          setIsHeldCartsOpen(false)
        }}
        onDelete={handleDeleteHeldCart}
        onClearAll={handleClearAllHeldCarts}
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
