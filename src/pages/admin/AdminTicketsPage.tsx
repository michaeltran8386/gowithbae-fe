import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router'
import { ArrowLeft, Lock } from 'lucide-react'
import { problemMessage } from '../../api/problem.ts'
import {
  TICKET_CATEGORY_LABELS,
  TICKET_STATUS_LABELS,
  useAdminTicket,
  useAdminTickets,
  useTicketMutations,
  type TicketStatus,
} from '../../hooks/adminSupport.ts'
import { PageHeader, Pagination, Panel, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { ConfirmDialog } from '../../components/ui/Dialog.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

const TONES: Record<TicketStatus, 'attention' | 'action' | 'neutral' | 'muted'> = {
  NEW: 'attention',
  IN_PROGRESS: 'action',
  WAITING_CUSTOMER: 'neutral',
  CLOSED: 'muted',
}

export const TicketStatusBadge = ({ status }: { status: TicketStatus }) => <Badge tone={TONES[status]}>{TICKET_STATUS_LABELS[status]}</Badge>

const FILTERS: (TicketStatus | undefined)[] = [undefined, 'NEW', 'IN_PROGRESS', 'WAITING_CUSTOMER', 'CLOSED']

/** Yêu cầu hỗ trợ của thành viên (FR-22). */
export function AdminTicketsPage() {
  const [params, setParams] = useSearchParams()
  const status = (params.get('status') as TicketStatus | null) ?? undefined
  const page = Number(params.get('page') ?? 0)
  const tickets = useAdminTickets({ status, page })
  const update = (next: { status?: TicketStatus; page?: number }) => {
    const p = new URLSearchParams()
    if (next.status) p.set('status', next.status)
    if (next.page) p.set('page', String(next.page))
    setParams(p)
  }

  return (
    <>
      <PageHeader title="Yêu cầu hỗ trợ" description="Trả lời công khai thì thành viên nhận thông báo. Ghi chú nội bộ không bao giờ hiện cho thành viên." />
      <div className="mb-4 flex flex-wrap gap-1.5" role="group" aria-label="Lọc trạng thái">
        {FILTERS.map((s) => (
          <button
            key={s ?? 'all'}
            type="button"
            aria-pressed={status === s}
            className={`rounded-full border px-3 py-1 text-sm ${status === s ? 'border-action bg-action-soft font-semibold text-action' : 'border-line bg-white text-ink-muted hover:text-ink'}`}
            onClick={() => update({ status: s })}
          >
            {s ? TICKET_STATUS_LABELS[s] : 'Tất cả'}
          </button>
        ))}
      </div>
      {tickets.isPending ? (
        <LoadingState />
      ) : tickets.isError ? (
        <ErrorState error={tickets.error} onRetry={() => tickets.refetch()} />
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Tiêu đề</th>
                <th className={th}>Chủ đề</th>
                <th className={th}>Trạng thái</th>
                <th className={th}>Cập nhật</th>
              </tr>
            }
            empty={tickets.data.items.length === 0 ? <EmptyState title="Không có yêu cầu hỗ trợ" /> : undefined}
          >
            {tickets.data.items.map((t) => (
              <tr key={t.id} className="hover:bg-page">
                <td className={td}>
                  <Link to={`/admin/tickets/${t.id}`} className="font-semibold text-action hover:underline">
                    {t.subject}
                  </Link>
                </td>
                <td className={td}>{TICKET_CATEGORY_LABELS[t.category] ?? t.category}</td>
                <td className={td}>
                  <TicketStatusBadge status={t.status} />
                </td>
                <td className={`${td} whitespace-nowrap`}>{formatDateTime(t.updatedAt)}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={tickets.data.page} onChange={(p) => update({ status, page: p })} />
        </>
      )}
    </>
  )
}

export function AdminTicketDetailPage() {
  const { ticketId = '' } = useParams()
  const ticket = useAdminTicket(ticketId)
  const m = useTicketMutations(ticketId)
  const toast = useToast()
  const [body, setBody] = useState('')
  const [internal, setInternal] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)

  if (ticket.isPending) return <LoadingState />
  if (ticket.isError) return <ErrorState error={ticket.error} onRetry={() => ticket.refetch()} />
  const t = ticket.data
  const closed = t.status === 'CLOSED'

  const reply = () =>
    m.reply.mutate(
      { body: body.trim(), visibility: internal ? 'INTERNAL' : 'PUBLIC' },
      { onSuccess: () => (setBody(''), toast.show(internal ? 'Đã thêm ghi chú nội bộ' : 'Đã gửi trả lời')) },
    )
  const move = (status: TicketStatus) =>
    m.transition.mutate(status, {
      onSuccess: () => (setConfirmClose(false), toast.show(`Đã chuyển sang “${TICKET_STATUS_LABELS[status]}”`)),
      onError: (e) => (setConfirmClose(false), toast.show(problemMessage(e), { tone: 'error' })),
    })

  return (
    <>
      <Link to="/admin/tickets" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Yêu cầu hỗ trợ
      </Link>
      <PageHeader
        title={t.subject}
        description={
          <span className="flex flex-wrap items-center gap-2">
            <TicketStatusBadge status={t.status} /> {TICKET_CATEGORY_LABELS[t.category] ?? t.category} · Tạo {formatDateTime(t.createdAt)}
          </span>
        }
      />
      <div className="grid gap-4 lg:grid-cols-[1fr_300px]">
        <div className="flex flex-col gap-4">
          <Panel title="Hội thoại">
            <ol className="flex flex-col gap-3">
              {t.messages.map((msg) => (
                <li
                  key={msg.id}
                  className={`rounded-control border px-3 py-2 text-sm ${msg.visibility === 'INTERNAL' ? 'border-dashed border-attention bg-peach-50' : msg.fromStaff ? 'border-action/30 bg-action-soft' : 'border-line bg-white'}`}
                >
                  <p className="mb-1 flex flex-wrap items-center gap-2 text-[12px] text-ink-muted">
                    <b className="text-ink">{msg.authorName}</b>
                    {msg.fromStaff && <span>Hỗ trợ</span>}
                    {msg.visibility === 'INTERNAL' && (
                      <span className="inline-flex items-center gap-1 font-semibold text-attention">
                        <Lock size={12} aria-hidden="true" /> Ghi chú nội bộ
                      </span>
                    )}
                    <span>{formatDateTime(msg.createdAt)}</span>
                  </p>
                  <p className="whitespace-pre-wrap">{msg.body}</p>
                  {msg.attachments && msg.attachments.length > 0 && <p className="mt-1 text-[12px] text-ink-muted">{msg.attachments.length} tệp đính kèm</p>}
                </li>
              ))}
            </ol>
          </Panel>
          {closed ? (
            <p className="text-sm text-ink-muted">Yêu cầu đã đóng, không trả lời thêm được.</p>
          ) : (
            <Panel title={internal ? 'Ghi chú nội bộ' : 'Trả lời thành viên'}>
              <div className="flex flex-col gap-3">
                <div className="flex gap-1.5" role="group" aria-label="Loại tin nhắn">
                  <button type="button" aria-pressed={!internal} className={`rounded-full border px-3 py-1 text-sm ${!internal ? 'border-action bg-action-soft font-semibold text-action' : 'border-line'}`} onClick={() => setInternal(false)}>
                    Trả lời công khai
                  </button>
                  <button type="button" aria-pressed={internal} className={`rounded-full border px-3 py-1 text-sm ${internal ? 'border-attention bg-peach-50 font-semibold text-attention' : 'border-line'}`} onClick={() => setInternal(true)}>
                    Ghi chú nội bộ
                  </button>
                </div>
                <Field.Root hint>
                  <Field.Label>Nội dung</Field.Label>
                  <Field.Hint>{internal ? 'Chỉ quản trị viên thấy.' : 'Thành viên thấy và nhận thông báo.'}</Field.Hint>
                  <Field.Textarea rows={4} maxLength={5000} value={body} onChange={(e) => setBody(e.target.value)} />
                </Field.Root>
                {m.reply.error && <p role="alert" className="text-sm text-danger">{problemMessage(m.reply.error)}</p>}
                <PrimaryButton className="self-start" pending={m.reply.isPending} disabled={!body.trim()} onClick={reply}>
                  {internal ? 'Lưu ghi chú' : 'Gửi trả lời'}
                </PrimaryButton>
              </div>
            </Panel>
          )}
        </div>
        <Panel title="Trạng thái">
          {closed ? (
            <p className="text-sm text-ink-muted">Đã đóng. Thành viên cần tạo yêu cầu mới nếu còn vướng.</p>
          ) : (
            <div className="flex flex-col gap-2">
              {(['IN_PROGRESS', 'WAITING_CUSTOMER'] as const)
                .filter((s) => s !== t.status)
                .map((s) => (
                  <SecondaryButton key={s} pending={m.transition.isPending && m.transition.variables === s} onClick={() => move(s)}>
                    Chuyển sang “{TICKET_STATUS_LABELS[s]}”
                  </SecondaryButton>
                ))}
              <SecondaryButton onClick={() => setConfirmClose(true)}>Đóng yêu cầu</SecondaryButton>
            </div>
          )}
        </Panel>
      </div>
      <ConfirmDialog
        open={confirmClose}
        onClose={() => setConfirmClose(false)}
        onConfirm={() => move('CLOSED')}
        pending={m.transition.isPending}
        title="Đóng yêu cầu hỗ trợ?"
        description="Đã đóng thì không mở lại và không trả lời thêm được."
        confirmLabel="Đóng yêu cầu"
      />
    </>
  )
}
