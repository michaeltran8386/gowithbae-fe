import { useEffect, type ReactNode } from 'react'
import { Link, useSearchParams } from 'react-router'
import { X } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { useCompare } from '../app/compare.tsx'
import { useAuth, loginHref } from '../app/auth.tsx'
import { useComparePlaces } from '../hooks/places.ts'
import { track } from '../lib/analytics.ts'
import { formatDistance, priceForTwo } from '../lib/format.ts'
import { describeDay, hoursOn } from '../lib/hours.ts'
import { PlaceMedia } from '../components/place/PlaceMedia.tsx'
import { ButtonLink } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton, UnknownValue } from '../components/ui/StateView.tsx'

type Place = Schemas['PlaceDetail']

/** Hàng tiêu chí dùng chung cho bảng (desktop) và thẻ (mobile). Thiếu trường = "Chưa có thông tin", không phải "Không có" (AC-006). */
const ROWS: { label: string; render: (p: Place) => ReactNode }[] = [
  { label: 'Giá cho hai người', render: (p) => (priceForTwo(p.price) ? <span className="font-semibold tabular">{priceForTwo(p.price)}</span> : <UnknownValue />) },
  {
    label: 'Khu vực',
    render: (p) => (
      <>
        {p.area?.name ?? <UnknownValue />}
        {p.distanceKm != null && <span className="block text-[13px] text-ink-muted">{formatDistance(p.distanceKm)}</span>}
      </>
    ),
  },
  {
    label: 'Giờ hôm nay',
    render: (p) => {
      const d = describeDay(hoursOn(p.hours, new Date().toISOString()))
      return d.startsWith('Chưa') ? <UnknownValue /> : <span className="tabular">{d}</span>
    },
  },
  { label: 'Hoạt động', render: (p) => tagText(p, ['ACTIVITY']) },
  { label: 'Không khí', render: (p) => tagText(p, ['VIBE']) },
  { label: 'Tiện ích', render: (p) => tagText(p, ['FEATURE', 'AMENITY']) },
  {
    label: 'Nên đặt trước',
    render: (p) => (p.reservationRecommended == null ? <UnknownValue /> : p.reservationRecommended ? 'Nên đặt trước' : 'Không cần'),
  },
]

function tagText(p: Place, groups: Schemas['TaxonomyGroup'][]) {
  const names = p.tags.filter((t) => groups.includes(t.group)).map((t) => t.name)
  return names.length ? names.join(', ') : <UnknownValue />
}

/** S-05 So sánh — FR-06, RULE-06: 2–3 nơi khác nhau. */
export function ComparePage() {
  const [params, setParams] = useSearchParams()
  const { state: auth } = useAuth()
  const compare = useCompare()
  const ids = [...new Set((params.get('ids') ?? compare.state.ids.join(',')).split(',').filter(Boolean))].slice(0, 3)
  const places = useComparePlaces(ids)

  useEffect(() => {
    if (places.data) track('comparison_opened', { objectId: ids.join(',') })
    // chỉ khi tập so sánh đổi
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [places.data])

  const remove = (id: string) => {
    compare.actions.remove(id)
    const next = ids.filter((x) => x !== id)
    setParams(next.length ? { ids: next.join(',') } : {}, { replace: true })
  }
  const planHref = (id: string) => (auth.status === 'member' ? `/plans/new?placeId=${id}` : loginHref(`/plans/new?placeId=${id}`))

  return (
    <>
      <h1 className="text-2xl font-bold md:text-3xl">So sánh địa điểm</h1>
      <p className="mt-1 text-ink-muted">So sánh tối đa 3 nơi trên cùng tiêu chí.</p>
      <div className="mt-6">
        {ids.length < 2 ? (
          <EmptyState title={ids.length === 1 ? 'Thêm ít nhất 1 nơi nữa để so sánh' : 'Chưa có nơi nào để so sánh'} action={<ButtonLink to="/search">Tìm địa điểm</ButtonLink>}>
            Bấm “So sánh” trên thẻ địa điểm để thêm vào khay.
          </EmptyState>
        ) : places.isError ? (
          <ErrorState error={places.error} onRetry={() => places.refetch()} />
        ) : places.isPending ? (
          <Skeleton className="h-96" />
        ) : (
          <>
            <CompareTable places={places.data} onRemove={remove} planHref={planHref} />
            <CompareCards places={places.data} onRemove={remove} planHref={planHref} />
          </>
        )}
      </div>
    </>
  )
}

type ViewProps = { places: Place[]; onRemove: (id: string) => void; planHref: (id: string) => string }

function CompareTable({ places, onRemove, planHref }: ViewProps) {
  return (
    <div className="hidden overflow-hidden rounded-block border border-line bg-white md:block">
      <table className="w-full table-fixed text-sm">
        <caption className="sr-only">Bảng so sánh {places.length} địa điểm</caption>
        <thead>
          <tr className="border-b border-line">
            <th scope="col" className="w-44 p-4 text-left text-ink-muted">
              <span className="sr-only">Tiêu chí</span>
            </th>
            {places.map((p) => (
              <th key={p.id} scope="col" className="p-4 text-left align-top font-normal">
                <div className="mb-3 aspect-[16/10] overflow-hidden rounded-control">
                  <PlaceMedia url={p.images.find((i) => i.cover)?.url} name={p.name} />
                </div>
                <Link to={`/places/${p.id}`} className="line-clamp-2 text-[15px] font-semibold hover:text-action">
                  {p.name}
                </Link>
                <div className="mt-3 flex flex-wrap gap-2">
                  <ButtonLink to={planHref(p.id)} className="min-h-10 px-3">
                    Chọn nơi này
                  </ButtonLink>
                  <button type="button" onClick={() => onRemove(p.id)} className="inline-flex min-h-10 items-center gap-1 px-2 text-ink-muted hover:text-ink">
                    <X size={16} aria-hidden="true" /> Bỏ
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((row) => (
            <tr key={row.label} className="border-b border-line last:border-0">
              <th scope="row" className="p-4 text-left align-top font-semibold text-ink-muted">
                {row.label}
              </th>
              {places.map((p) => (
                <td key={p.id} className="p-4 align-top">
                  {row.render(p)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function CompareCards({ places, onRemove, planHref }: ViewProps) {
  return (
    <div className="flex flex-col gap-3 md:hidden">
      <ul className="grid gap-2" style={{ gridTemplateColumns: `repeat(${places.length}, minmax(0,1fr))` }}>
        {places.map((p) => (
          <li key={p.id} className="flex flex-col gap-2 rounded-block border border-line bg-white p-2">
            <Link to={`/places/${p.id}`} className="line-clamp-2 text-[13px] leading-5 font-semibold">
              {p.name}
            </Link>
            <button type="button" onClick={() => onRemove(p.id)} className="mt-auto inline-flex min-h-9 items-center gap-1 text-[13px] text-ink-muted">
              <X size={14} aria-hidden="true" /> Bỏ<span className="sr-only"> {p.name}</span>
            </button>
          </li>
        ))}
      </ul>
      {ROWS.map((row) => (
        <section key={row.label} className="rounded-block border border-line bg-white p-3">
          <h2 className="mb-2 text-[13px] font-semibold text-ink-muted">{row.label}</h2>
          <div className="grid gap-2 text-[13px] leading-5" style={{ gridTemplateColumns: `repeat(${places.length}, minmax(0,1fr))` }}>
            {places.map((p) => (
              <div key={p.id} className="min-w-0 break-words">
                <span className="sr-only">{p.name}: </span>
                {row.render(p)}
              </div>
            ))}
          </div>
        </section>
      ))}
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${places.length}, minmax(0,1fr))` }}>
        {places.map((p) => (
          <ButtonLink key={p.id} to={planHref(p.id)} className="px-2 text-[13px]">
            Chọn<span className="sr-only"> {p.name}</span>
          </ButtonLink>
        ))}
      </div>
    </div>
  )
}
