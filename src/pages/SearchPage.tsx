import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronDown, ChevronLeft, ChevronRight, DollarSign, List, LocateFixed, Map as MapIcon, MapPin, SlidersHorizontal, X } from 'lucide-react'
import { useAreas, useSearchPlaces, useTaxonomies, type PlaceSearchParams } from '../hooks/places.ts'
import { track } from '../lib/analytics.ts'
import { BUDGETS, budgetLabel } from '../lib/budgets.ts'
import { toVnIso, vnParts } from '../lib/format.ts'
import { EMPTY_FILTERS, FilterPanel, countFilters, type Filters } from '../components/place/FilterPanel.tsx'
import { MiniMapView } from '../components/place/MiniMapView.tsx'
import { PlaceGrid } from '../components/place/PlaceGrid.tsx'
import { Dialog } from '../components/ui/Dialog.tsx'
import { GhostButton, PrimaryButton, SecondaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { PinterestSearchBar } from '../components/search/PinterestSearchBar.tsx'

const PAGE_SIZE = 12
type Sort = 'DEFAULT' | 'PRICE_ASC' | 'NEAREST'

/** Đọc toàn bộ điều kiện từ URL (chia sẻ được, Back giữ nguyên — FR-03). */
function readParams(params: URLSearchParams) {
  const at = params.get('at')
  const parts = at ? vnParts(at) : null
  const filters: Filters = {
    areaId: params.get('areaId') ?? '',
    budget: params.get('budget') ?? '',
    tagIds: params.getAll('tagIds'),
    date: parts?.date ?? '',
    time: parts?.time ?? '',
  }
  const lat = params.get('lat')
  const lng = params.get('lng')
  return {
    q: params.get('q') ?? '',
    filters,
    origin: lat && lng ? { lat: Number(lat), lng: Number(lng) } : null,
    sort: (params.get('sort') as Sort | null) ?? 'DEFAULT',
    page: Number(params.get('page') ?? 0),
    view: params.get('view') === 'map' ? 'map' : 'list',
  }
}

/** S-03 Kết quả — FR-02..04, RULE-02..05. */
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const { q, filters, origin, sort, page, view } = readParams(params)
  const areas = useAreas()
  const taxonomies = useTaxonomies()

  const query: PlaceSearchParams = {
    q: q || undefined,
    areaId: filters.areaId || undefined,
    budget: (filters.budget || undefined) as PlaceSearchParams['budget'],
    tagIds: filters.tagIds.length ? filters.tagIds : undefined,
    at: filters.date && filters.time ? toVnIso(filters.date, filters.time) : undefined,
    lat: origin?.lat,
    lng: origin?.lng,
    sort,
    page,
    size: PAGE_SIZE,
  }
  const results = useSearchPlaces(query)

  // results_shown cho mỗi lượt tìm mới (search_id từ server)
  const lastSearchId = useRef<string | null>(null)
  useEffect(() => {
    const data = results.data
    if (!data || data.searchId === lastSearchId.current) return
    lastSearchId.current = data.searchId
    track('results_shown', {
      properties: {
        search_id: data.searchId,
        results_count: data.page.totalElements,
        ...(filters.areaId ? { area_id: filters.areaId } : {}),
      },
    })
  }, [results.data, filters.areaId])

  /** search: tính là một lượt tìm (FR-32 — gửi truy vấn hoặc áp dụng lọc). keepPage: chỉ khi chuyển trang. */
  function update(mutate: (p: URLSearchParams) => void, { search = true, keepPage = false } = {}) {
    const next = new URLSearchParams(params)
    if (!keepPage) next.delete('page')
    mutate(next)
    setParams(next)
    const nextAreaId = readParams(next).filters.areaId
    if (search) track('search_submitted', nextAreaId ? { properties: { area_id: nextAreaId } } : undefined)
  }

  function applyFilters(f: Filters) {
    update((p) => {
      for (const k of ['areaId', 'budget', 'tagIds', 'at']) p.delete(k)
      if (f.areaId) {
        p.set('areaId', f.areaId)
        p.delete('lat') // khu vực và vị trí loại trừ nhau (PROP OQ-05)
        p.delete('lng')
        if (p.get('sort') === 'NEAREST') p.delete('sort')
      }
      if (f.budget) p.set('budget', f.budget)
      f.tagIds.forEach((id) => p.append('tagIds', id))
      if (f.date && f.time) p.set('at', toVnIso(f.date, f.time))
    })
  }

  const tagName = (id: string) => taxonomies.data?.find((t) => t.id === id)?.name ?? 'Nhãn'
  const chips = [
    ...(filters.areaId ? [{ key: 'area', label: areas.data?.find((a) => a.id === filters.areaId)?.name ?? 'Khu vực', remove: () => applyFilters({ ...filters, areaId: '' }) }] : []),
    ...(filters.budget ? [{ key: 'budget', label: budgetLabel(filters.budget) ?? 'Ngân sách', remove: () => applyFilters({ ...filters, budget: '' }) }] : []),
    ...(filters.date ? [{ key: 'at', label: `${filters.date.split('-').reverse().join('/')} ${filters.time}`, remove: () => applyFilters({ ...filters, date: '', time: '' }) }] : []),
    ...filters.tagIds.map((id) => ({ key: id, label: tagName(id), remove: () => applyFilters({ ...filters, tagIds: filters.tagIds.filter((x) => x !== id) }) })),
    ...(origin ? [{ key: 'origin', label: 'Gần vị trí của bạn', remove: () => update((p) => (p.delete('lat'), p.delete('lng'), p.get('sort') === 'NEAREST' && p.delete('sort'))) }] : []),
  ]

  return (
    <div className="flex flex-col gap-5">
      <h1 className="sr-only">Kết quả tìm kiếm</h1>

      {/* BẬC 1: THANH TÌM KIẾM NẰM TRÊN MỘT BẬC RIÊNG VÀ TRẢI DÀI RA (Phong cách Pinterest) */}
      <div className="w-full">
        <PinterestSearchBar
          initialValue={q}
          placeholder="Tìm theo tên quán, khu vực, món ăn, hoạt động hẹn hò…"
          onSubmitQuery={(value) => update((p) => (value ? p.set('q', value) : p.delete('q')))}
        />
      </div>

      {/* BẬC 2: THANH CÔNG CỤ BỘ LỌC ĐƯỢC SẮP XẾP LẠI GỌN GÀNG, TRỰC QUAN */}
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-white p-3 shadow-xs md:p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Cụm bộ lọc nhanh bên trái */}
          <div className="flex flex-wrap items-center gap-2">
            <MobileFilters filters={filters} onApply={applyFilters} areas={areas.data ?? []} taxonomies={taxonomies.data ?? []} />

            {/* Bộ lọc khu vực nhanh */}
            <div className="hidden sm:block">
              <label className="relative flex items-center">
                <span className="sr-only">Khu vực nhanh</span>
                <MapPin size={15} className="pointer-events-none absolute left-2.5 text-action" aria-hidden="true" />
                <select
                  value={filters.areaId}
                  onChange={(e) => applyFilters({ ...filters, areaId: e.target.value })}
                  className="min-h-10 rounded-lg border border-field/40 bg-page/60 pr-7 pl-8 text-xs font-semibold text-ink transition-colors hover:border-action focus:border-action focus:bg-white"
                >
                  <option value="">Tất cả khu vực</option>
                  {areas.data?.filter((a) => a.status === 'ACTIVE').map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 text-ink-muted" />
              </label>
            </div>

            {/* Bộ lọc ngân sách nhanh */}
            <div className="hidden sm:block">
              <label className="relative flex items-center">
                <span className="sr-only">Ngân sách nhanh</span>
                <DollarSign size={15} className="pointer-events-none absolute left-2.5 text-action" aria-hidden="true" />
                <select
                  value={filters.budget}
                  onChange={(e) => applyFilters({ ...filters, budget: e.target.value })}
                  className="min-h-10 rounded-lg border border-field/40 bg-page/60 pr-7 pl-8 text-xs font-semibold text-ink transition-colors hover:border-action focus:border-action focus:bg-white"
                >
                  <option value="">Mọi ngân sách</option>
                  {BUDGETS.map((b) => (
                    <option key={b.value} value={b.value}>
                      {b.label}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="pointer-events-none absolute right-2 text-ink-muted" />
              </label>
            </div>

            <LocationButton
              active={!!origin}
              onLocate={(lat, lng) =>
                update((p) => {
                  p.set('lat', String(lat))
                  p.set('lng', String(lng))
                  p.delete('areaId')
                  p.set('sort', 'NEAREST')
                })
              }
            />
          </div>

          {/* Cụm đếm kết quả, sắp xếp và chế độ xem bên phải */}
          <div className="flex flex-wrap items-center gap-3">
            <h2 id="results-heading" aria-live="polite" className="text-[14px] font-bold text-ink tabular">
              {results.data ? `${results.data.page.totalElements} địa điểm` : 'Đang tìm…'}
            </h2>

            <label className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
              <span>Sắp xếp:</span>
              <select
                value={sort}
                onChange={(e) => update((p) => p.set('sort', e.target.value), { search: false })}
                className="min-h-9 rounded-lg border border-field/40 bg-white px-2 text-xs font-semibold text-ink shadow-2xs hover:border-action focus:border-action"
              >
                <option value="DEFAULT">Phù hợp nhất</option>
                <option value="PRICE_ASC">Giá thấp đến cao</option>
                <option value="NEAREST" disabled={!origin}>
                  Gần nhất{origin ? '' : ' (cần vị trí)'}
                </option>
              </select>
            </label>

            <div role="group" aria-label="Cách hiển thị" className="flex rounded-lg border border-line bg-page p-0.5">
              {(['list', 'map'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => update((p) => (v === 'map' ? p.set('view', 'map') : p.delete('view')), { search: false, keepPage: true })}
                  className={`inline-flex min-h-8 items-center gap-1 rounded-md px-2.5 text-xs transition-colors ${
                    view === v ? 'bg-white font-bold text-action shadow-2xs' : 'text-ink-muted hover:text-ink'
                  }`}
                >
                  {v === 'list' ? <List size={14} aria-hidden="true" /> : <MapIcon size={14} aria-hidden="true" />}
                  {v === 'list' ? 'Danh sách' : 'Bản đồ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Danh sách chip các điều kiện lọc đang áp dụng */}
        {chips.length > 0 && (
          <div className="border-t border-line/60 pt-2.5">
            <ul className="flex flex-wrap items-center gap-2" aria-label="Điều kiện đang áp dụng">
              <li className="text-xs font-semibold text-ink-muted mr-1">Đang lọc theo:</li>
              {chips.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={c.remove}
                    className="inline-flex min-h-8 items-center gap-1.5 rounded-full border border-action/40 bg-action-soft pr-2 pl-3 text-xs font-semibold text-action transition-colors hover:border-action hover:bg-action/10"
                  >
                    <span>{c.label}</span>
                    <X size={13} aria-hidden="true" />
                    <span className="sr-only">Bỏ điều kiện này</span>
                  </button>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => applyFilters(EMPTY_FILTERS)}
                  className="min-h-8 px-2 text-xs font-semibold text-ink-muted hover:text-danger hover:underline"
                >
                  Xóa tất cả
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>

      {/* BẬC 3: NỘI DUNG CHÍNH (SIDEBAR BỘ LỌC CHI TIẾT TRÊN DESKTOP + LƯỚI ĐỊA ĐIỂM) */}
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-labelledby="filter-heading">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-2xl border border-line bg-white p-4 shadow-xs">
            <h2 id="filter-heading" className="mb-4 text-[16px] font-bold text-ink">
              Bộ lọc chi tiết
            </h2>
            <FilterPanel idPrefix="desk" value={filters} onChange={applyFilters} areas={areas.data ?? []} taxonomies={taxonomies.data ?? []} />
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div>
            {view === 'map' ? (
              results.isError ? (
                <ErrorState error={results.error} onRetry={() => results.refetch()} />
              ) : results.isPending ? (
                <Skeleton className="h-[480px]" />
              ) : results.data.items.length === 0 ? (
                <EmptyState
                  icon={<MapIcon size={32} />}
                  title="Không có địa điểm để hiển thị trên bản đồ"
                  action={
                    <SecondaryButton onClick={() => update((p) => p.delete('view'), { search: false, keepPage: true })} icon={<List size={18} aria-hidden="true" />}>
                      Xem danh sách
                    </SecondaryButton>
                  }
                >
                  Thử bỏ bớt điều kiện lọc hoặc đổi từ khóa tìm kiếm.
                </EmptyState>
              ) : (
                <MiniMapView places={results.data.items} />
              )
            ) : results.isError ? (
              <ErrorState error={results.error} onRetry={() => results.refetch()} />
            ) : results.isPending ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
                {Array.from({ length: 6 }, (_, i) => (
                  <Skeleton key={i} className="h-72" />
                ))}
              </div>
            ) : results.data.items.length === 0 ? (
              <EmptyState title="Không có địa điểm khớp tất cả điều kiện">
                {chips.length > 0 ? 'Thử bỏ bớt một điều kiện ở trên. Bộ lọc của bạn được giữ nguyên.' : 'Thử từ khóa khác, ví dụ tên khu vực hoặc hoạt động.'}
              </EmptyState>
            ) : (
              <div className={results.isPlaceholderData ? 'opacity-60 transition-opacity' : ''}>
                <PlaceGrid places={results.data.items} />
                <Pagination
                  page={results.data.page.page}
                  totalPages={results.data.page.totalPages}
                  onPage={(n) => update((p) => p.set('page', String(n)), { search: false, keepPage: true })}
                />
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}


function MobileFilters({
  filters,
  onApply,
  areas,
  taxonomies,
}: {
  filters: Filters
  onApply: (f: Filters) => void
  areas: Parameters<typeof FilterPanel>[0]['areas']
  taxonomies: Parameters<typeof FilterPanel>[0]['taxonomies']
}) {
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState(filters)
  const count = countFilters(filters)
  return (
    <>
      <SecondaryButton
        className="lg:hidden"
        icon={<SlidersHorizontal size={18} aria-hidden="true" />}
        onClick={() => {
          setDraft(filters) // bản nháp: chỉ áp khi bấm Áp dụng (UX-07)
          setOpen(true)
        }}
      >
        Bộ lọc{count > 0 && <span className="tabular"> ({count})</span>}
      </SecondaryButton>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title="Bộ lọc"
        footer={
          <>
            <GhostButton onClick={() => setDraft(EMPTY_FILTERS)}>Xóa bộ lọc</GhostButton>
            <PrimaryButton
              onClick={() => {
                onApply(draft)
                setOpen(false)
              }}
            >
              Áp dụng
            </PrimaryButton>
          </>
        }
      >
        <FilterPanel idPrefix="sheet" value={draft} onChange={setDraft} areas={areas} taxonomies={taxonomies} />
      </Dialog>
    </>
  )
}

/** Vị trí chỉ lấy khi người dùng bấm, một lần, làm tròn ~1 km (NFR-07). Từ chối → nhập khu vực thủ công. */
function LocationButton({ active, onLocate }: { active: boolean; onLocate: (lat: number, lng: number) => void }) {
  const [status, setStatus] = useState<'idle' | 'locating' | 'denied'>('idle')
  if (active) return null
  return (
    <div className="flex items-center gap-2">
      <GhostButton
        pending={status === 'locating'}
        icon={<LocateFixed size={18} aria-hidden="true" />}
        className="border border-line bg-white"
        onClick={() => {
          if (!('geolocation' in navigator)) return setStatus('denied')
          setStatus('locating')
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              setStatus('idle')
              onLocate(Math.round(pos.coords.latitude * 100) / 100, Math.round(pos.coords.longitude * 100) / 100)
            },
            () => setStatus('denied'),
            { maximumAge: 600_000, timeout: 10_000 },
          )
        }}
      >
        Gần tôi
      </GhostButton>
      {status === 'denied' && (
        <span role="status" className="text-[13px] text-attention">
          Không lấy được vị trí. Hãy chọn khu vực trong bộ lọc.
        </span>
      )}
    </div>
  )
}

function Pagination({ page, totalPages, onPage }: { page: number; totalPages: number; onPage: (n: number) => void }) {
  if (totalPages <= 1) return null
  return (
    <nav aria-label="Phân trang" className="mt-6 flex items-center justify-center gap-2">
      <GhostButton disabled={page === 0} onClick={() => onPage(page - 1)} icon={<ChevronLeft size={18} aria-hidden="true" />}>
        Trước
      </GhostButton>
      <span className="text-sm tabular">
        Trang {page + 1}/{totalPages}
      </span>
      <GhostButton disabled={page >= totalPages - 1} onClick={() => onPage(page + 1)}>
        Sau <ChevronRight size={18} aria-hidden="true" />
      </GhostButton>
    </nav>
  )
}
