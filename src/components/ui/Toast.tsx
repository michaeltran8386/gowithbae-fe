import { createContext, use, useCallback, useMemo, useRef, useState, type ReactNode } from 'react'
import { X } from 'lucide-react'

type Toast = { id: number; message: string; tone: 'info' | 'error'; action?: { label: string; onClick: () => void } }
type ToastApi = {
  show: (message: string, options?: { tone?: Toast['tone']; action?: Toast['action'] }) => void
}

const ToastContext = createContext<ToastApi | null>(null)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const seq = useRef(0)

  const dismiss = useCallback((id: number) => setToasts((all) => all.filter((t) => t.id !== id)), [])

  const api = useMemo<ToastApi>(
    () => ({
      show: (message, options = {}) => {
        const id = ++seq.current
        setToasts((all) => [...all.slice(-2), { id, message, tone: options.tone ?? 'info', action: options.action }])
        setTimeout(() => dismiss(id), options.action ? 6000 : 4000)
      },
    }),
    [dismiss],
  )

  return (
    <ToastContext value={api}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-20 z-50 flex flex-col items-center gap-2 px-4 md:bottom-6"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role={t.tone === 'error' ? 'alert' : 'status'}
            className={`pointer-events-auto flex max-w-md items-center gap-3 rounded-control px-4 py-3 text-sm text-white shadow-raised ${
              t.tone === 'error' ? 'bg-danger' : 'bg-ink'
            }`}
          >
            <span className="min-w-0 flex-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                className="shrink-0 font-semibold text-sky-100 underline-offset-2 hover:underline"
                onClick={() => {
                  t.action?.onClick()
                  dismiss(t.id)
                }}
              >
                {t.action.label}
              </button>
            )}
            <button type="button" aria-label="Đóng thông báo" className="shrink-0 opacity-80 hover:opacity-100" onClick={() => dismiss(t.id)}>
              <X size={16} aria-hidden="true" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext>
  )
}

export function useToast() {
  const ctx = use(ToastContext)
  if (!ctx) throw new Error('useToast phải nằm trong ToastProvider')
  return ctx
}
