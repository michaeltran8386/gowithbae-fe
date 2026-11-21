import { useState } from 'react'
import { Link } from 'react-router'
import type { Schemas } from '../../api/client.ts'
import { useAuditLogs, type AuditQuery } from '../../hooks/admin.ts'
import { PageHeader, Pagination, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { SecondaryButton } from '../../components/ui/Button.tsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { formatDateTime } from '../../lib/format.ts'

/** Tên tiếng Việt cho các hành động hay gặp; hành động khác hiện nguyên mã. */
const ACTION_LABELS: Record<string, string> = {
  USER_CREATED: 'Tạo tài khoản',
  USER_LOCKED: 'Khóa tài khoản',
  USER_UNLOCKED: 'Mở khóa tài khoản',
  USER_ROLES_CHANGED: 'Đổi vai trò',
  USER_SESSIONS_REVOKED: 'Đăng xuất mọi thiết bị',
  MFA_ACTIVATION_ISSUED: 'Cấp link Authenticator',
  MFA_ENROLLED: 'Bật Authenticator',
  ADMIN_BOOTSTRAPPED: 'Tạo quản trị viên đầu tiên',
  PLACE_CREATE: 'Tạo địa điểm',
  PLACE_UPDATE: 'Sửa địa điểm',
  PLACE_SUBMIT: 'Gửi duyệt địa điểm',
  PLACE_APPROVE: 'Duyệt địa điểm',
  PLACE_RETURN: 'Trả lại địa điểm',
  PLACE_HIDE: 'Ẩn địa điểm',
  PLACE_DEACTIVATE: 'Ngừng địa điểm',
  PLACE_RESTORE: 'Khôi phục địa điểm',
  PLACE_IMAGE_ADD: 'Thêm ảnh',
  PLACE_IMAGE_REMOVE: 'Xóa ảnh',
  TAXONOMY_CREATE: 'Tạo nhãn',
  TAXONOMY_UPDATE: 'Sửa nhãn',
  AREA_CREATE: 'Tạo khu vực',
  AREA_UPDATE: 'Sửa khu vực',
  COLLECTION_CREATE: 'Tạo bộ sưu tập',
  COLLECTION_UPDATE: 'Sửa bộ sưu tập',
  COLLECTION_DELETE: 'Xóa bộ sưu tập',
  IMPORT_COMMIT: 'Nhập CSV',
  SITE_CONTENT_UPDATED: 'Sửa nội dung trang',
  ADMIN_NOTIFICATION_SENT: 'Gửi thông báo',
  PLACE_REPORT_TRANSITION: 'Xử lý báo sai',
}

const OBJECT_TYPES = ['app_user', 'place', 'taxonomy', 'area', 'collection', 'import_batch', 'site_content', 'notification', 'PLACE_REPORT', 'SUPPORT_TICKET']

function objectLink(type: string, id?: string) {
  if (!id) return null
  if (type === 'app_user') return `/admin/users/${id}`
  if (type === 'place') return `/admin/places/${id}`
  if (type === 'collection') return `/admin/collections/${id}`
  return null
}

export function AuditTable({ items }: { items: Schemas['AuditLog'][] }) {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <Table
      head={
        <tr>
          <th className={th}>Thời điểm</th>
          <th className={th}>Hành động</th>
          <th className={th}>Đối tượng</th>
          <th className={th}>Người thực hiện</th>
          <th className={th}>Lý do</th>
        </tr>
      }
      empty={items.length === 0 ? <EmptyState title="Chưa có nhật ký" /> : undefined}
    >
      {items.map((l) => {
        const link = objectLink(l.objectType, l.objectId)
        const hasDiff = l.before != null || l.after != null
        return (
          <tr key={l.id} className="align-top">
            <td className={`${td} whitespace-nowrap text-[13px] tabular`}>{formatDateTime(l.createdAt)}</td>
            <td className={td}>
              <span className="font-medium">{ACTION_LABELS[l.action] ?? l.action}</span>
              {hasDiff && (
                <button type="button" className="ml-2 text-[12px] text-action underline" onClick={() => setOpen(open === l.id ? null : l.id)} aria-expanded={open === l.id}>
                  {open === l.id ? 'Ẩn chi tiết' : 'Chi tiết'}
                </button>
              )}
              {open === l.id && (
                <div className="mt-2 grid gap-2 text-[12px] md:grid-cols-2">
                  <pre className="overflow-x-auto rounded-control bg-page p-2">Trước: {JSON.stringify(l.before, null, 2) ?? '—'}</pre>
                  <pre className="overflow-x-auto rounded-control bg-page p-2">Sau: {JSON.stringify(l.after, null, 2) ?? '—'}</pre>
                </div>
              )}
            </td>
            <td className={`${td} text-[13px]`}>
              <span className="text-ink-muted">{l.objectType}</span>
              {l.objectId &&
                (link ? (
                  <Link to={link} className="ml-1 font-mono text-action hover:underline">
                    {l.objectId.slice(0, 8)}
                  </Link>
                ) : (
                  <span className="ml-1 font-mono">{l.objectId.slice(0, 8)}</span>
                ))}
            </td>
            <td className={`${td} text-[13px]`}>
              {l.actorId ? (
                <Link to={`/admin/users/${l.actorId}`} className="font-mono text-action hover:underline">
                  {l.actorId.slice(0, 8)}
                </Link>
              ) : (
                <span className="text-ink-muted">Hệ thống</span>
              )}
            </td>
            <td className={`${td} text-[13px] text-ink-muted`}>{l.reason ?? '—'}</td>
          </tr>
        )
      })}
    </Table>
  )
}

/** Nhật ký thao tác quản trị (FR-31): chỉ đọc. */
export function AdminAuditPage() {
  const [filters, setFilters] = useState<AuditQuery>({ page: 0, size: 30 })
  const [draft, setDraft] = useState({ objectType: '', actorId: '', from: '', to: '' })
  const logs = useAuditLogs(filters)

  return (
    <>
      <PageHeader title="Nhật ký" description="Mọi thao tác quản trị được ghi lại, không sửa hay xóa được." />
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          setFilters({
            page: 0,
            size: 30,
            objectType: draft.objectType || undefined,
            actorId: draft.actorId.trim() || undefined,
            from: draft.from || undefined,
            to: draft.to || undefined,
          })
        }}
      >
        <Field.Root>
          <Field.Label>Loại đối tượng</Field.Label>
          <Field.Select value={draft.objectType} onChange={(e) => setDraft({ ...draft, objectType: e.target.value })}>
            <option value="">Tất cả</option>
            {OBJECT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Field.Select>
        </Field.Root>
        <Field.Root>
          <Field.Label>Id người thực hiện</Field.Label>
          <Field.Input value={draft.actorId} onChange={(e) => setDraft({ ...draft, actorId: e.target.value })} placeholder="UUID" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Từ ngày</Field.Label>
          <Field.Input type="date" value={draft.from} onChange={(e) => setDraft({ ...draft, from: e.target.value })} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Đến ngày</Field.Label>
          <Field.Input type="date" value={draft.to} onChange={(e) => setDraft({ ...draft, to: e.target.value })} />
        </Field.Root>
        <SecondaryButton type="submit">Lọc</SecondaryButton>
      </form>
      {logs.isPending ? (
        <LoadingState />
      ) : logs.isError ? (
        <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
      ) : (
        <>
          <AuditTable items={logs.data.items} />
          <Pagination page={logs.data.page} onChange={(p) => setFilters({ ...filters, page: p })} />
        </>
      )}
    </>
  )
}
