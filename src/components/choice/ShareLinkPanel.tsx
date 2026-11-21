import { useState } from 'react'
import { Check, Copy, Share2, TriangleAlert } from 'lucide-react'
import { formatDateTime } from '../../lib/format.ts'
import { SecondaryButton } from '../ui/Button.tsx'

/** Link mời + cảnh báo bắt buộc về quyền của người có link (FR-10, AC-013). */
const CHOICE_WARNING = 'Ai có liên kết này đều xem được các lựa chọn và có thể tham gia thay người ấy. Chỉ gửi cho người bạn muốn mời.'

export function ShareLinkPanel({
  url,
  expiresAt,
  onShared,
  warning = CHOICE_WARNING,
  shareTitle = 'Cùng chọn nơi hẹn hò',
}: {
  url: string
  expiresAt?: string
  onShared?: () => void
  /** Câu cảnh báo về quyền của người có link; mặc định là câu của lời mời cùng chọn. */
  warning?: string
  shareTitle?: string
}) {
  const [copied, setCopied] = useState(false)
  const canShare = typeof navigator !== 'undefined' && 'share' in navigator

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2 sm:flex-row">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Liên kết mời</span>
          <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} onCopy={onShared} className="min-h-11 w-full rounded-control border border-field bg-page px-3 text-sm" />
        </label>
        <SecondaryButton
          icon={copied ? <Check size={18} aria-hidden="true" /> : <Copy size={18} aria-hidden="true" />}
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(url)
              setCopied(true)
              onShared?.()
            } catch {
              setCopied(false)
            }
          }}
        >
          {copied ? 'Đã sao chép' : 'Sao chép'}
        </SecondaryButton>
        {canShare && (
          <SecondaryButton icon={<Share2 size={18} aria-hidden="true" />} onClick={() => navigator.share({ title: shareTitle, url }).then(onShared, () => undefined)}>
            Chia sẻ
          </SecondaryButton>
        )}
      </div>
      <span className="sr-only" aria-live="polite">
        {copied ? 'Đã sao chép liên kết' : ''}
      </span>
      <p className="flex items-start gap-2 rounded-control border border-ticket-edge bg-peach-50 px-3.5 py-3 text-sm text-attention">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          {warning}
          {expiresAt && <span className="block text-ink-muted tabular">Liên kết hết hạn lúc {formatDateTime(expiresAt)}.</span>}
        </span>
      </p>
    </div>
  )
}
