import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Plus, Search } from 'lucide-react'
import { PLACE_STATUS_LABELS, useAdminPlaces, useAreas, type PlaceStatus } from '../../hooks/adminCatalog.ts'
import { PageHeader, Pagination, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { ButtonLink, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { priceForTwo, formatDateTime } from '../../lib/format.ts'

export function PlaceStatusBadge({ status }: { status: PlaceStatus }) {
  const tone = status === 'PUBLISHED' ? 'success' : status === 'PENDING' ? 'action' : status === 'DRAFT' ? 'neutral' : 'muted'
  return <Badge tone={tone}>{PLACE_STATUS_LABELS[status]}</Badge>
}

/** Danh sách địa điểm mọi trạng thái (FR-23): lọc trạng thái/khu vực/từ khóa, mở để sửa hoặc duyệt. */
export function AdminPlacesPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as PlaceStatus | null) ?? undefined
  const areaId = params.get('areaId') ?? undefined
  const q = params.get('q') ?? ''
  const page = Number(params.get('page') ?? 0)
  const places = useAdminPlaces({ status, areaId, q, page })
  const areas = useAreas()
  const [draft, setDraft] = useState(q)

  const update = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    if (!('page' in next)) p.delete('page')
    setParams(p, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Địa điểm"
        description="Tạo nháp, gửi duyệt, duyệt để hiển thị trên web, tạm ẩn hoặc ngừng hoạt động."
        actions={
          <>
            <ButtonLink to="/admin/imports" variant="secondary">
              Nhập CSV
            </ButtonLink>
            <ButtonLink to="/admin/places/new" icon={<Plus size={16} aria-hidden="true" />}>
              Thêm địa điểm
            </ButtonLink>
          </>
        }
      />
      <div className="mb-3 flex flex-wrap gap-2" role="group" aria-label="Lọc trạng thái">
        {([undefined, 'PENDING', 'DRAFT', 'PUBLISHED', 'HIDDEN', 'INACTIVE'] as (PlaceStatus | undefined)[]).map((s) => (
          <button
            key={s ?? 'all'}
            type="button"
            aria-pressed={status === s}
            onClick={() => update({ status: s })}
            className={`rounded-full border px-3 py-1 text-sm ${status === s ? 'border-action bg-action-soft font-semibold text-action' : 'border-line bg-white text-ink-muted hover:text-ink'}`}
          >
            {s ? PLACE_STATUS_LABELS[s] : 'Tất cả'}
          </button>
        ))}
      </div>
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          update({ q: draft.trim() || undefined })
        }}
      >
        <Field.Root className="min-w-60 flex-1">
          <Field.Label>Tên hoặc mã chi nhánh</Field.Label>
          <Field.Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="vd. ca phe meo hoặc DEMO-001" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Khu vực</Field.Label>
          <Field.Select value={areaId ?? ''} onChange={(e) => update({ areaId: e.target.value || undefined })}>
            <option value="">Tất cả</option>
            {areas.data?.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </Field.Select>
        </Field.Root>
        <SecondaryButton type="submit" icon={<Search size={16} aria-hidden="true" />}>
          Tìm
        </SecondaryButton>
      </form>

      {places.isPending ? (
        <LoadingState />
      ) : places.isError ? (
        <ErrorState error={places.error} onRetry={() => places.refetch()} />
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Địa điểm</th>
                <th className={th}>Khu vực</th>
                <th className={th}>Giá 2 người</th>
                <th className={th}>Trạng thái</th>
                <th className={th}>Cập nhật</th>
              </tr>
            }
            empty={places.data.items.length === 0 ? <EmptyState title="Không có địa điểm phù hợp" /> : undefined}
          >
            {places.data.items.map((p) => (
              <tr key={p.id} className="hover:bg-page">
                <td className={td}>
                  <Link to={`/admin/places/${p.id}`} className="font-semibold text-action hover:underline">
                    {p.name}
                  </Link>
                  <span className="block font-mono text-[12px] text-ink-muted">{p.code}</span>
                </td>
                <td className={td}>{p.area?.name ?? '—'}</td>
                <td className={`${td} whitespace-nowrap`}>{priceForTwo(p.price) ?? 'Chưa rõ'}</td>
                <td className={td}>
                  <PlaceStatusBadge status={p.status} />
                  {p.publishBlockers && p.publishBlockers.length > 0 && (p.status === 'DRAFT' || p.status === 'PENDING') && (
                    <span className="mt-1 block text-[12px] text-attention">Còn thiếu {p.publishBlockers.length} mục để xuất bản</span>
                  )}
                </td>
                <td className={`${td} whitespace-nowrap text-[13px] text-ink-muted`}>{p.updatedAt ? formatDateTime(p.updatedAt) : '—'}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={places.data.page} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
    </>
  )
}
