/**
 * Core Notification / Toast System
 * Clean, lightweight pub/sub for global notifications across views and modals.
 */

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
  createdAt: number
}

type Listener = (toasts: Toast[]) => void

let activeToasts: Toast[] = []
const listeners = new Set<Listener>()

function notifyListeners(): void {
  const current = [...activeToasts]
  listeners.forEach((fn) => {
    try {
      fn(current)
    } catch (e) {
      console.error('Notification listener error:', e)
    }
  })
}

/**
 * Dispatch a notification across the app shell and active modals.
 */
export function notify(options: {
  type?: 'success' | 'error' | 'info' | 'warning'
  title?: string
  message: string
  duration?: number
}): string {
  const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
  const duration = options.duration ?? 3500

  const toast: Toast = {
    id,
    type: options.type || 'info',
    title: options.title,
    message: options.message,
    duration,
    createdAt: Date.now(),
  }

  activeToasts = [toast, ...activeToasts].slice(0, 5)
  notifyListeners()

  if (duration > 0) {
    setTimeout(() => {
      dismissNotification(id)
    }, duration)
  }

  return id
}

/**
 * Manually dismiss a specific notification.
 */
export function dismissNotification(id: string): void {
  const initialLen = activeToasts.length
  activeToasts = activeToasts.filter((t) => t.id !== id)
  if (activeToasts.length !== initialLen) {
    notifyListeners()
  }
}

/**
 * Subscribe to notification state changes.
 */
export function onNotificationChange(listener: Listener): () => void {
  listeners.add(listener)
  listener([...activeToasts])
  return () => {
    listeners.delete(listener)
  }
}
