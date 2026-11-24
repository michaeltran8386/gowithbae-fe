import { Calendar, ChevronDown, DollarSign, Filter, MapPin, Tag } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { BUDGETS } from '../../lib/budgets.ts'

export type Filters = { areaId: string; budget: string; tagIds: string[]; date: string; time: string }
export const EMPTY_FILTERS: Filters = { areaId: '', budget: '', tagIds: [], date: '', time: '' }

type Group = Schemas['TaxonomyGroup']
/** Tên nhóm + quy tắc kết hợp hiển thị cạnh nhóm (SRC §3.3, RULE-02). */
export const GROUPS: { group: Group; label: string; mode: 'any' | 'all'; icon?: string }[] = [
  { group: 'ACTIVITY', label: 'Hoạt động', mode: 'any' },
  { group: 'VIBE', label: 'Không khí', mode: 'all' },
  { group: 'OCCASION', label: 'Dịp hẹn', mode: 'any' },
  { group: 'STYLE', label: 'Phong cách', mode: 'any' },
  { group: 'SCENERY', label: 'Cảnh quan', mode: 'any' },
  { group: 'FEATURE', label: 'Đặc điểm', mode: 'all' },
  { group: 'AMENITY', label: 'Tiện ích', mode: 'all' },
]

export function countFilters(f: Filters) {
  return (f.areaId ? 1 : 0) + (f.budget ? 1 : 0) + f.tagIds.length + (f.date ? 1 : 0)
}

/**
 * Một bộ lọc dùng chung cho cột desktop và sheet mobile (chỉ khác container) — tránh lệch logic.
 * Component chỉ hiển thị; state nằm ở nơi gọi (bản nháp ở mobile, URL ở desktop).
 */
export function FilterPanel({
  value,
  onChange,
  areas,
  taxonomies,
  idPrefix,
}: {
  value: Filters
  onChange: (next: Filters) => void
  areas: Schemas['Area'][]
  taxonomies: Schemas['Taxonomy'][]
  idPrefix: string
}) {
  const set = (patch: Partial<Filters>) => onChange({ ...value, ...patch })
  const toggleTag = (id: string) =>
    set({ tagIds: value.tagIds.includes(id) ? value.tagIds.filter((x) => x !== id) : [...value.tagIds, id] })

  const activeCount = countFilters(value)

  return (
    <div className="flex flex-col gap-6">
      {/* Header trạng thái */}
      <div className="flex items-center justify-between border-b border-line pb-3">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <Filter size={16} className="text-action" aria-hidden="true" />
          Tiêu chí đang chọn: <span className="text-action">{activeCount}</span>
        </span>
        {activeCount > 0 && (
          <button
            type="button"
            onClick={() => onChange(EMPTY_FILTERS)}
            className="text-xs font-semibold text-ink-muted hover:text-danger hover:underline"
          >
            Đặt lại tất cả
          </button>
        )}
      </div>

      <p className="text-[12px] leading-relaxed text-ink-muted">
        Các nhóm lọc được áp dụng đồng thời. Nơi thiếu thông tin sẽ không được coi là đạt điều kiện.
      </p>

      {/* 1. KHU VỰC */}
      <div className="flex flex-col gap-2 rounded-xl bg-page/60 p-3.5">
        <label htmlFor={`${idPrefix}-area`} className="flex items-center gap-2 text-sm font-bold text-ink">
          <MapPin size={16} className="text-action" aria-hidden="true" />
          Khu vực
        </label>
        <div className="relative">
          <select
            id={`${idPrefix}-area`}
            value={value.areaId}
            onChange={(e) => set({ areaId: e.target.value })}
            className="min-h-11 w-full appearance-none rounded-control border border-field/50 bg-white px-3 pr-8 text-sm font-medium text-ink shadow-2xs hover:border-action focus:border-action focus:outline-none"
          >
            <option value="">Tất cả khu vực</option>
            {areas.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-ink-muted" />
        </div>
      </div>

      {/* 2. NGÂN SÁCH */}
      <fieldset className="flex flex-col gap-2 rounded-xl bg-page/60 p-3.5">
        <legend className="flex items-center gap-2 text-sm font-bold text-ink">
          <DollarSign size={16} className="text-action" aria-hidden="true" />
          Ngân sách cho hai người
        </legend>
        <div className="mt-1 flex flex-col gap-1">
          {[{ value: '', label: 'Mọi mức ngân sách' }, ...BUDGETS].map((b) => {
            const isSelected = value.budget === b.value
            return (
              <label
                key={b.value || 'all'}
                className={`flex min-h-10 cursor-pointer items-center gap-3 rounded-lg px-2.5 transition-colors ${
                  isSelected ? 'bg-action-soft font-semibold text-action' : 'hover:bg-white text-ink'
                }`}
              >
                <input
                  type="radio"
                  name={`${idPrefix}-budget`}
                  value={b.value}
                  checked={isSelected}
                  onChange={() => set({ budget: b.value })}
                  className="size-4 accent-action"
                />
                <span className="text-sm">{b.label}</span>
              </label>
            )
          })}
        </div>
      </fieldset>

      {/* 3. NGÀY GIỜ */}
      <fieldset className="flex flex-col gap-2 rounded-xl bg-page/60 p-3.5">
        <legend className="flex items-center gap-2 text-sm font-bold text-ink">
          <Calendar size={16} className="text-action" aria-hidden="true" />
          Thời điểm hẹn hò
        </legend>
        <p className="text-[12px] text-ink-muted">Chỉ hiển thị quán có mở cửa vào thời gian này.</p>
        <div className="mt-1 grid grid-cols-[1fr_auto] gap-2">
          <label className="min-w-0">
            <span className="sr-only">Ngày</span>
            <input
              type="date"
              value={value.date}
              onChange={(e) => set({ date: e.target.value, time: value.time || '19:00' })}
              className="min-h-11 w-full min-w-0 rounded-control border border-field/50 bg-white px-3 text-sm shadow-2xs hover:border-action focus:border-action"
            />
          </label>
          <label>
            <span className="sr-only">Giờ</span>
            <input
              type="time"
              step={900}
              value={value.time}
              disabled={!value.date}
              onChange={(e) => set({ time: e.target.value })}
              className="min-h-11 w-28 rounded-control border border-field/50 bg-white px-3 text-sm shadow-2xs disabled:bg-page/80 disabled:text-ink-muted hover:border-action focus:border-action"
            />
          </label>
        </div>
      </fieldset>

      {/* 4. CÁC NHÓM TAXONOMY (HOẠT ĐỘNG, KHÔNG KHÍ, DỊP HẸN...) */}
      {GROUPS.map(({ group, label, mode }) => {
        const tags = taxonomies.filter((t) => t.group === group && t.status === 'ACTIVE')
        if (!tags.length) return null
        const selectedInGroup = tags.filter((t) => value.tagIds.includes(t.id)).length

        return (
          <fieldset key={group} className="flex flex-col gap-2.5">
            <legend className="flex w-full items-baseline justify-between gap-2 border-b border-line/60 pb-1.5 text-sm font-bold text-ink">
              <span className="flex items-center gap-2">
                <Tag size={15} className="text-action" aria-hidden="true" />
                {label}
                {selectedInGroup > 0 && (
                  <span className="rounded-full bg-action px-2 py-0.5 text-[11px] font-bold text-white">
                    {selectedInGroup}
                  </span>
                )}
              </span>
              <span className="text-[11px] font-normal text-ink-muted">
                {mode === 'any' ? 'Chọn ít nhất 1' : 'Khớp tất cả'}
              </span>
            </legend>
            <div className="flex flex-wrap gap-2 pt-1">
              {tags.map((t) => {
                const on = value.tagIds.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-[13px] transition-all has-focus-visible:outline-2 has-focus-visible:outline-action ${
                      on
                        ? 'border-action bg-action-soft font-semibold text-action shadow-2xs'
                        : 'border-line bg-white text-ink-muted hover:border-field/70 hover:text-ink'
                    }`}
                  >
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => toggleTag(t.id)} />
                    {t.name}
                  </label>
                )
              })}
            </div>
          </fieldset>
        )
      })}
    </div>
  )
}
