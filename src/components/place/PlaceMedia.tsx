import { useEffect, useState } from 'react'
import { MapPin } from 'lucide-react'

/**
 * Ảnh địa điểm từ API; kéo ảnh trước với hiệu ứng shimmer mượt mà và fade-in khi tải xong.
 * Nếu thiếu ảnh hoặc ảnh lỗi thì hiện khung giữ chỗ thẩm mỹ, không hiện alt vỡ (RULE-28).
 */
export function PlaceMedia({ url, name, className = '', eager = false }: { url?: string | null; name: string; className?: string; eager?: boolean }) {
  const [loaded, setLoaded] = useState(false)
  const [errored, setErrored] = useState(false)

  useEffect(() => {
    setLoaded(false)
    setErrored(false)
  }, [url])

  if (url && !errored)
    return (
      <div className="relative h-full w-full overflow-hidden bg-action-soft">
        {!loaded && (
          <div
            aria-hidden="true"
            className="animate-shimmer absolute inset-0 bg-[linear-gradient(90deg,var(--color-action-soft)_25%,#fff5f9_50%,var(--color-action-soft)_75%)] bg-[length:200%_100%]"
          />
        )}
        <img
          src={url}
          alt={`Ảnh ${name}`}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          onLoad={() => setLoaded(true)}
          onError={() => setErrored(true)}
          className={`h-full w-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        />
      </div>
    )

  return (
    <div
      role="img"
      aria-label={`${name}: chưa có ảnh`}
      className={`flex h-full w-full flex-col items-center justify-center gap-1 bg-[radial-gradient(120%_90%_at_20%_10%,var(--color-sky-100),var(--color-action-soft)_60%,#fff7fa)] text-action-hover ${className}`}
    >
      <MapPin size={22} aria-hidden="true" />
      <span className="px-3 text-center text-xs font-medium text-ink-muted">Chưa có ảnh</span>
    </div>
  )
}
