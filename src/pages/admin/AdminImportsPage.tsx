import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CircleAlert, CircleCheck, Download, Upload } from 'lucide-react'
import { fieldErrors, problemMessage } from '../../api/problem.ts'
import { downloadImportTemplate, useImportBatch, useImportMutations } from '../../hooks/adminCatalog.ts'
import { PageHeader, Panel, StatCard, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

/** Nhập địa điểm bằng CSV (FR-30): tải mẫu → tải file kiểm tra thử → xem lỗi từng dòng → ghi thành nháp. */
export function AdminImportsPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const { validate } = useImportMutations()
  const [file, setFile] = useState<File | null>(null)
  const fileProblems = validate.error ? Object.values(fieldErrors(validate.error)) : []

  return (
    <>
      <PageHeader title="Nhập CSV" description="Thêm nhiều địa điểm một lần. Địa điểm được tạo ở trạng thái nháp để bạn bổ sung ảnh, giờ và gửi duyệt." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="1. Tải file mẫu">
          <p className="text-sm text-ink-muted">
            Mở bằng Excel/Google Sheets, mỗi dòng một địa điểm. Lưu lại dạng <b>CSV UTF-8</b>. Nhãn ghi nhiều mã cách nhau bằng dấu chấm phẩy, vd.{' '}
            <code className="rounded bg-page px-1">CAFE;QUIET</code>. Giá để trống cột <code className="rounded bg-page px-1">price_status</code> nếu chưa có.
          </p>
          <SecondaryButton
            className="mt-3"
            icon={<Download size={16} aria-hidden="true" />}
            onClick={() => downloadImportTemplate().catch((e) => toast.show(problemMessage(e), { tone: 'error' }))}
          >
            Tải file mẫu
          </SecondaryButton>
        </Panel>
        <Panel title="2. Tải file lên để kiểm tra">
          <p className="text-sm text-ink-muted">Bước này chỉ kiểm tra, chưa tạo địa điểm. Tối đa 2 MB, 1000 dòng.</p>
          <input type="file" accept=".csv,text/csv" aria-label="File CSV" className="mt-3 block text-sm" onChange={(e) => (setFile(e.target.files?.[0] ?? null), validate.reset())} />
          {validate.error && (
            <div role="alert" className="mt-3 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
              <p className="font-semibold">{problemMessage(validate.error)}</p>
              {fileProblems.length > 0 && (
                <ul className="mt-1 list-disc pl-5">
                  {fileProblems.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              )}
            </div>
          )}
          <PrimaryButton
            className="mt-3"
            icon={<Upload size={16} aria-hidden="true" />}
            disabled={!file}
            pending={validate.isPending}
            onClick={() => validate.mutate(file!, { onSuccess: (batch) => navigate(`/admin/imports/${batch.id}`) })}
          >
            Kiểm tra
          </PrimaryButton>
        </Panel>
      </div>
    </>
  )
}

export function AdminImportBatchPage() {
  const { batchId = '' } = useParams()
  const batch = useImportBatch(batchId)
  const { commit } = useImportMutations()
  const toast = useToast()
  const [onlyErrors, setOnlyErrors] = useState(true)

  if (batch.isPending) return <LoadingState />
  if (batch.isError) return <ErrorState error={batch.error} onRetry={() => batch.refetch()} />
  const b = batch.data
  const rows = (b.rows ?? []).filter((r) => !onlyErrors || !r.valid)

  return (
    <>
      <Link to="/admin/imports" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Nhập CSV
      </Link>
      <PageHeader
        title="Kết quả kiểm tra"
        description={`Tải lên ${formatDateTime(b.createdAt)} · mẫu ${b.templateVersion ?? 'v1'}`}
        actions={
          b.status === 'VALIDATED' && (
            <PrimaryButton
              pending={commit.isPending}
              onClick={() =>
                commit.mutate(b.id, {
                  onSuccess: (r) => toast.show(`Đã tạo ${r.totalRows} địa điểm nháp`),
                  onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
                })
              }
            >
              Ghi {b.totalRows} địa điểm thành nháp
            </PrimaryButton>
          )
        }
      />
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard
          label="Trạng thái"
          value={
            b.status === 'COMMITTED' ? (
              <Badge tone="success">Đã ghi</Badge>
            ) : b.status === 'VALIDATED' ? (
              <Badge tone="action">Hợp lệ, chưa ghi</Badge>
            ) : (
              <Badge tone="attention">Còn lỗi</Badge>
            )
          }
          hint={b.committedAt ? `Ghi lúc ${formatDateTime(b.committedAt)}` : undefined}
        />
        <StatCard label="Tổng số dòng" value={b.totalRows} />
        <StatCard label="Dòng lỗi" value={b.errorRows} />
        <StatCard label="Dòng hợp lệ" value={b.totalRows - b.errorRows} />
      </div>
      {b.status === 'INVALID' && (
        <p className="mb-3 flex items-start gap-2 rounded-control bg-peach-50 px-3 py-2 text-sm text-attention">
          <CircleAlert size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Chỉ ghi được khi cả file hợp lệ. Sửa các dòng lỗi trong file rồi tải lên lại.
        </p>
      )}
      {b.status === 'COMMITTED' && (
        <p className="mb-3 flex items-start gap-2 rounded-control bg-action-soft px-3 py-2 text-sm text-action">
          <CircleCheck size={16} className="mt-0.5 shrink-0" aria-hidden="true" />
          Đã tạo địa điểm nháp. <Link to="/admin/places?status=DRAFT" className="underline">Xem danh sách nháp</Link> để thêm ảnh và gửi duyệt.
        </p>
      )}
      <label className="mb-2 flex items-center gap-2 text-sm">
        <input type="checkbox" checked={onlyErrors} onChange={(e) => setOnlyErrors(e.target.checked)} /> Chỉ hiện dòng lỗi
      </label>
      <Table
        head={
          <tr>
            <th className={th}>Dòng</th>
            <th className={th}>Mã chi nhánh</th>
            <th className={th}>Kết quả</th>
          </tr>
        }
      >
        {rows.map((r) => (
          <tr key={r.rowNumber}>
            <td className={`${td} tabular`}>{r.rowNumber}</td>
            <td className={`${td} font-mono text-[13px]`}>{r.placeCode ?? '—'}</td>
            <td className={td}>
              {r.valid ? (
                <span className="text-success">Hợp lệ</span>
              ) : (
                <ul className="list-disc pl-4 text-danger">
                  {r.errors?.map((e) => (
                    <li key={e}>{e}</li>
                  ))}
                </ul>
              )}
            </td>
          </tr>
        ))}
      </Table>
      {rows.length === 0 && <p className="mt-2 text-sm text-ink-muted">Không có dòng lỗi.</p>}
    </>
  )
}
