import { useState } from 'react'
import { Link2, UserRoundCheck, UserRoundX, UsersRound } from 'lucide-react'
import { problemMessage } from '../../api/problem.ts'
import { usePlanInvite, usePlanInviteMutations } from '../../hooks/plans.ts'
import { formatDateTime } from '../../lib/format.ts'
import { ShareLinkPanel } from '../choice/ShareLinkPanel.tsx'
import { ConfirmDialog } from '../ui/Dialog.tsx'
import { GhostButton, PrimaryButton, SecondaryButton } from '../ui/Button.tsx'
import { Badge, Skeleton } from '../ui/StateView.tsx'
import { useToast } from '../ui/Toast.tsx'

/**
 * Chủ kế hoạch mời người ấy xem kế hoạch qua link (không cần tài khoản) và theo dõi câu trả lời.
 * Link chỉ hiện một lần ngay sau khi tạo; tạo lại thì link cũ mất hiệu lực.
 */
export function PlanInvitePanel({ planId }: { planId: string }) {
  const invite = usePlanInvite(planId, true)
  const m = usePlanInviteMutations(planId)
  const toast = useToast()
  const [freshUrl, setFreshUrl] = useState<{ url: string; expiresAt: string } | null>(null)
  const [confirm, setConfirm] = useState<'recreate' | 'revoke' | null>(null)

  const create = () =>
    m.create.mutate(undefined, {
      onSuccess: (r) => (setFreshUrl({ url: r.inviteUrl, expiresAt: r.expiresAt }), setConfirm(null)),
      onError: (e) => (toast.show(problemMessage(e), { tone: 'error' }), setConfirm(null)),
    })
  const revoke = () =>
    m.revoke.mutate(undefined, {
      onSuccess: () => (setFreshUrl(null), setConfirm(null), toast.show('Đã thu hồi link mời')),
      onError: (e) => (toast.show(problemMessage(e), { tone: 'error' }), setConfirm(null)),
    })

  return (
    <section aria-labelledby="plan-invite-heading" className="rounded-block border border-line bg-white p-4">
      <h2 id="plan-invite-heading" className="flex items-center gap-2 text-[17px] font-semibold">
        <UsersRound size={18} aria-hidden="true" /> Mời người ấy
      </h2>

      {invite.isPending ? (
        <Skeleton className="mt-3 h-16" />
      ) : freshUrl ? (
        <div className="mt-3 flex flex-col gap-2">
          <p className="text-sm">Gửi link này cho người ấy. Link chỉ hiện một lần ở đây, hãy sao chép ngay.</p>
          <ShareLinkPanel
            url={freshUrl.url}
            expiresAt={freshUrl.expiresAt}
            shareTitle="Mời bạn đi hẹn"
            warning="Ai có liên kết này đều xem được giờ, địa điểm và trả lời thay người ấy (không thấy ghi chú của bạn). Chỉ gửi cho người bạn muốn mời."
          />
        </div>
      ) : invite.data ? (
        <div className="mt-3 flex flex-col gap-2 text-sm">
          <p className="flex flex-wrap items-center gap-2">
            Đã gửi link lúc {formatDateTime(invite.data.createdAt)} ·
            {invite.data.response === 'GOING' ? (
              <Badge tone="success">
                <UserRoundCheck size={14} aria-hidden="true" /> {invite.data.guestName ?? 'Người ấy'} sẽ đi
              </Badge>
            ) : invite.data.response === 'NOT_GOING' ? (
              <Badge tone="attention">
                <UserRoundX size={14} aria-hidden="true" /> {invite.data.guestName ?? 'Người ấy'} không đi được
              </Badge>
            ) : (
              <Badge tone="muted">Chưa trả lời</Badge>
            )}
          </p>
          {invite.data.respondedAt && <p className="text-[13px] text-ink-muted">Trả lời lúc {formatDateTime(invite.data.respondedAt)}</p>}
          <p className="text-[13px] text-ink-muted">Không còn link? Tạo link mới (link cũ sẽ mất hiệu lực).</p>
        </div>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">
          Tạo link để người ấy xem giờ, địa điểm và trả lời có đi hay không, không cần tài khoản. Người ấy không thấy ghi chú của bạn.
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-2">
        {invite.data || freshUrl ? (
          <>
            <SecondaryButton icon={<Link2 size={16} aria-hidden="true" />} onClick={() => setConfirm('recreate')}>
              Tạo link mới
            </SecondaryButton>
            <GhostButton onClick={() => setConfirm('revoke')}>Thu hồi link</GhostButton>
          </>
        ) : (
          !invite.isPending && (
            <PrimaryButton icon={<Link2 size={16} aria-hidden="true" />} pending={m.create.isPending} onClick={create}>
              Tạo link mời
            </PrimaryButton>
          )
        )}
      </div>

      <ConfirmDialog
        open={confirm !== null}
        onClose={() => setConfirm(null)}
        onConfirm={confirm === 'recreate' ? create : revoke}
        pending={m.create.isPending || m.revoke.isPending}
        tone={confirm === 'recreate' ? 'primary' : 'danger'}
        title={confirm === 'recreate' ? 'Tạo link mời mới?' : 'Thu hồi link mời?'}
        description={
          confirm === 'recreate'
            ? 'Link cũ sẽ không mở được nữa và câu trả lời cũ bị xóa. Nhớ gửi link mới cho người ấy.'
            : 'Người có link sẽ không xem được kế hoạch nữa.'
        }
        confirmLabel={confirm === 'recreate' ? 'Tạo link mới' : 'Thu hồi'}
      />
    </section>
  )
}
