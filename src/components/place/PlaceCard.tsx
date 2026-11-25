import { createContext, use, type ReactNode } from 'react'
import { Link } from 'react-router'
import { useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from '../../api/client.ts'
import { unwrap } from '../../api/problem.ts'
import { formatDistance, priceForTwo } from '../../lib/format.ts'
import { PlaceMedia } from './PlaceMedia.tsx'

/**
 * PlaceCard compound (architecture-compound-components): mỗi màn tự ghép phần cần dùng,
 * không có cờ boolean kiểu `showSave/showCompare/compact`.
 */
type Place = Schemas['PlaceCard']
const Ctx = createContext<Place | null>(null)
const usePlace = () => {
  const p = use(Ctx)
  if (!p) throw new Error('PlaceCard.* phải nằm trong PlaceCard.Root')
  return p
}

function Root({ place, children, className = '', muted = false }: { place: Place; children: ReactNode; className?: string; muted?: boolean }) {
  return (
    <Ctx value={place}>
      <article className={`relative flex flex-col overflow-hidden rounded-block border border-line bg-white ${muted ? 'opacity-70' : ''} ${className}`}>
        {children}
      </article>
    </Ctx>
  )
}

function Media({ children, eager = false }: { children?: ReactNode; eager?: boolean }) {
  const p = usePlace()
  return (
    <div className="relative aspect-[16/10] bg-action-soft">
      <PlaceMedia url={p.coverUrl} name={p.name} eager={eager} />
      {children}
    </div>
  )
}

/** Tên là link phủ cả thẻ (thẻ là một vùng chạm); nút bên trong nằm trên lớp link. Prefetch chi tiết khi hover/focus để mở trang tức thì. */
function Title({ to }: { to?: string }) {
  const p = usePlace()
  const qc = useQueryClient()
  const prefetch = () => {
    void qc.prefetchQuery({
      queryKey: ['places', p.id],
      queryFn: () => unwrap(api.GET('/places/{placeId}', { params: { path: { placeId: p.id } } })),
      staleTime: 60_000,
    })
  }
  return (
    <h3 className="line-clamp-2 min-w-0 text-[17px] leading-6 font-semibold">
      <Link
        to={to ?? `/places/${p.id}`}
        state={{ preview: { name: p.name, coverUrl: p.coverUrl, areaName: p.areaName } }}
        onMouseEnter={prefetch}
        onFocus={prefetch}
        className="after:absolute after:inset-0 after:content-[''] hover:text-action"
      >
        {p.name}
      </Link>
    </h3>
  )
}

function Meta() {
  const p = usePlace()
  return (
    <p className="text-[13px] text-ink-muted">
      {p.areaName ?? 'Chưa có thông tin khu vực'}
      {p.distanceKm != null && <span> · {formatDistance(p.distanceKm)}</span>}
    </p>
  )
}

function Price() {
  const p = usePlace()
  const price = priceForTwo(p.price)
  return price ? (
    <p className="tabular font-bold">
      {price} <span className="text-[13px] font-normal text-ink-muted">/ 2 người</span>
    </p>
  ) : (
    <p className="text-sm text-ink-muted">Chưa có thông tin giá</p>
  )
}

function Tags() {
  const p = usePlace()
  if (p.tags.length === 0) return null
  return (
    <ul className="flex flex-wrap gap-1.5" aria-label="Nhãn">
      {p.tags.slice(0, 3).map((t) => (
        <li key={t.id} className="rounded-full bg-page px-2.5 py-0.5 text-xs text-ink-muted">
          {t.name}
        </li>
      ))}
    </ul>
  )
}

function Body({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col gap-2 p-3.5">{children}</div>
}

/** Vùng nút nằm trên link phủ thẻ. */
function Actions({ children }: { children: ReactNode }) {
  return <div className="relative z-10 mt-auto flex items-center gap-2 pt-1">{children}</div>
}

export const PlaceCard = { Root, Media, Body, Title, Meta, Price, Tags, Actions }
