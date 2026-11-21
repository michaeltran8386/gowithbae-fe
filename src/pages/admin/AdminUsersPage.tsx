import { useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Copy, Plus, Search } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { fieldErrors, adminProblemMessage } from '../../api/problem.ts'
import { ROLE_LABELS, STATUS_LABELS, useAdminUserMutations, useAdminUsers, type Role, type UserStatus } from '../../hooks/admin.ts'
import { PageHeader, Pagination, Table, copyText, td, th } from '../../components/admin/AdminUi.tsx'
import { Dialog } from '../../components/ui/Dialog.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

export function RoleBadges({ roles }: { roles: Role[] }) {
  return (
    <span className="flex flex-wrap gap-1">
      {roles.map((r) => (
        <Badge key={r} tone={r === 'SUPER_ADMIN' ? 'attention' : 'neutral'}>
          {ROLE_LABELS[r]}
        </Badge>
      ))}
    </span>
  )
}

export function StatusBadge({ status }: { status: UserStatus }) {
  return <Badge tone={status === 'ACTIVE' ? 'success' : status === 'LOCKED' ? 'attention' : 'muted'}>{STATUS_LABELS[status]}</Badge>
}

/** Danh sách tài khoản: tìm theo email/tên, lọc trạng thái, tạo tài khoản mới. */
export function AdminUsersPage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const status = (params.get('status') as UserStatus | null) ?? undefined
  const page = Number(params.get('page') ?? 0)
  const users = useAdminUsers({ q, status, page })
  const [draft, setDraft] = useState(q)
  const [creating, setCreating] = useState(false)

  const update = (next: Record<string, string | undefined>) => {
    const p = new URLSearchParams(params)
    for (const [k, v] of Object.entries(next)) {
      if (v) p.set(k, v)
      else p.delete(k)
    }
    if (!('page' in next)) p.delete('page')
    setParams(p, { replace: true })
  }

  return (
    <>
      <PageHeader
        title="Tài khoản"
        description="Xem, tạo, khóa hoặc mở tài khoản; xem lịch sử đăng nhập và hoạt động của từng người."
        actions={
          <PrimaryButton icon={<Plus size={16} aria-hidden="true" />} onClick={() => setCreating(true)}>
            Tạo tài khoản
          </PrimaryButton>
        }
      />
      <form
        className="mb-4 flex flex-wrap items-end gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          update({ q: draft.trim() || undefined })
        }}
      >
        <Field.Root className="min-w-60 flex-1">
          <Field.Label>Tìm theo email hoặc tên</Field.Label>
          <Field.Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="vd. linh@gmail.com" />
        </Field.Root>
        <Field.Root>
          <Field.Label>Trạng thái</Field.Label>
          <Field.Select value={status ?? ''} onChange={(e) => update({ status: e.target.value || undefined })}>
            <option value="">Tất cả</option>
            {(Object.keys(STATUS_LABELS) as UserStatus[]).map((s) => (
              <option key={s} value={s}>
                {STATUS_LABELS[s]}
              </option>
            ))}
          </Field.Select>
        </Field.Root>
        <SecondaryButton type="submit" icon={<Search size={16} aria-hidden="true" />}>
          Tìm
        </SecondaryButton>
      </form>

      {users.isPending ? (
        <LoadingState />
      ) : users.isError ? (
        <ErrorState error={users.error} onRetry={() => users.refetch()} />
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Tài khoản</th>
                <th className={th}>Vai trò</th>
                <th className={th}>Trạng thái</th>
                <th className={th}>Ngày tạo</th>
              </tr>
            }
            empty={users.data.items.length === 0 ? <EmptyState title="Không có tài khoản phù hợp" /> : undefined}
          >
            {users.data.items.map((u) => (
              <tr key={u.id} className="hover:bg-page">
                <td className={td}>
                  <Link to={`/admin/users/${u.id}`} className="font-semibold text-action hover:underline">
                    {u.displayName}
                  </Link>
                  <span className="block text-[13px] text-ink-muted">{u.email}</span>
                </td>
                <td className={td}>
                  <RoleBadges roles={u.roles} />
                </td>
                <td className={td}>
                  <StatusBadge status={u.status} />
                  {u.lockedReason && <span className="mt-1 block text-[12px] text-ink-muted">{u.lockedReason}</span>}
                </td>
                <td className={`${td} whitespace-nowrap text-ink-muted`}>{u.createdAt ? formatDateTime(u.createdAt) : '—'}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={users.data.page} onChange={(p) => update({ page: String(p) })} />
        </>
      )}
      <CreateUserDialog open={creating} onClose={() => setCreating(false)} />
    </>
  )
}

const CREATE_ROLES: { role: Role; hint: string }[] = [
  { role: 'MEMBER', hint: 'Người dùng web: lưu địa điểm, cùng chọn, lên kế hoạch.' },
  { role: 'SUPER_ADMIN', hint: 'Toàn quyền quản trị. Cần kích hoạt Google Authenticator qua link.' },
  { role: 'EDITOR', hint: 'Biên tập địa điểm, bộ sưu tập, nhập CSV.' },
  { role: 'REVIEWER', hint: 'Duyệt, ẩn địa điểm; xử lý báo sai.' },
  { role: 'SUPPORT', hint: 'Trả lời yêu cầu hỗ trợ.' },
]

function CreateUserDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { create } = useAdminUserMutations()
  const toast = useToast()
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<Role>('MEMBER')
  const [created, setCreated] = useState<Schemas['AdminUserCreated'] | null>(null)

  const close = () => {
    setEmail('')
    setName('')
    setRole('MEMBER')
    setCreated(null)
    create.reset()
    onClose()
  }
  const errors = create.error ? fieldErrors(create.error) : {}

  if (created)
    return (
      <Dialog open={open} onClose={close} title="Đã tạo tài khoản" footer={<PrimaryButton onClick={close}>Xong</PrimaryButton>}>
        <p className="text-sm">
          <span className="font-semibold">{created.user.email}</span> có thể đăng nhập bằng mã gửi qua email.
        </p>
        {created.activation && (
          <div className="mt-4 rounded-control border border-line bg-page p-3 text-sm">
            <p className="font-semibold">Gửi link kích hoạt Google Authenticator cho người này</p>
            <p className="mt-1 text-ink-muted">Dùng một lần, hết hạn {formatDateTime(created.activation.expiresAt)}.</p>
            <code className="mt-2 block break-all rounded-control bg-white px-2 py-1.5 text-[12px]">{created.activation.activationUrl}</code>
            <SecondaryButton
              className="mt-2"
              icon={<Copy size={16} aria-hidden="true" />}
              onClick={async () => toast.show((await copyText(created.activation!.activationUrl)) ? 'Đã sao chép link' : 'Không sao chép được, hãy chọn và copy thủ công')}
            >
              Sao chép link
            </SecondaryButton>
          </div>
        )}
      </Dialog>
    )

  return (
    <Dialog
      open={open}
      onClose={close}
      title="Tạo tài khoản"
      description="Không cần mật khẩu: người dùng đăng nhập bằng mã gửi qua email."
      footer={
        <>
          <SecondaryButton onClick={close}>Hủy</SecondaryButton>
          <PrimaryButton
            pending={create.isPending}
            disabled={!email.trim()}
            onClick={() =>
              create.mutate(
                { email: email.trim(), displayName: name.trim() || undefined, roles: [role] },
                { onSuccess: (data) => setCreated(data) },
              )
            }
          >
            Tạo
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <Field.Root error={errors.email ?? (create.error && !Object.keys(errors).length ? adminProblemMessage(create.error) : undefined)}>
          <Field.Label>Email</Field.Label>
          <Field.Input type="email" value={email} onChange={(e) => (setEmail(e.target.value), create.reset())} maxLength={254} autoFocus />
          <Field.Error />
        </Field.Root>
        <Field.Root>
          <Field.Label optional>Tên hiển thị</Field.Label>
          <Field.Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} />
        </Field.Root>
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-semibold">Vai trò</legend>
          {CREATE_ROLES.map((r) => (
            <label key={r.role} className="flex cursor-pointer items-start gap-2 rounded-control border border-line p-2.5 has-[:checked]:border-action has-[:checked]:bg-action-soft">
              <input type="radio" name="role" value={r.role} checked={role === r.role} onChange={() => setRole(r.role)} className="mt-1" />
              <span>
                <span className="text-sm font-semibold">{ROLE_LABELS[r.role]}</span>
                <span className="block text-[13px] text-ink-muted">{r.hint}</span>
              </span>
            </label>
          ))}
        </fieldset>
      </div>
    </Dialog>
  )
}
