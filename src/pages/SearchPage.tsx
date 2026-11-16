import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { api, type Schemas } from '../api/client.ts'

type Page = Schemas['PlaceSearchPage']
type Budget = Schemas['BudgetBand']

const BUDGETS: { value: Budget; label: string }[] = [
  { value: 'FREE', label: 'Miễn phí' },
  { value: 'UNDER_200K', label: 'Dưới 200.000đ' },
  { value: 'FROM_200K_TO_400K', label: '200.000đ – dưới 400.000đ' },
  { value: 'FROM_400K_TO_700K', label: '400.000đ – 700.000đ' },
  { value: 'OVER_700K', label: 'Trên 700.000đ' },
]

const vnd = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

/** C02 — ví dụ nối API thật (GET /places). Bộ lọc nhãn/giờ/vị trí, bản đồ, khay so sánh: chưa làm. */
export function SearchPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const budget = (params.get('budget') as Budget | null) ?? undefined
  const [data, setData] = useState<Page | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    api
      .GET('/places', { params: { query: { q: q || undefined, budget } } })
      .then(({ data, error }) => {
        if (cancelled) return
        setError(error ? (error.detail ?? error.title) : null)
        if (data) setData(data)
      })
      .catch(() => !cancelled && setError('Không kết nối được máy chủ'))
    return () => {
      cancelled = true
    }
  }, [q, budget])

  function update(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next)
  }

  return (
    <section>
      <h1 className="text-2xl font-bold text-primary">Kết quả</h1>
      <form className="mt-4 flex flex-col gap-3 md:flex-row" onSubmit={(e) => e.preventDefault()}>
        <label className="flex-1">
          <span className="sr-only">Tìm kiếm</span>
          <input
            defaultValue={q}
            onChange={(e) => update('q', e.target.value)}
            placeholder="Tên, khu vực, hoạt động…"
            className="w-full rounded-xl border border-outline/40 bg-white px-4 py-2"
          />
        </label>
        <label>
          <span className="sr-only">Ngân sách hai người</span>
          <select
            value={budget ?? ''}
            onChange={(e) => update('budget', e.target.value)}
            className="w-full rounded-xl border border-outline/40 bg-white px-4 py-2"
          >
            <option value="">Mọi ngân sách</option>
            {BUDGETS.map((b) => (
              <option key={b.value} value={b.value}>
                {b.label}
              </option>
            ))}
          </select>
        </label>
      </form>

      {error && (
        <p role="alert" className="mt-6 text-error">
          {error}
        </p>
      )}
      {!error && !data && <p className="mt-6 text-on-surface-variant">Đang tải…</p>}
      {data && (
        <>
          <p className="mt-6 text-sm text-on-surface-variant">{data.page.totalElements} địa điểm</p>
          {data.items.length === 0 ? (
            <p className="mt-4">Không có kết quả phù hợp. Thử bỏ bớt bộ lọc.</p>
          ) : (
            <ul className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.items.map((p) => (
                <li key={p.id} className="rounded-2xl bg-white p-4 shadow-sm">
                  <Link to={`/places/${p.id}`} className="font-semibold text-primary hover:underline">
                    {p.name}
                  </Link>
                  <p className="text-sm text-on-surface-variant">{p.areaName ?? 'Chưa có thông tin'}</p>
                  <p className="mt-2 font-medium">
                    {p.price.status === 'KNOWN' && p.price.standardForTwo != null
                      ? `${vnd.format(p.price.standardForTwo)} / 2 người`
                      : 'Chưa có thông tin giá'}
                  </p>
                  <ul className="mt-2 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <li key={t.id} className="rounded-full bg-secondary-container px-2 py-0.5 text-xs text-tertiary">
                        {t.name}
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  )
}
