import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ChevronLeft, ChevronRight, List, LocateFixed, Map as MapIcon, Search, SlidersHorizontal, X } from 'lucide-react'
import { useAreas, useSearchPlaces, useTaxonomies, type PlaceSearchParams } from '../hooks/places.ts'
import { track } from '../lib/analytics.ts'
import { budgetLabel } from '../lib/budgets.ts'
import { toVnIso, vnParts } from '../lib/format.ts'
import { EMPTY_FILTERS, FilterPanel, countFilters, type Filters } from '../components/place/FilterPanel.tsx'
import { PlaceGrid } from '../components/place/PlaceGrid.tsx'
import { Dialog } from '../components/ui/Dialog.tsx'
import { GhostButton, PrimaryButton, SecondaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'

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
    track('results_shown', { properties: { searchId: data.searchId, resultsCount: data.page.totalElements } })
  }, [results.data])

  /** search: tính là một lượt tìm (FR-32 — gửi truy vấn hoặc áp dụng lọc). keepPage: chỉ khi chuyển trang. */
  function update(mutate: (p: URLSearchParams) => void, { search = true, keepPage = false } = {}) {
    const next = new URLSearchParams(params)
    if (!keepPage) next.delete('page')
    mutate(next)
    setParams(next)
    if (search) track('search_submitted', { properties: { filterCount: countFilters(readParams(next).filters) } })
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
    <div>
      <h1 className="sr-only">Kết quả tìm kiếm</h1>
      <SearchBox initial={q} onSubmit={(value) => update((p) => (value ? p.set('q', value) : p.delete('q')))} />

      <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="hidden lg:block" aria-labelledby="filter-heading">
          <div className="sticky top-20 max-h-[calc(100dvh-6rem)] overflow-y-auto rounded-block border border-line bg-white p-4">
            <h2 id="filter-heading" className="mb-4 text-[17px] font-semibold">
              Bộ lọc
            </h2>
            <FilterPanel idPrefix="desk" value={filters} onChange={applyFilters} areas={areas.data ?? []} taxonomies={taxonomies.data ?? []} />
          </div>
        </aside>

        <section aria-labelledby="results-heading" className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <MobileFilters filters={filters} onApply={applyFilters} areas={areas.data ?? []} taxonomies={taxonomies.data ?? []} />
            <h2 id="results-heading" aria-live="polite" className="mr-auto text-[15px] font-semibold tabular">
              {results.data ? `${results.data.page.totalElements} địa điểm` : 'Đang tìm…'}
            </h2>
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
            <label className="flex items-center gap-2 text-sm">
              <span className="text-ink-muted">Sắp xếp</span>
              <select
                value={sort}
                onChange={(e) => update((p) => p.set('sort', e.target.value), { search: false })}
                className="min-h-11 rounded-control border border-field bg-white px-3"
              >
                <option value="DEFAULT">Phù hợp</option>
                <option value="PRICE_ASC">Giá thấp đến cao</option>
                <option value="NEAREST" disabled={!origin}>
                  Gần nhất{origin ? '' : ' (cần vị trí)'}
                </option>
              </select>
            </label>
            <div role="group" aria-label="Cách hiển thị" className="flex rounded-control border border-line bg-white p-0.5">
              {(['list', 'map'] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={view === v}
                  onClick={() => update((p) => (v === 'map' ? p.set('view', 'map') : p.delete('view')), { search: false, keepPage: true })}
                  className={`inline-flex min-h-10 items-center gap-1.5 rounded-[8px] px-3 text-sm ${view === v ? 'bg-action-soft font-semibold text-action' : 'text-ink-muted'}`}
                >
                  {v === 'list' ? <List size={16} aria-hidden="true" /> : <MapIcon size={16} aria-hidden="true" />}
                  {v === 'list' ? 'Danh sách' : 'Bản đồ'}
                </button>
              ))}
            </div>
          </div>

          {chips.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2" aria-label="Điều kiện đang áp dụng">
              {chips.map((c) => (
                <li key={c.key}>
                  <button
                    type="button"
                    onClick={c.remove}
                    className="inline-flex min-h-9 items-center gap-1 rounded-full border border-action bg-action-soft pr-2 pl-3 text-[13px] font-semibold text-action"
                  >
                    {c.label}
                    <X size={14} aria-hidden="true" />
                    <span className="sr-only">Bỏ điều kiện này</span>
                  </button>
                </li>
              ))}
              <li>
                <button type="button" onClick={() => applyFilters(EMPTY_FILTERS)} className="min-h-9 px-2 text-[13px] text-ink-muted underline-offset-2 hover:underline">
                  Xóa tất cả
                </button>
              </li>
            </ul>
          )}

          <div className="mt-4">
            {view === 'map' ? (
              <EmptyState
                icon={<MapIcon size={32} />}
                title="Bản đồ chưa sẵn sàng"
                action={
                  <SecondaryButton onClick={() => update((p) => p.delete('view'), { search: false, keepPage: true })} icon={<List size={18} aria-hidden="true" />}>
                    Xem danh sách
                  </SecondaryButton>
                }
              >
                Nhà cung cấp bản đồ đang được lựa chọn. Danh sách vẫn đầy đủ kết quả và bộ lọc của bạn.
              </EmptyState>
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

function SearchBox({ initial, onSubmit }: { initial: string; onSubmit: (q: string) => void }) {
  const [value, setValue] = useState(initial)
  useEffect(() => setValue(initial), [initial])
  return (
    <form
      role="search"
      className="flex gap-2"
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(value.trim())
      }}
    >
      <label className="relative flex-1">
        <span className="sr-only">Tìm kiếm</span>
        <Search size={18} className="absolute top-1/2 left-3.5 -translate-y-1/2 text-ink-muted" aria-hidden="true" />
        <input
          type="search"
          value={value}
          maxLength={100}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Tên quán, khu vực, hoạt động…"
          className="min-h-12 w-full rounded-control border border-field bg-white pr-3 pl-10"
        />
      </label>
      <PrimaryButton type="submit" className="min-h-12">
        Tìm
      </PrimaryButton>
    </form>
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
