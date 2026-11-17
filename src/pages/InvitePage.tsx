import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { LinkIcon, UsersRound } from 'lucide-react'
import { fieldErrors, isStatus, problemMessage } from '../api/problem.ts'
import { useInvitePreview, useJoinInvite } from '../hooks/choice.ts'
import { formatDateTime } from '../lib/format.ts'
import { Field } from '../components/ui/Field.tsx'
import { PrimaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { Heart } from '../components/ui/Heart.tsx'

/**
 * S-10 Link mời — FR-11, CR-001 DEC-03: xem và tham gia KHÔNG cần đăng nhập; tham gia bằng tên hiển thị → phiên khách theo link.
 * Xem trước các địa điểm trước khi tham gia: chờ contract bổ sung (CCR-03).
 */
export function InvitePage() {
  const { inviteToken = '' } = useParams()
  const preview = useInvitePreview(inviteToken)
  const join = useJoinInvite(inviteToken)
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [localError, setLocalError] = useState<string>()

  // Link mời không được index (RULE-12)
  useEffect(() => {
    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    document.head.append(meta)
    return () => meta.remove()
  }, [])

  if (preview.isPending) return <Skeleton className="h-72" />
  if (preview.isError)
    return isStatus(preview.error, 410, 404) ? (
      <EmptyState icon={<LinkIcon size={32} />} title="Liên kết không còn hiệu lực">
        Liên kết đã hết hạn hoặc đã bị thu hồi. Hãy nhờ người mời gửi liên kết mới.
      </EmptyState>
    ) : (
      <ErrorState error={preview.error} onRetry={() => preview.refetch()} />
    )

  const p = preview.data
  const slotTaken = !p.slotAvailable || isStatus(join.error, 409)
  if (slotTaken)
    return (
      <EmptyState icon={<UsersRound size={32} />} title="Lời mời này đã có người tham gia">
        Mỗi lời mời chỉ dành cho một người. Hãy liên hệ {p.creatorName} để nhận liên kết mới.
      </EmptyState>
    )
  if (isStatus(join.error, 410))
    return (
      <EmptyState icon={<LinkIcon size={32} />} title="Liên kết không còn hiệu lực">
        Hãy nhờ người mời gửi liên kết mới.
      </EmptyState>
    )

  const error = localError ?? (join.error ? (fieldErrors(join.error).displayName ?? problemMessage(join.error)) : undefined)

  return (
    <section className="rounded-block border border-line bg-white p-5 md:p-8" aria-labelledby="invite-heading">
      <Heart size={36} />
      <h1 id="invite-heading" className="mt-3 text-2xl leading-8 font-bold">
        {p.creatorName} mời bạn cùng chọn nơi hẹn hò
      </h1>
      <p className="mt-2 text-ink-muted">
        Có <span className="font-semibold text-ink tabular">{p.candidateCount}</span> địa điểm. Bạn bấm Thích hoặc Bỏ qua từng nơi; {p.creatorName} sẽ chọn nơi cuối cùng.
      </p>
      {p.expiresAt && <p className="mt-1 text-[13px] text-ink-muted tabular">Lời mời có hiệu lực đến {formatDateTime(p.expiresAt)}.</p>}

      <form
        className="mt-6 flex flex-col gap-4"
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          if (!name.trim()) return setLocalError('Hãy nhập tên hiển thị')
          join.mutate(name.trim(), { onSuccess: (r) => navigate(`/choice/${r.choiceSessionId}`, { replace: true }) })
        }}
      >
        <Field.Root error={error} hint>
          <Field.Label>Tên của bạn</Field.Label>
          <Field.Input
            value={name}
            maxLength={50}
            autoComplete="nickname"
            onChange={(e) => {
              setName(e.target.value)
              setLocalError(undefined)
              join.reset()
            }}
            placeholder="vd. Lan…"
          />
          <Field.Hint>{p.creatorName} sẽ thấy tên này trong phiên cùng chọn.</Field.Hint>
          <Field.Error />
        </Field.Root>
        <PrimaryButton type="submit" pending={join.isPending}>
          Tham gia chọn
        </PrimaryButton>
        <p className="text-[13px] text-ink-muted">Không cần tạo tài khoản. Chỉ khi muốn lưu địa điểm yêu thích, bạn mới cần đăng nhập.</p>
      </form>
    </section>
  )
}
