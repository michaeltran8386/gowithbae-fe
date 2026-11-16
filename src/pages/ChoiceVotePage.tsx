import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { Lock } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { isStatus, problemMessage } from '../api/problem.ts'
import { useCastVote, useChoiceSession, useSharingMutations } from '../hooks/choice.ts'
import { formatDateTime } from '../lib/format.ts'
import { VoteCard } from '../components/choice/VoteCard.tsx'
import { ShareLinkPanel } from '../components/choice/ShareLinkPanel.tsx'
import { ConfirmDialog } from '../components/ui/Dialog.tsx'
import { ButtonLink, DangerButton, SecondaryButton } from '../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'

/** Tên trạng thái là DER/PROP (SRS §7.3), chờ PO duyệt câu chữ cuối. */
const STATUS: Record<Schemas['ChoiceSessionStatus'], { label: string; tone: 'attention' | 'action' | 'muted' }> = {
  WAITING: { label: 'Chờ người ấy tham gia', tone: 'attention' },
  VOTING: { label: 'Đang chọn', tone: 'action' },
  FINALIZED: { label: 'Đã chốt', tone: 'muted' },
}

/** S-11 Bỏ phiếu cùng chọn — FR-12, quản lý chia sẻ FR-14. Chủ tạo (tài khoản) hoặc người nhận (phiên khách). */
export function ChoiceVotePage() {
  const { sessionId = '' } = useParams()
  const session = useChoiceSession(sessionId)

  if (session.isPending) return <Skeleton className="h-96" />
  if (session.isError)
    return isStatus(session.error, 404, 410, 401) ? (
      <EmptyState icon={<Lock size={32} />} title="Bạn không còn quyền xem phiên này">
        Liên kết có thể đã bị thu hồi hoặc hết hạn. Hãy nhờ người mời gửi liên kết mới.
      </EmptyState>
    ) : (
      <ErrorState error={session.error} onRetry={() => session.refetch()} />
    )
  return <ChoiceVote session={session.data} />
}

function ChoiceVote({ session }: { session: Schemas['ChoiceSession'] }) {
  const vote = useCastVote(session.id)
  const toast = useToast()
  const isCreator = session.viewerRole === 'CREATOR'
  const partner = isCreator ? session.recipientName : session.creatorName
  const answered = session.candidates.filter((c) => c.myVote).length
  const total = session.candidates.length
  const mutual = session.candidates.filter((c) => c.mutualLike).length
  const finalized = session.status === 'FINALIZED'

  return (
    <div className="mx-auto max-w-3xl pb-24 md:pb-0">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={STATUS[session.status].tone}>{STATUS[session.status].label}</Badge>
      </div>
      <h1 className="mt-2 text-2xl leading-8 font-bold md:text-3xl">{partner ? `Cùng chọn với ${partner}` : 'Phiên cùng chọn'}</h1>
      <p className="mt-1 text-ink-muted">
        {isCreator ? 'Bạn sẽ chọn nơi cuối cùng sau khi cả hai trả lời.' : `${session.creatorName} sẽ chọn nơi cuối cùng.`}
      </p>

      {finalized && (
        <div role="status" className="mt-4 flex flex-wrap items-center gap-3 rounded-block border border-line bg-white p-4">
          <p className="flex-1 text-sm">Phiên đã được chốt. Bạn không thể đổi lựa chọn nữa.</p>
          {session.datePlanId && (
            <ButtonLink to={`/plans/${session.datePlanId}`} variant="secondary">
              Xem buổi hẹn
            </ButtonLink>
          )}
        </div>
      )}

      {session.status === 'WAITING' && isCreator && (
        <div role="status" className="mt-4 rounded-block border border-sky-100 bg-action-soft p-4 text-sm">
          Người ấy chưa tham gia. Bạn vẫn có thể trả lời trước; gửi lại liên kết ở phần Chia sẻ bên dưới nếu cần.
        </div>
      )}

      <div className="mt-5">
        <p className="text-sm text-ink-muted tabular" aria-live="polite">
          Bạn đã trả lời {answered}/{total} nơi
        </p>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-action-soft" aria-hidden="true">
          <span className="block h-full bg-action transition-[width]" style={{ width: `${(answered / total) * 100}%` }} />
        </div>
      </div>

      <h2 className="sr-only">Các lựa chọn</h2>
      <ul className="mt-4 flex flex-col gap-3">
        {session.candidates.map((c) => (
          <li key={c.id}>
            <VoteCard
              candidate={c}
              disabled={finalized}
              onVote={(preference) =>
                vote.mutate({ candidateId: c.id, preference }, { onError: (e) => toast.show(problemMessage(e), { tone: 'error' }) })
              }
            />
          </li>
        ))}
      </ul>

      {isCreator && !finalized && <SharingSection session={session} />}

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-white px-4 pt-2.5 pb-[max(.625rem,env(safe-area-inset-bottom))] md:static md:mt-6 md:border-0 md:bg-transparent md:p-0">
        <ButtonLink to={`/choice/${session.id}/results`} className="w-full md:w-auto">
          Xem nơi cả hai cùng thích <span className="tabular">({mutual})</span>
        </ButtonLink>
      </div>
    </div>
  )
}

/** FR-14: thu hồi link (có xác nhận), cấp link mới, loại người nhận. */
function SharingSection({ session }: { session: Schemas['ChoiceSession'] }) {
  const { newGrant, revoke, removeRecipient } = useSharingMutations(session.id)
  const toast = useToast()
  const [confirm, setConfirm] = useState<'revoke' | 'remove' | null>(null)
  const grant = session.activeShareGrant
  const grantLabel = !grant
    ? 'Chưa có liên kết đang hoạt động'
    : grant.status === 'VALID'
      ? `Liên kết còn hiệu lực đến ${formatDateTime(grant.expiresAt)}`
      : grant.status === 'REVOKED'
        ? 'Liên kết đã bị thu hồi'
        : 'Liên kết đã hết hạn'
  const onError = (e: unknown) => toast.show(problemMessage(e), { tone: 'error' })

  return (
    <section aria-labelledby="share-heading" className="mt-8 rounded-block border border-line bg-white p-4">
      <h2 id="share-heading" className="text-[17px] font-semibold">
        Chia sẻ
      </h2>
      <p className="mt-1 text-sm text-ink-muted tabular">{grantLabel}</p>
      {newGrant.data && (
        <div className="mt-3">
          <ShareLinkPanel url={newGrant.data.inviteUrl} expiresAt={newGrant.data.expiresAt} />
        </div>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <SecondaryButton pending={newGrant.isPending} onClick={() => newGrant.mutate(undefined, { onError })}>
          Cấp liên kết mới
        </SecondaryButton>
        {grant?.status === 'VALID' && <DangerButton onClick={() => setConfirm('revoke')}>Thu hồi liên kết</DangerButton>}
        {session.recipientName && <DangerButton onClick={() => setConfirm('remove')}>Loại {session.recipientName}</DangerButton>}
      </div>
      <p className="mt-2 text-[13px] text-ink-muted">Cấp liên kết mới sẽ thay liên kết cũ; liên kết cũ không dùng lại được.</p>

      <ConfirmDialog
        open={confirm === 'revoke'}
        onClose={() => setConfirm(null)}
        title="Thu hồi liên kết mời?"
        description="Người đang dùng liên kết này sẽ mất quyền xem và bỏ phiếu ngay. Liên kết cũ không thể khôi phục."
        confirmLabel="Thu hồi"
        pending={revoke.isPending}
        onConfirm={() => grant && revoke.mutate(grant.id, { onSuccess: () => (setConfirm(null), toast.show('Đã thu hồi liên kết')), onError })}
      />
      <ConfirmDialog
        open={confirm === 'remove'}
        onClose={() => setConfirm(null)}
        title={`Loại ${session.recipientName ?? 'người nhận'} khỏi phiên?`}
        description="Người này sẽ mất quyền truy cập phiên. Các phiếu đã có được giữ nguyên ý nghĩa. Bạn có thể cấp liên kết mới để mời lại."
        confirmLabel="Loại khỏi phiên"
        pending={removeRecipient.isPending}
        onConfirm={() => removeRecipient.mutate(undefined, { onSuccess: () => (setConfirm(null), toast.show('Đã loại người nhận')), onError })}
      />
    </section>
  )
}

export function BackToSession({ sessionId }: { sessionId: string }) {
  return (
    <Link to={`/choice/${sessionId}`} className="inline-flex min-h-11 items-center text-sm text-action hover:underline">
      Quay lại bỏ phiếu
    </Link>
  )
}
