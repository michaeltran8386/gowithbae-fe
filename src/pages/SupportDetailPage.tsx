import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { fieldErrors, isStatus, problemMessage } from '../api/problem.ts'
import { useMyTicket, useTicketMutations } from '../hooks/account.ts'
import { formatDateTime } from '../lib/format.ts'
import { Field } from '../components/ui/Field.tsx'
import { ButtonLink, PrimaryButton } from '../components/ui/Button.tsx'
import { Badge, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'
import { TICKET_STATUS } from './SupportListPage.tsx'

/** S-20 Chi tiết hỗ trợ — FR-20, RULE-19: chỉ tin nhắn công khai; ticket người khác → 404 (AC-032). */
export function SupportDetailPage() {
  const { ticketId = '' } = useParams()
  const ticket = useMyTicket(ticketId)
  const { reply } = useTicketMutations()
  const [body, setBody] = useState('')
  const [error, setError] = useState<string>()

  if (ticket.isPending) return <Skeleton className="h-80" />
  if (ticket.isError)
    return isStatus(ticket.error, 404) ? <NotFoundPage title="Không tìm thấy yêu cầu hỗ trợ" /> : <ErrorState error={ticket.error} onRetry={() => ticket.refetch()} />

  const t = ticket.data
  const closed = t.status === 'CLOSED'

  return (
    <div className="mx-auto max-w-2xl">
      <Link to="/account/support" className="inline-flex min-h-11 items-center text-sm text-action hover:underline">
        Hỗ trợ
      </Link>
      <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
        <h1 className="min-w-0 text-2xl font-bold break-words">{t.subject}</h1>
        <Badge tone={TICKET_STATUS[t.status].tone}>{TICKET_STATUS[t.status].label}</Badge>
      </div>
      <p className="mt-1 text-[13px] text-ink-muted">
        Mã yêu cầu <span className="tabular">{t.id.slice(-8).toUpperCase()}</span>
        {t.assigneeName && ` · Phụ trách: ${t.assigneeName}`}
      </p>

      <ol className="mt-5 flex flex-col gap-3" aria-label="Lịch sử trao đổi">
        {t.messages.map((m) => (
          <li key={m.id} className={`max-w-[85%] rounded-block px-4 py-3 ${m.fromStaff ? 'self-start border border-line bg-white' : 'self-end bg-action-soft'}`}>
            <p className="text-[13px] font-semibold">{m.fromStaff ? m.authorName : 'Bạn'}</p>
            <p className="mt-0.5 break-words whitespace-pre-line">{m.body}</p>
            <p className="mt-1 text-xs text-ink-muted tabular">{formatDateTime(m.createdAt)}</p>
          </li>
        ))}
      </ol>

      {closed ? (
        <div className="mt-6 rounded-block border border-line bg-white p-4 text-sm">
          <p>Yêu cầu đã đóng. Nếu cần hỗ trợ thêm, hãy gửi yêu cầu mới.</p>
          <ButtonLink to="/account/support/new" className="mt-3">
            Gửi yêu cầu mới
          </ButtonLink>
        </div>
      ) : (
        <form
          className="mt-6 flex flex-col gap-3 rounded-block border border-line bg-white p-4"
          onSubmit={(e) => {
            e.preventDefault()
            if (!body.trim()) return setError('Hãy nhập nội dung')
            reply.mutate(
              { ticketId: t.id, body: body.trim() },
              { onSuccess: () => setBody(''), onError: (err) => setError(fieldErrors(err).body ?? problemMessage(err)) },
            )
          }}
        >
          <Field.Root error={error}>
            <Field.Label>{t.status === 'WAITING_CUSTOMER' ? 'Bổ sung thông tin' : 'Trả lời'}</Field.Label>
            <Field.Textarea rows={3} maxLength={5000} value={body} onChange={(e) => (setBody(e.target.value), setError(undefined))} />
            <Field.Error />
          </Field.Root>
          <PrimaryButton type="submit" pending={reply.isPending} className="self-end">
            Gửi
          </PrimaryButton>
        </form>
      )}
    </div>
  )
}
