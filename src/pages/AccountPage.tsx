import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { Bell, ChevronRight, LifeBuoy, LogOut, Mail } from 'lucide-react'
import { fieldErrors, problemMessage } from '../api/problem.ts'
import { useAuth } from '../app/auth.tsx'
import { useNotifications, useProfileMutations } from '../hooks/account.ts'
import { ConfirmDialog, Dialog } from '../components/ui/Dialog.tsx'
import { Field } from '../components/ui/Field.tsx'
import { DangerButton, GhostButton, PrimaryButton, SecondaryButton } from '../components/ui/Button.tsx'
import { useToast } from '../components/ui/Toast.tsx'

/** S-16 Tài khoản — FR-08, RULE-17. Không hỏi tình trạng quan hệ. Ảnh đại diện: chờ quy định tệp (OQ-21). */
export function AccountPage() {
  const { state, actions } = useAuth()
  const navigate = useNavigate()
  const notifications = useNotifications()
  const user = state.user!
  const [editing, setEditing] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const unread = notifications.data?.unreadCount ?? 0

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold md:text-3xl">Tài khoản</h1>

      <section className="mt-5 flex items-center gap-4 rounded-block border border-line bg-white p-4">
        <span aria-hidden="true" className="flex size-16 shrink-0 items-center justify-center rounded-full bg-action-soft text-2xl font-bold text-action">
          {user.displayName.trim().charAt(0).toUpperCase() || '?'}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[17px] font-semibold">{user.displayName}</p>
          <p className="truncate text-sm text-ink-muted">{user.email}</p>
        </div>
        <SecondaryButton onClick={() => setEditing(true)}>Sửa hồ sơ</SecondaryButton>
      </section>

      <nav aria-label="Mục tài khoản" className="mt-4 overflow-hidden rounded-block border border-line bg-white">
        <ul className="divide-y divide-line">
          <MenuLink to="/account/notifications" icon={<Bell size={20} />} label="Thông báo" extra={unread > 0 ? `${unread} chưa đọc` : undefined} />
          <MenuLink to="/account/support" icon={<LifeBuoy size={20} />} label="Hỗ trợ" />
          <li>
            <button type="button" onClick={() => setChangingEmail(true)} className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-page">
              <Mail size={20} className="text-ink-muted" aria-hidden="true" />
              <span className="flex-1">Đổi email</span>
              <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
            </button>
          </li>
          <li>
            <button
              type="button"
              onClick={async () => {
                await actions.signOut()
                navigate('/', { replace: true })
              }}
              className="flex min-h-14 w-full items-center gap-3 px-4 text-left hover:bg-page"
            >
              <LogOut size={20} className="text-ink-muted" aria-hidden="true" />
              <span className="flex-1">Đăng xuất</span>
            </button>
          </li>
        </ul>
      </nav>

      <section aria-labelledby="danger-heading" className="mt-8 rounded-block border border-danger/25 bg-white p-4">
        <h2 id="danger-heading" className="font-semibold">
          Xóa tài khoản
        </h2>
        <p className="mt-1 text-sm text-ink-muted">Bạn sẽ bị đăng xuất, các liên kết mời bạn đã tạo sẽ hết hiệu lực.</p>
        <DangerButton className="mt-3" onClick={() => setDeleting(true)}>
          Yêu cầu xóa tài khoản
        </DangerButton>
      </section>

      {editing && <EditProfileDialog name={user.displayName} onClose={() => setEditing(false)} />}
      {changingEmail && <ChangeEmailDialog currentEmail={user.email} onClose={() => setChangingEmail(false)} />}
      <DeleteAccountDialog open={deleting} onClose={() => setDeleting(false)} />
    </div>
  )
}

function MenuLink({ to, icon, label, extra }: { to: string; icon: React.ReactNode; label: string; extra?: string }) {
  return (
    <li>
      <Link to={to} className="flex min-h-14 items-center gap-3 px-4 hover:bg-page">
        <span className="text-ink-muted" aria-hidden="true">
          {icon}
        </span>
        <span className="flex-1">{label}</span>
        {extra && <span className="rounded-full bg-peach-50 px-2 py-0.5 text-xs font-semibold text-attention tabular">{extra}</span>}
        <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
      </Link>
    </li>
  )
}

function EditProfileDialog({ name, onClose }: { name: string; onClose: () => void }) {
  const { update } = useProfileMutations()
  const toast = useToast()
  const [value, setValue] = useState(name)
  const [error, setError] = useState<string>()
  const submit = () => {
    if (!value.trim()) return setError('Tên hiển thị không được để trống')
    update.mutate(
      { displayName: value.trim() },
      {
        onSuccess: () => {
          toast.show('Đã lưu hồ sơ')
          onClose()
        },
        onError: (e) => setError(fieldErrors(e).displayName ?? problemMessage(e)),
      },
    )
  }
  return (
    <Dialog
      open
      onClose={onClose}
      title="Sửa hồ sơ"
      footer={
        <>
          <GhostButton onClick={onClose}>Hủy</GhostButton>
          <PrimaryButton pending={update.isPending} onClick={submit}>
            Lưu hồ sơ
          </PrimaryButton>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
      >
        <Field.Root error={error}>
          <Field.Label>Tên hiển thị</Field.Label>
          <Field.Input value={value} maxLength={50} autoComplete="nickname" onChange={(e) => (setValue(e.target.value), setError(undefined))} />
          <Field.Error />
        </Field.Root>
      </form>
    </Dialog>
  )
}

/** Email cũ giữ nguyên cho đến khi xác minh email mới (AC-009). */
function ChangeEmailDialog({ currentEmail, onClose }: { currentEmail: string; onClose: () => void }) {
  const { requestEmailChange, verifyEmailChange } = useProfileMutations()
  const toast = useToast()
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const emailError = requestEmailChange.error ? (fieldErrors(requestEmailChange.error).newEmail ?? problemMessage(requestEmailChange.error)) : undefined
  const codeError = verifyEmailChange.error ? (fieldErrors(verifyEmailChange.error).code ?? problemMessage(verifyEmailChange.error)) : undefined

  return (
    <Dialog
      open
      onClose={onClose}
      title="Đổi email"
      description={`Email hiện tại: ${currentEmail}. Email này được giữ cho đến khi bạn xác minh email mới.`}
      footer={
        step === 'email' ? (
          <>
            <GhostButton onClick={onClose}>Hủy</GhostButton>
            <PrimaryButton pending={requestEmailChange.isPending} disabled={!email.trim()} onClick={() => requestEmailChange.mutate(email.trim(), { onSuccess: () => setStep('code') })}>
              Gửi mã xác minh
            </PrimaryButton>
          </>
        ) : (
          <>
            <GhostButton onClick={() => setStep('email')}>Đổi email khác</GhostButton>
            <PrimaryButton
              pending={verifyEmailChange.isPending}
              disabled={code.length !== 6}
              onClick={() =>
                verifyEmailChange.mutate(code, {
                  onSuccess: () => {
                    toast.show('Đã đổi email')
                    onClose()
                  },
                })
              }
            >
              Xác minh
            </PrimaryButton>
          </>
        )
      }
    >
      {step === 'email' ? (
        <Field.Root error={emailError}>
          <Field.Label>Email mới</Field.Label>
          <Field.Input type="email" autoComplete="email" spellCheck={false} value={email} onChange={(e) => (setEmail(e.target.value), requestEmailChange.reset())} placeholder="vd. ban.moi@example.com" />
          <Field.Error />
        </Field.Root>
      ) : (
        <Field.Root error={codeError} hint>
          <Field.Label>Mã xác minh</Field.Label>
          <Field.Hint>Mã gồm 6 chữ số đã gửi tới {email}.</Field.Hint>
          <Field.Input
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => (setCode(e.target.value.replace(/\D/g, '')), verifyEmailChange.reset())}
            className="tracking-[0.3em] tabular"
          />
          <Field.Error />
        </Field.Root>
      )}
    </Dialog>
  )
}

/** Không tuyên bố đã xóa khi mới nhận yêu cầu (RULE-17, OQ-17). Xác nhận 2 bước bằng gõ chữ. */
function DeleteAccountDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { requestDeletion } = useProfileMutations()
  const { actions } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [typed, setTyped] = useState('')
  const CONFIRM_WORD = 'XÓA'

  return (
    <ConfirmDialog
      open={open}
      onClose={() => (setTyped(''), onClose())}
      title="Yêu cầu xóa tài khoản?"
      description="Bạn sẽ bị đăng xuất ngay và các liên kết mời đã tạo sẽ hết hiệu lực. Tài khoản và dữ liệu cá nhân bị xóa sau 30 ngày; trong thời gian này muốn giữ lại tài khoản, hãy liên hệ hỗ trợ."
      confirmLabel="Gửi yêu cầu xóa"
      pending={requestDeletion.isPending}
      onConfirm={() => {
        if (typed.trim().toUpperCase() !== CONFIRM_WORD) return
        requestDeletion.mutate(undefined, {
          onSuccess: async () => {
            await actions.signOut()
            toast.show('Đã nhận yêu cầu xóa tài khoản')
            navigate('/', { replace: true })
          },
          onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
        })
      }}
    >
      <Field.Root>
        <Field.Label>Gõ “{CONFIRM_WORD}” để xác nhận</Field.Label>
        <Field.Input value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
      </Field.Root>
    </ConfirmDialog>
  )
}
