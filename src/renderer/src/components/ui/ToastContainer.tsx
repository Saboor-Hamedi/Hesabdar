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

        const borderColor = isSuccess
          ? 'border-emerald-300'
          : isError
          ? 'border-rose-300'
          : isWarning
          ? 'border-amber-300'
          : 'border-blue-300'

        const bgColor = isSuccess
          ? 'bg-emerald-50'
          : isError
          ? 'bg-rose-50'
          : isWarning
          ? 'bg-amber-50'
          : 'bg-blue-50'

        const textColor = isSuccess
          ? 'text-emerald-900'
          : isError
          ? 'text-rose-900'
          : isWarning
          ? 'text-amber-900'
          : 'text-blue-900'

        const iconColor = isSuccess
          ? 'text-emerald-600'
          : isError
          ? 'text-rose-600'
          : isWarning
          ? 'text-amber-600'
          : 'text-blue-600'

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-2.5 p-3 rounded-[5px] border shadow-md transition-all animate-in slide-in-from-top-2 duration-200 ${bgColor} ${borderColor} ${textColor}`}
          >
            <div className="shrink-0 mt-0.5">
              {isSuccess && <CheckCircle2 className={`w-4 h-4 ${iconColor}`} />}
              {isError && <AlertCircle className={`w-4 h-4 ${iconColor}`} />}
              {isWarning && <AlertTriangle className={`w-4 h-4 ${iconColor}`} />}
              {!isSuccess && !isError && !isWarning && <Info className={`w-4 h-4 ${iconColor}`} />}
            </div>

            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
              {toast.title && (
                <span className="font-semibold text-xs leading-none">{toast.title}</span>
              )}
              <span className="text-xs leading-snug">{toast.message}</span>
            </div>

            <button
              type="button"
              onClick={() => dismissNotification(toast.id)}
              className="shrink-0 p-0.5 rounded-[5px] text-gray-400 hover:text-gray-700 transition-colors"
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
