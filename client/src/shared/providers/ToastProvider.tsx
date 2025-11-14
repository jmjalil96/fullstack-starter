/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Toast types with different visual styles and durations
 */
export type ToastType = 'success' | 'error' | 'info' | 'warning'

// Default durations per type (in milliseconds) - module-scoped constant
const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
}

/**
 * Toast configuration
 */
export interface Toast {
  id: string
  type: ToastType
  message: string
  duration?: number
  dismissible?: boolean
}

/**
 * Options when creating a toast
 */
interface ToastOptions {
  duration?: number
  dismissible?: boolean
}

/**
 * Toast context value
 */
export interface ToastContextValue {
  toasts: Toast[]
  success: (message: string, options?: ToastOptions) => string
  error: (message: string, options?: ToastOptions) => string
  info: (message: string, options?: ToastOptions) => string
  warning: (message: string, options?: ToastOptions) => string
  dismiss: (id: string) => void
  clear: () => void
}

/**
 * Toast context - use useToast hook instead of accessing directly
 */
export const ToastContext = createContext<ToastContextValue | null>(null)

/**
 * ToastProvider - Manages toast notifications
 *
 * @example
 * // Wrap your app
 * <ToastProvider>
 *   <App />
 * </ToastProvider>
 *
 * // Use in components
 * const toast = useToast()
 * toast.success('Booking confirmed!')
 * toast.error('Payment failed')
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  // Maximum number of visible toasts
  const MAX_TOASTS = 4

  /**
   * Generate unique toast ID
   */
  const generateId = (): string => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Dismiss a specific toast
   */
  const dismiss = useCallback((id: string) => {
    // Clear timer
    const timer = timersRef.current.get(id)
    if (timer) {
      clearTimeout(timer)
      timersRef.current.delete(id)
    }

    // Remove toast
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  /**
   * Add a new toast
   */
  const addToast = useCallback(
    (type: ToastType, message: string, options?: ToastOptions): string => {
      const id = generateId()
      const duration = options?.duration ?? DEFAULT_DURATIONS[type]
      const dismissible = options?.dismissible ?? true

      const newToast: Toast = {
        id,
        type,
        message,
        duration,
        dismissible,
      }

      let removedIds: string[] = []
      setToasts(prev => {
        const updated = [...prev, newToast]
        if (updated.length > MAX_TOASTS) {
          const cut = updated.length - MAX_TOASTS
          const removed = updated.slice(0, cut)
          removedIds = removed.map(t => t.id)
          return updated.slice(-MAX_TOASTS)
        }
        return updated
      })

      // Clear timers for removed toasts (if we trimmed)
      if (removedIds.length > 0) {
        removedIds.forEach(rid => {
          const t = timersRef.current.get(rid)
          if (t) {
            clearTimeout(t)
            timersRef.current.delete(rid)
          }
        })
      }

      // Set auto-dismiss timer if duration is finite
      if (duration !== Infinity) {
        const timer = setTimeout(() => {
          dismiss(id)
        }, duration)

        timersRef.current.set(id, timer)
      }

      return id
    },
    [dismiss]
  )

  /**
   * Clear all toasts
   */
  const clear = useCallback(() => {
    // Clear all timers
    timersRef.current.forEach(timer => clearTimeout(timer))
    timersRef.current.clear()
    setToasts([])
  }, [])

  /**
   * Toast type-specific functions
   */
  const success = useCallback(
    (message: string, options?: ToastOptions) => addToast('success', message, options),
    [addToast]
  )

  const error = useCallback(
    (message: string, options?: ToastOptions) => addToast('error', message, options),
    [addToast]
  )

  const info = useCallback(
    (message: string, options?: ToastOptions) => addToast('info', message, options),
    [addToast]
  )

  const warning = useCallback(
    (message: string, options?: ToastOptions) => addToast('warning', message, options),
    [addToast]
  )

  /**
   * Cleanup timers on unmount
   */
  useEffect(() => {
    const timers = timersRef.current
    return () => {
      timers.forEach(timer => clearTimeout(timer))
      timers.clear()
    }
  }, [])

  const value: ToastContextValue = {
    toasts,
    success,
    error,
    info,
    warning,
    dismiss,
    clear,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} dismiss={dismiss} />
    </ToastContext.Provider>
  )
}

/**
 * Toast container - renders all active toasts
 */
function ToastContainer({ toasts, dismiss }: { toasts: Toast[]; dismiss: (id: string) => void }) {
  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
      ))}
    </div>
  )
}

/**
 * Individual toast item
 */
function ToastItem({ toast, onDismiss }: { toast: Toast; onDismiss: (id: string) => void }) {
  const [isExiting, setIsExiting] = useState(false)

  const handleDismiss = () => {
    setIsExiting(true)
    setTimeout(() => {
      onDismiss(toast.id)
    }, 300) // Match animation duration
  }

  // Toast styling based on type
  const styles: Record<ToastType, { container: string; icon: ReactNode }> = {
    success: {
      container: 'bg-green-50 border-green-200 text-green-800',
      icon: (
        <svg
          className="w-5 h-5 text-green-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
    error: {
      container: 'bg-red-50 border-red-200 text-red-800',
      icon: (
        <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      ),
    },
    info: {
      container: 'bg-blue-50 border-blue-200 text-blue-800',
      icon: (
        <svg
          className="w-5 h-5 text-blue-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    warning: {
      container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
      icon: (
        <svg
          className="w-5 h-5 text-yellow-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
  }

  const style = styles[toast.type]

  return (
    <div
      className={`
        ${style.container}
        pointer-events-auto
        min-w-[300px] max-w-[400px]
        p-4 rounded-lg border shadow-lg
        flex items-start gap-3
        transition-all duration-300
        ${isExiting ? 'opacity-0 translate-x-2' : 'opacity-100 translate-x-0'}
      `}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">{style.icon}</div>

      {/* Message */}
      <div className="flex-1 text-sm font-medium">{toast.message}</div>

      {/* Dismiss button */}
      {toast.dismissible && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Dismiss notification"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      )}
    </div>
  )
}
