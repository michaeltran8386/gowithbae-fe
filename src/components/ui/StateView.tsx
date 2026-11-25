import type { ReactNode } from 'react'
import { CloudOff, LoaderCircle } from 'lucide-react'
import { ApiError, problemMessage } from '../../api/problem.ts'
import { SecondaryButton } from './Button.tsx'

/** Ba trạng thái dữ liệu bắt buộc (SRS §8) — explicit variants. */
export function LoadingState({ label = 'Đang tải…' }: { label?: string }) {
  return (
    <div role="status" className="flex items-center justify-center gap-2 py-16 text-ink-muted">
      <LoaderCircle size={20} className="animate-spin" aria-hidden="true" />
      <span>{label}</span>
    </div>
  )
}

export function EmptyState({
  title,
  children,
  action,
  icon,
  headingLevel = 2,
}: {
  title: string
  children?: ReactNode
  action?: ReactNode
  icon?: ReactNode
  headingLevel?: 1 | 2
}) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <div className="flex flex-col items-center gap-3 rounded-block border border-dashed border-line bg-white px-6 py-12 text-center">
      {icon && <div className="text-sky" aria-hidden="true">{icon}</div>}
      <Heading className="text-[17px] font-semibold">{title}</Heading>
      {children && <div className="max-w-md text-sm text-ink-muted">{children}</div>}
      {action}
    </div>
  )
}

export function ErrorState({ error, onRetry, title }: { error: unknown; onRetry?: () => void; title?: string }) {
  const traceId = error instanceof ApiError ? error.problem.traceId : undefined
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-block border border-line bg-white px-6 py-12 text-center">
      <CloudOff size={32} className="text-ink-muted" aria-hidden="true" />
      <h2 className="text-[17px] font-semibold">{title ?? 'Chưa tải được nội dung'}</h2>
      <p className="max-w-md text-sm text-ink-muted">
        {/* Lỗi không phải từ API (vd. tải mã trang thất bại) không được báo nhầm là mất kết nối máy chủ */}
        {error instanceof ApiError ? problemMessage(error) : 'Đã có lỗi khi tải trang. Hãy tải lại trang.'}
      </p>
      {traceId && <p className="text-xs text-ink-muted tabular">Mã tra cứu: {traceId}</p>}
      {onRetry && <SecondaryButton onClick={onRetry}>Thử lại</SecondaryButton>}
    </div>
  )
}

export function Skeleton({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div
      aria-hidden="true"
      style={style}
      className={`animate-shimmer rounded-block bg-[linear-gradient(90deg,var(--color-action-soft)_25%,#fff5f9_50%,var(--color-action-soft)_75%)] bg-[length:200%_100%] ${className}`}
    />
  )
}

/** Thiếu dữ liệu: hiển thị đúng chỗ, không ẩn mục, không đổi thành "Không có" (RULE-04). */
export function UnknownValue({ children = 'Chưa có thông tin' }: { children?: ReactNode }) {
  return <span className="text-ink-muted">{children}</span>
}

export function Badge({ tone = 'neutral', children }: { tone?: 'neutral' | 'action' | 'attention' | 'success' | 'muted'; children: ReactNode }) {
  const tones = {
    neutral: 'bg-page text-ink',
    action: 'bg-action-soft text-action-hover',
    attention: 'bg-peach-50 text-attention',
    success: 'bg-[#e6f4ec] text-success',
    muted: 'bg-page text-ink-muted',
  }
  return <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${tones[tone]}`}>{children}</span>
}
