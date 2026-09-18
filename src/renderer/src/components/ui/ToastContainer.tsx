import { useState, useEffect } from 'react'
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'
import { onNotificationChange, dismissNotification, type Toast } from '../../core/notifications'

/**
 * ToastContainer: Global notification overlay rendered at the top level of the application shell.
 * Visible across all views and open modals (z-[9999]).
 */
export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([])

  useEffect(() => {
    const unsubscribe = onNotificationChange((items) => {
      setToasts(items)
    })
    return unsubscribe
  }, [])

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 rtl:left-4 rtl:right-auto z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none select-none">
      {toasts.map((toast) => {
        const isSuccess = toast.type === 'success'
        const isError = toast.type === 'error'
        const isWarning = toast.type === 'warning'

        return (
          <div
            key={toast.id}
            className="pointer-events-auto flex items-center gap-3 p-3.5 bg-white/95 backdrop-blur-md border border-gray-200/90 rounded-xl shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.05)] transition-all animate-in fade-in-0 slide-in-from-top-2 duration-150"
          >
            <div className="shrink-0 flex items-center justify-center">
              {isSuccess && <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />}
              {isError && <AlertCircle className="w-4.5 h-4.5 text-rose-600" />}
              {isWarning && <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />}
              {!isSuccess && !isError && !isWarning && <Info className="w-4.5 h-4.5 text-blue-500" />}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {toast.title && (
                <span className="font-semibold text-xs text-gray-900 leading-tight">{toast.title}</span>
              )}
              <span className="text-xs text-gray-600 leading-snug">{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => dismissNotification(toast.id)}
              className="shrink-0 p-1 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )
      })}
    </div>
  )
}

export default ToastContainer
