import { useState } from 'react'
import { Link } from 'react-router'
import { Download } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { problemMessage } from '../../api/problem.ts'
import {
  downloadReportCsv,
  useNewPlaceReports,
  useNewTickets,
  usePendingPlaces,
  useReportSummary,
} from '../../hooks/admin.ts'
import { PageHeader, Panel, StatCard } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { SecondaryButton } from '../../components/ui/Button.tsx'
import { ErrorState, Skeleton } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime, formatRelative } from '../../lib/format.ts'

const PERIODS = [
  { days: 7, label: '7 ngày qua' },
  { days: 30, label: '30 ngày qua' },
  { days: 90, label: '90 ngày qua' },
] as const

/** Ngày theo giờ Việt Nam dạng YYYY-MM-DD. */
function vnDate(offsetDays: number) {
  const d = new Date(Date.now() + offsetDays * 86_400_000)
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(d)
}

function metric(m: Schemas['MetricValue'] | undefined, kind: 'count' | 'rate' | 'minutes' = 'count') {
  if (!m || m.value == null) return { value: '—', hint: m?.note ?? 'Chưa có dữ liệu' }
  const v = m.value
  if (kind === 'rate') return { value: `${(v * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`, hint: m.note }
  if (kind === 'minutes') return { value: `${v.toLocaleString('vi-VN', { maximumFractionDigits: 0 })} phút`, hint: m.note }
  return { value: v.toLocaleString('vi-VN'), hint: m.note }
}

/** Bảng điều khiển: số liệu theo kỳ (FR-33), xuất CSV (FR-34) và việc cần xử lý. */
export function AdminDashboardPage() {
  const [days, setDays] = useState<number>(30)
  const query = { from: vnDate(-(days - 1)), to: vnDate(0) }
  const summary = useReportSummary(query)
  const toast = useToast()
  const [exporting, setExporting] = useState(false)

  const s = summary.data
  const cards: { label: string; m: ReturnType<typeof metric> }[] = s
    ? [
        { label: 'Thành viên hoạt động', m: metric(s.activeMembers) },
        { label: 'Khách chưa đăng nhập', m: metric(s.activeAnonymous) },
        { label: 'Lượt tìm kiếm', m: metric(s.searches) },
        { label: 'Tìm không có kết quả', m: metric(s.zeroResultRate, 'rate') },
        { label: 'Lượt xem địa điểm', m: metric(s.placeViews) },
        { label: 'Lượt lưu', m: metric(s.saves) },
        { label: 'Từ tìm kiếm → lên kế hoạch', m: metric(s.searchToPlanRate, 'rate') },
        { label: 'Thời gian tới khi lên kế hoạch', m: metric(s.medianMinutesToPlan, 'minutes') },
        { label: 'Giữ chân 30 ngày', m: metric(s.retention30d, 'rate') },
        { label: 'Địa điểm thiếu giá', m: metric(s.placesMissingPrice) },
        { label: 'Địa điểm thiếu giờ', m: metric(s.placesMissingHours) },
        { label: 'Báo sai đang mở', m: metric(s.openPlaceReports) },
      ]
    : []

  return (
    <>
      <PageHeader
        title="Bảng điều khiển"
        description={s ? `Dữ liệu cập nhật ${formatDateTime(s.dataUpdatedAt)}` : 'Số liệu hoạt động của GoWithBae'}
        actions={
          <div className="flex items-end gap-2">
            <Field.Root>
              <Field.Label>Kỳ</Field.Label>
              <Field.Select value={days} onChange={(e) => setDays(Number(e.target.value))}>
                {PERIODS.map((p) => (
                  <option key={p.days} value={p.days}>
                    {p.label}
                  </option>
                ))}
              </Field.Select>
            </Field.Root>
            <SecondaryButton
              icon={<Download size={16} aria-hidden="true" />}
              pending={exporting}
              onClick={async () => {
                setExporting(true)
                try {
                  await downloadReportCsv(query)
                } catch (e) {
                  toast.show(problemMessage(e), { tone: 'error' })
                } finally {
                  setExporting(false)
                }
              }}
            >
              Xuất CSV
            </SecondaryButton>
          </div>
        }
      />

      {summary.isError ? (
        <ErrorState error={summary.error} onRetry={() => summary.refetch()} />
      ) : (
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
          {summary.isPending
            ? Array.from({ length: 8 }, (_, i) => <Skeleton key={i} className="h-24" />)
            : cards.map((c) => <StatCard key={c.label} label={c.label} value={c.m.value} hint={c.m.hint} />)}
        </div>
      )}

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <PendingPlaces />
        <NewReports />
        <NewTickets />
      </div>
    </>
  )
}

function PreviewList({ title, to, isPending, isError, empty, children }: { title: string; to: string; isPending: boolean; isError: boolean; empty: boolean; children: React.ReactNode }) {
  return (
    <Panel
      title={title}
      actions={
        <Link to={to} className="text-sm text-action hover:underline">
          Xem tất cả
        </Link>
      }
    >
      {isPending ? (
        <Skeleton className="h-20" />
      ) : isError ? (
        <p className="text-sm text-ink-muted">Không tải được.</p>
      ) : empty ? (
        <p className="text-sm text-ink-muted">Không có mục nào cần xử lý.</p>
      ) : (
        <ul className="divide-y divide-line text-sm">{children}</ul>
      )}
    </Panel>
  )
}

function PendingPlaces() {
  const q = usePendingPlaces()
  return (
    <PreviewList title="Địa điểm chờ duyệt" to="/admin/places?status=PENDING" isPending={q.isPending} isError={q.isError} empty={!q.data?.items.length}>
      {q.data?.items.map((p) => (
        <li key={p.id} className="py-2">
          <Link to={`/admin/places/${p.id}`} className="font-medium hover:underline">
            {p.name}
          </Link>
          <span className="block text-[12px] text-ink-muted">{p.area?.name ?? 'Chưa có khu vực'}</span>
        </li>
      ))}
    </PreviewList>
  )
}

function NewReports() {
  const q = useNewPlaceReports()
  return (
    <PreviewList title="Báo sai mới" to="/admin/place-reports" isPending={q.isPending} isError={q.isError} empty={!q.data?.items.length}>
      {q.data?.items.map((r) => (
        <li key={r.id} className="py-2">
          <Link to={`/admin/place-reports/${r.id}`} className="font-medium hover:underline">
            {r.placeName}
          </Link>
          <span className="block text-[12px] text-ink-muted">{formatRelative(r.createdAt)}</span>
        </li>
      ))}
    </PreviewList>
  )
}

function NewTickets() {
  const q = useNewTickets()
  return (
    <PreviewList title="Yêu cầu hỗ trợ mới" to="/admin/tickets" isPending={q.isPending} isError={q.isError} empty={!q.data?.items.length}>
      {q.data?.items.map((t) => (
        <li key={t.id} className="py-2">
          <Link to={`/admin/tickets/${t.id}`} className="font-medium hover:underline">
            {t.subject}
          </Link>
          <span className="block text-[12px] text-ink-muted">{formatRelative(t.createdAt)}</span>
        </li>
      ))}
    </PreviewList>
  )
}
