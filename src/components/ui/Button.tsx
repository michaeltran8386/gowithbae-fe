import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { Link, type LinkProps } from 'react-router'
import { LoaderCircle } from 'lucide-react'

/**
 * Explicit variants (patterns-explicit-variants) thay vì một Button nhiều cờ boolean.
 * `pending`: khóa nút + aria-busy, giữ nguyên độ rộng — chặn bấm lặp tạo bản ghi trùng (NFR-08).
 */
const base =
  'inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-control px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-50 active:scale-[.98]'

const variants = {
  primary: 'bg-action text-white hover:bg-action-hover',
  secondary: 'border border-sky-100 bg-action-soft text-action-hover hover:bg-sky-100',
  ghost: 'text-ink-muted hover:bg-page hover:text-ink',
  danger: 'border border-danger/30 bg-white text-danger hover:bg-danger-soft',
  heart: 'bg-attention text-white hover:bg-[#9c4522]',
} as const

type Variant = keyof typeof variants
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & { pending?: boolean; icon?: ReactNode }

function makeButton(variant: Variant) {
  return function VariantButton({ pending = false, icon, children, className = '', disabled, type = 'button', ...rest }: ButtonProps) {
    return (
      <button
        type={type}
        className={`${base} ${variants[variant]} ${className}`}
        disabled={disabled || pending}
        aria-busy={pending || undefined}
        {...rest}
      >
        {pending ? <LoaderCircle size={18} className="animate-spin" aria-hidden="true" /> : icon}
        {children}
      </button>
    )
  }
}

export const PrimaryButton = makeButton('primary')
export const SecondaryButton = makeButton('secondary')
export const GhostButton = makeButton('ghost')
export const DangerButton = makeButton('danger')

/** Link có hình dạng nút — dùng cho điều hướng (link thật, mở tab mới được). */
export function ButtonLink({ variant = 'primary', className = '', icon, children, ...rest }: LinkProps & { variant?: Variant; icon?: ReactNode }) {
  return (
    <Link className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {icon}
      {children}
    </Link>
  )
}

/** Nút chỉ có icon: bắt buộc `label` làm tên truy cập; vùng chạm 44 px. */
export function IconButton({ label, className = '', children, type = 'button', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      className={`inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink-muted transition-colors hover:bg-action-soft hover:text-action disabled:opacity-50 ${className}`}
      {...rest}
    >
      {children}
    </button>
  )
}
