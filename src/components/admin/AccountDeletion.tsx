import { useState } from 'react'
import { RotateCcw, Trash2, TriangleAlert } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { adminProblemMessage } from '../../api/problem.ts'
import { useAdminUserMutations } from '../../hooks/admin.ts'
import { formatDateTime } from '../../lib/format.ts'
import { Dialog } from '../ui/Dialog.tsx'
import { Field } from '../ui/Field.tsx'
import { DangerButton, PrimaryButton, SecondaryButton } from '../ui/Button.tsx'
import { useToast } from '../ui/Toast.tsx'
import { Panel } from './AdminUi.tsx'

type User = Schemas['AdminUserDetail']

/** Dòng giải thích cho tài khoản đang chờ xóa hoặc đã xóa. */
export function DeletionBanner({ user }: { user: User }) {
  if (user.status === 'DELETION_REQUESTED')
    return (
      <p role="status" className="mb-4 flex items-start gap-2 rounded-control bg-peach-50 px-3.5 py-3 text-sm text-attention">
        <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
        <span>
          Người dùng đã yêu cầu xóa tài khoản{user.deletionRequestedAt ? ` lúc ${formatDateTime(user.deletionRequestedAt)}` : ''}.
          {user.scheduledDeletionAt && <> Hệ thống sẽ tự xóa vào <b>{formatDateTime(user.scheduledDeletionAt)}</b> nếu không khôi phục.</>} Trong lúc chờ
          không khóa, mở khóa hay đổi vai trò được.
        </span>
      </p>
    )
  if (user.status === 'DELETED')
    return (
      <p role="status" className="mb-4 rounded-control bg-page px-3.5 py-3 text-sm text-ink-muted">
        Tài khoản đã bị xóa{user.deletedAt ? ` lúc ${formatDateTime(user.deletedAt)}` : ''}: dữ liệu cá nhân đã được xóa, chỉ còn lại để nhật ký và báo sai cũ
        hiển thị đúng. Không khôi phục được.
      </p>
    )
  return null
}

/** Nút Khôi phục và Xóa ngay cho tài khoản đang chờ xóa. */
export function PendingDeletionActions({ user }: { user: User }) {
  const [dialog, setDialog] = useState<'restore' | 'erase' | null>(null)
  return (
    <>
      <PrimaryButton icon={<RotateCcw size={16} aria-hidden="true" />} onClick={() => setDialog('restore')}>
        Khôi phục
      </PrimaryButton>
      <DangerButton icon={<Trash2 size={16} aria-hidden="true" />} onClick={() => setDialog('erase')}>
        Xóa ngay
      </DangerButton>
      {dialog === 'restore' && <RestoreDialog user={user} onClose={() => setDialog(null)} />}
      {dialog === 'erase' && <EraseDialog user={user} onClose={() => setDialog(null)} />}
    </>
  )
}

/** Khu xóa tài khoản đang hoạt động / đã khóa (vd. tài khoản rác), đặt cuối trang. */
export function DangerZone({ user }: { user: User }) {
  const [open, setOpen] = useState(false)
  return (
    <Panel title="Vùng nguy hiểm" className="mt-8 border-danger/40">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-xl text-sm text-ink-muted">
          Xóa tài khoản sẽ xóa dữ liệu cá nhân (danh sách lưu, kế hoạch, phiên cùng chọn, yêu cầu hỗ trợ, thông báo) và đăng xuất ngay. Không hoàn tác được.
        </p>
        <DangerButton icon={<Trash2 size={16} aria-hidden="true" />} onClick={() => setOpen(true)}>
          Xóa tài khoản
        </DangerButton>
      </div>
      {open && <EraseDialog user={user} onClose={() => setOpen(false)} />}
    </Panel>
  )
}

function RestoreDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const m = useAdminUserMutations(user.id)
  const toast = useToast()
  const [reason, setReason] = useState('')
  return (
    <Dialog
      open
      onClose={onClose}
      title="Khôi phục tài khoản?"
      footer={
        <>
          <SecondaryButton onClick={onClose}>Quay lại</SecondaryButton>
          <PrimaryButton
            pending={m.restore.isPending}
            disabled={!reason.trim()}
            onClick={() =>
              m.restore.mutate(reason.trim(), {
                onSuccess: () => (toast.show('Đã khôi phục tài khoản'), onClose()),
              })
            }
          >
            Khôi phục
          </PrimaryButton>
        </>
      }
    >
      <p className="mb-3 text-sm text-ink-muted">
        Tài khoản trở lại hoạt động, người dùng đăng nhập lại được. Link chia sẻ đã bị thu hồi lúc yêu cầu xóa không tự mở lại.
      </p>
      <Field.Root>
        <Field.Label>Lý do (lưu vào nhật ký)</Field.Label>
        <Field.Textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
      </Field.Root>
      {m.restore.error && <p role="alert" className="mt-2 text-sm text-danger">{adminProblemMessage(m.restore.error)}</p>}
    </Dialog>
  )
}

function EraseDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const m = useAdminUserMutations(user.id)
  const toast = useToast()
  const [reason, setReason] = useState('')
  const [email, setEmail] = useState('')
  const matches = email.trim().toLowerCase() === user.email.toLowerCase()
  return (
    <Dialog
      open
      onClose={onClose}
      title="Xóa tài khoản vĩnh viễn?"
      footer={
        <>
          <SecondaryButton onClick={onClose}>Quay lại</SecondaryButton>
          <DangerButton
            pending={m.erase.isPending}
            disabled={!reason.trim() || !matches}
            onClick={() =>
              m.erase.mutate(
                { reason: reason.trim(), confirmEmail: email.trim() },
                { onSuccess: () => (toast.show('Đã xóa tài khoản'), onClose()) },
              )
            }
          >
            Xóa vĩnh viễn
          </DangerButton>
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <p className="flex items-start gap-2 rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
          <TriangleAlert size={18} className="mt-0.5 shrink-0" aria-hidden="true" />
          Xóa email, tên, ảnh, danh sách lưu, kế hoạch, phiên cùng chọn, yêu cầu hỗ trợ, thông báo, phiên đăng nhập và Authenticator. Báo sai và nhật ký được giữ,
          hiện là "Tài khoản đã xóa". Không hoàn tác được.
        </p>
        <Field.Root hint>
          <Field.Label>Gõ lại email để xác nhận</Field.Label>
          <Field.Hint>{user.email}</Field.Hint>
          <Field.Input value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="off" spellCheck={false} />
        </Field.Root>
        <Field.Root>
          <Field.Label>Lý do (lưu vào nhật ký)</Field.Label>
          <Field.Textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
        </Field.Root>
        {m.erase.error && <p role="alert" className="text-sm text-danger">{adminProblemMessage(m.erase.error)}</p>}
      </div>
    </Dialog>
  )
}
