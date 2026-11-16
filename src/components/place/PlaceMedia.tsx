import { MapPin } from 'lucide-react'

/**
 * Ảnh địa điểm từ API; không có ảnh có quyền sử dụng thì hiện khung giữ chỗ có tên (RULE-28).
 * Không dùng ảnh stock.
 */
export function PlaceMedia({ url, name, className = '', eager = false }: { url?: string | null; name: string; className?: string; eager?: boolean }) {
  if (url)
    return (
      <img
        src={url}
        alt={`Ảnh ${name}`}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        className={`h-full w-full object-cover ${className}`}
      />
    )
  return (
    <div
      role="img"
      aria-label={`${name}: chưa có ảnh`}
      className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-[radial-gradient(120%_90%_at_20%_10%,var(--color-sky-100),var(--color-action-soft)_60%,#f7fbfd)] text-action-hover ${className}`}
    >
      <MapPin size={22} aria-hidden="true" />
      <span className="px-3 text-center text-xs font-medium text-ink-muted">Chưa có ảnh</span>
    </div>
  )
}
