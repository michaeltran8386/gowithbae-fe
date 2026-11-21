import type { ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'

/** Mảnh giao diện dùng chung cho các màn quản trị (desktop là chính, vẫn dùng được trên mobile). */

export function PageHeader({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-2xl font-bold">{title}</h1>
        {description && <p className="mt-1 text-ink-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  )
}

export function Panel({ title, actions, children, className = '' }: { title?: string; actions?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-block border border-line bg-white ${className}`}>
      {(title || actions) && (
        <div className="flex items-center justify-between gap-2 border-b border-line px-4 py-3">
          {title && <h2 className="font-semibold">{title}</h2>}
          {actions}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: ReactNode }) {
  return (
    <div className="rounded-block border border-line bg-white p-4">
      <p className="text-[13px] text-ink-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular">{value}</p>
      {hint && <p className="mt-1 text-[12px] text-ink-muted">{hint}</p>}
    </div>
  )
}

/** Bảng cuộn ngang trên màn hẹp. */
export function Table({ head, children, empty }: { head: ReactNode; children: ReactNode; empty?: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-block border border-line bg-white">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-line bg-page text-[13px] text-ink-muted">{head}</thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
      {empty}
    </div>
  )
}

export const th = 'px-4 py-2.5 font-semibold'
export const td = 'px-4 py-3 align-top'

export function Pagination({ page, onChange }: { page: Schemas['PageMeta'] | undefined; onChange: (page: number) => void }) {
  if (!page || page.totalPages <= 1) return null
  return (
    <nav className="mt-3 flex items-center justify-end gap-2 text-sm" aria-label="Phân trang">
      <span className="text-ink-muted tabular">
        Trang {page.page + 1}/{page.totalPages} · {page.totalElements} mục
      </span>
      <button
        type="button"
        className="rounded-control border border-line p-2 disabled:opacity-40"
        disabled={page.page === 0}
        onClick={() => onChange(page.page - 1)}
        aria-label="Trang trước"
      >
        <ChevronLeft size={16} aria-hidden="true" />
      </button>
      <button
        type="button"
        className="rounded-control border border-line p-2 disabled:opacity-40"
        disabled={page.page + 1 >= page.totalPages}
        onClick={() => onChange(page.page + 1)}
        aria-label="Trang sau"
      >
        <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  )
}

/** Nút sao chép (link kích hoạt…), báo kết quả cho trình đọc màn hình. */
export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}
