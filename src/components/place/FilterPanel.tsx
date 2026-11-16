import type { Schemas } from '../../api/client.ts'
import { BUDGETS } from '../../lib/budgets.ts'

export type Filters = { areaId: string; budget: string; tagIds: string[]; date: string; time: string }
export const EMPTY_FILTERS: Filters = { areaId: '', budget: '', tagIds: [], date: '', time: '' }

type Group = Schemas['TaxonomyGroup']
/** Tên nhóm + quy tắc kết hợp hiển thị cạnh nhóm (SRC §3.3, RULE-02). */
export const GROUPS: { group: Group; label: string; mode: 'any' | 'all' }[] = [
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

  return (
    <div className="flex flex-col gap-6">
      <p className="text-[13px] text-ink-muted">Các nhóm lọc được áp dụng cùng lúc. Nơi thiếu thông tin sẽ không được coi là đạt điều kiện.</p>

      <div className="flex flex-col gap-1.5">
        <label htmlFor={`${idPrefix}-area`} className="text-sm font-semibold">
          Khu vực
        </label>
        <select
          id={`${idPrefix}-area`}
          value={value.areaId}
          onChange={(e) => set({ areaId: e.target.value })}
          className="min-h-11 rounded-control border border-field bg-white px-3"
        >
          <option value="">Mọi khu vực</option>
          {areas.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="mb-2 text-sm font-semibold">Ngân sách cho hai người</legend>
        <div className="flex flex-col gap-1">
          {[{ value: '', label: 'Mọi ngân sách' }, ...BUDGETS].map((b) => (
            <label key={b.value || 'all'} className="flex min-h-10 cursor-pointer items-center gap-3 rounded-control px-2 hover:bg-page">
              <input
                type="radio"
                name={`${idPrefix}-budget`}
                value={b.value}
                checked={value.budget === b.value}
                onChange={() => set({ budget: b.value })}
                className="size-4 accent-action"
              />
              <span className="text-sm">{b.label}</span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-1 text-sm font-semibold">Ngày giờ dự định đến</legend>
        <p className="mb-2 text-[13px] text-ink-muted">Chỉ hiện nơi có giờ mở cửa đã xác minh vào lúc đó.</p>
        <div className="grid grid-cols-[1fr_auto] gap-2">
          <label className="min-w-0">
            <span className="sr-only">Ngày</span>
            <input
              type="date"
              value={value.date}
              onChange={(e) => set({ date: e.target.value, time: value.time || '19:00' })}
              className="min-h-11 w-full min-w-0 rounded-control border border-field bg-white px-3"
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
              className="min-h-11 w-28 rounded-control border border-field bg-white px-3 disabled:bg-page"
            />
          </label>
        </div>
      </fieldset>

      {GROUPS.map(({ group, label, mode }) => {
        const tags = taxonomies.filter((t) => t.group === group && t.status === 'ACTIVE')
        if (!tags.length) return null
        return (
          <fieldset key={group}>
            <legend className="mb-2 flex w-full items-baseline justify-between gap-2 text-sm font-semibold">
              {label}
              <span className="text-xs font-normal text-ink-muted">{mode === 'any' ? 'Chọn ít nhất một' : 'Phải có đủ'}</span>
            </legend>
            <div className="flex flex-wrap gap-2">
              {tags.map((t) => {
                const on = value.tagIds.includes(t.id)
                return (
                  <label
                    key={t.id}
                    className={`inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3 text-[13px] has-focus-visible:outline-2 has-focus-visible:outline-action ${
                      on ? 'border-action bg-action-soft font-semibold text-action' : 'border-line bg-white text-ink-muted'
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
