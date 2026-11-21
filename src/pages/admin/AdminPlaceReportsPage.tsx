import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, ExternalLink } from 'lucide-react'
import { adminProblemMessage } from '../../api/problem.ts'
import {
  REPORT_NEXT,
  REPORT_REASON_LABELS,
  REPORT_STATUS_LABELS,
  useAdminPlaceReport,
  useAdminPlaceReports,
  useTransitionPlaceReport,
  type ReportStatus,
} from '../../hooks/adminSupport.ts'
import { PageHeader, Pagination, Panel, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

const TONES: Record<ReportStatus, 'attention' | 'action' | 'success' | 'muted'> = {
  NEW: 'attention',
  CHECKING: 'action',
  RESOLVED: 'success',
  INSUFFICIENT: 'muted',
}

export const ReportStatusBadge = ({ status }: { status: ReportStatus }) => <Badge tone={TONES[status]}>{REPORT_STATUS_LABELS[status]}</Badge>

const FILTERS: (ReportStatus | undefined)[] = [undefined, 'NEW', 'CHECKING', 'RESOLVED', 'INSUFFICIENT']

/** Báo sai thông tin địa điểm do người dùng gửi (FR-21). */
export function AdminPlaceReportsPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as ReportStatus | null) ?? undefined
  const page = Number(params.get('page') ?? 0)
  const reports = useAdminPlaceReports({ status, page })
  const update = (next: { status?: ReportStatus; page?: number }) => {
    const p = new URLSearchParams()
    if (next.status) p.set('status', next.status)
    if (next.page) p.set('page', String(next.page))
    setParams(p)
  }

  return (
    <>
      <PageHeader title="Báo sai" description="Người dùng báo giá, giờ, địa chỉ hoặc ảnh không đúng. Sửa địa điểm rồi đóng báo sai kèm ghi chú." />
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Lọc trạng thái">
        {FILTERS.map((s) => (
          <button
            key={s ?? 'all'}
            type="button"
            aria-pressed={status === s}
            className={`rounded-full border px-3 py-1 text-sm ${status === s ? 'border-action bg-action-soft font-semibold text-action' : 'border-line bg-white text-ink-muted hover:text-ink'}`}
            onClick={() => update({ status: s })}
          >
            {s ? REPORT_STATUS_LABELS[s] : 'Tất cả'}
          </button>
        ))}
      </div>
      {reports.isPending ? (
        <LoadingState />
      ) : reports.isError ? (
        <ErrorState error={reports.error} onRetry={() => reports.refetch()} />
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Địa điểm</th>
                <th className={th}>Lý do</th>
                <th className={th}>Trạng thái</th>
                <th className={th}>Gửi lúc</th>
              </tr>
            }
            empty={reports.data.items.length === 0 ? <EmptyState title="Không có báo sai" /> : undefined}
          >
            {reports.data.items.map((r) => (
              <tr key={r.id} className="hover:bg-page">
                <td className={td}>
                  <Link to={`/admin/place-reports/${r.id}`} className="font-semibold text-action hover:underline">
                    {r.placeName}
                  </Link>
                </td>
                <td className={td}>{REPORT_REASON_LABELS[r.reason]}</td>
                <td className={td}>
                  <ReportStatusBadge status={r.status} />
                </td>
                <td className={`${td} whitespace-nowrap`}>{formatDateTime(r.createdAt)}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={reports.data.page} onChange={(p) => update({ status, page: p })} />
        </>
      )}
    </>
  )
}

export function AdminPlaceReportDetailPage() {
  const { reportId = '' } = useParams()
  const report = useAdminPlaceReport(reportId)
  const transition = useTransitionPlaceReport()
  const toast = useToast()
  const [target, setTarget] = useState<ReportStatus | ''>('')
  const [note, setNote] = useState('')

  if (report.isPending) return <LoadingState />
  if (report.isError) return <ErrorState error={report.error} onRetry={() => report.refetch()} />
  const r = report.data
  const options = REPORT_NEXT[r.status]
  const needsNote = target === 'RESOLVED' || target === 'INSUFFICIENT'

  const submit = () =>
    transition.mutate(
      { id: r.id, status: target as ReportStatus, note: note.trim() || undefined },
      {
        onSuccess: (u) => {
          toast.show(`Đã chuyển sang “${REPORT_STATUS_LABELS[u.status]}”`)
          setTarget('')
          setNote('')
        },
      },
    )

  return (
    <>
      <Link to="/admin/place-reports" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Báo sai
      </Link>
      <PageHeader
        title={`${REPORT_REASON_LABELS[r.reason]} · ${r.placeName}`}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ReportStatusBadge status={r.status} /> Gửi {formatDateTime(r.createdAt)}
          </span>
        }
        actions={
          <Link to={`/admin/places/${r.placeId}`} className="inline-flex items-center gap-1 text-sm font-semibold text-action hover:underline">
            Mở địa điểm để sửa <ExternalLink size={14} aria-hidden="true" />
          </Link>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Panel title="Nội dung báo sai">
          <dl className="grid gap-3 text-sm">
            <div>
              <dt className="text-ink-muted">Lý do</dt>
              <dd>{REPORT_REASON_LABELS[r.reason]}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Mô tả của người gửi</dt>
              <dd className="whitespace-pre-wrap">{r.description || <span className="text-ink-muted">Không có mô tả</span>}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Người gửi</dt>
              <dd>
                {r.senderUserId ? (
                  <Link to={`/admin/users/${r.senderUserId}`} className="text-action hover:underline">
                    Xem tài khoản
                  </Link>
                ) : (
                  'Khách chưa đăng nhập'
                )}
              </dd>
            </div>
            {r.attachment && (
              <div>
                <dt className="text-ink-muted">Tệp đính kèm</dt>
                <dd>{r.attachment.url ? <a href={r.attachment.url} target="_blank" rel="noreferrer" className="text-action underline">Mở tệp</a> : `${r.attachment.contentType}, ${Math.ceil(r.attachment.sizeBytes / 1024)} KB`}</dd>
              </div>
            )}
            {r.resolutionNote && (
              <div>
                <dt className="text-ink-muted">Ghi chú xử lý</dt>
                <dd className="whitespace-pre-wrap">{r.resolutionNote}</dd>
              </div>
            )}
          </dl>
        </Panel>
        <Panel title="Xử lý">
          <div className="flex flex-col gap-3">
            <Field.Root>
              <Field.Label>Chuyển sang</Field.Label>
              <Field.Select value={target} onChange={(e) => setTarget(e.target.value as ReportStatus | '')}>
                <option value="">Chọn trạng thái</option>
                {options.map((s) => (
                  <option key={s} value={s}>
                    {REPORT_STATUS_LABELS[s]}
                  </option>
                ))}
              </Field.Select>
            </Field.Root>
            <Field.Root hint>
              <Field.Label optional={!needsNote}>Ghi chú xử lý</Field.Label>
              <Field.Hint>{needsNote ? 'Bắt buộc khi đóng: đã sửa gì, hoặc vì sao không đủ căn cứ.' : 'Chỉ quản trị viên thấy.'}</Field.Hint>
              <Field.Textarea rows={4} maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} />
            </Field.Root>
            {transition.error && <p role="alert" className="text-sm text-danger">{adminProblemMessage(transition.error)}</p>}
            <div className="flex gap-2">
              <PrimaryButton pending={transition.isPending} disabled={!target || (needsNote && !note.trim())} onClick={submit}>
                Cập nhật
              </PrimaryButton>
              {(target || note) && (
                <SecondaryButton onClick={() => (setTarget(''), setNote(''))}>Hủy</SecondaryButton>
              )}
            </div>
          </div>
        </Panel>
      </div>
    </>
  )
}
