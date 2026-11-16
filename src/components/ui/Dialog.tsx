import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { DangerButton, PrimaryButton, SecondaryButton } from './Button.tsx'

/**
 * Dialog dùng <dialog> native: focus trap, Esc đóng, trả focus về phần tử mở.
 * Mobile hiển thị như sheet đáy; desktop ở giữa màn hình.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  footer?: ReactNode
}) {
  const ref = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (open && !el.open) el.showModal?.()
    if (!open && el.open) el.close?.()
  }, [open])

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onCancel={(e) => {
        e.preventDefault()
        onClose()
      }}
      onClick={(e) => {
        if (e.target === ref.current) onClose()
      }}
      aria-labelledby="dialog-title"
      className="m-0 mt-auto max-h-[90dvh] w-full max-w-none overscroll-contain rounded-t-[20px] bg-white p-0 text-ink shadow-raised backdrop:bg-ink/40 md:m-auto md:max-w-lg md:rounded-block"
    >
      {open && (
        <div className="flex max-h-[90dvh] flex-col">
          <div className="flex items-start gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0 flex-1">
              <h2 id="dialog-title" className="text-[17px] font-semibold">
                {title}
              </h2>
              {description && <div className="mt-1 text-sm text-ink-muted">{description}</div>}
            </div>
            <button type="button" onClick={onClose} aria-label="Đóng" className="-m-2 rounded-full p-2 text-ink-muted hover:bg-page">
              <X size={20} aria-hidden="true" />
            </button>
          </div>
          {children && <div className="overflow-y-auto px-5 py-4">{children}</div>}
          {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-line px-5 py-3 pb-[max(.75rem,env(safe-area-inset-bottom))]">{footer}</div>}
        </div>
      )}
    </dialog>
  )
}

/** Xác nhận thao tác không đảo ngược, nêu rõ hậu quả (UX-10). */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel,
  tone = 'danger',
  pending,
  children,
}: {
  open: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  description: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'primary'
  pending?: boolean
  children?: ReactNode
}) {
  const Confirm = tone === 'danger' ? DangerButton : PrimaryButton
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      footer={
        <>
          <SecondaryButton onClick={onClose}>Quay lại</SecondaryButton>
          <Confirm onClick={onConfirm} pending={pending}>
            {confirmLabel}
          </Confirm>
        </>
      }
    >
      {children}
    </Dialog>
  )
}
