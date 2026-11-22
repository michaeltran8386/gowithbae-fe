import { useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, Copy, KeyRound, Lock, LogOut, ShieldCheck, Unlock, UserCog } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { adminProblemMessage } from '../../api/problem.ts'
import { useAuth } from '../../app/auth.tsx'
import {
  ROLE_LABELS,
  useAdminUser,
  useAdminUserActivity,
  useAdminUserMutations,
  useAdminUserSessions,
  useAuditLogs,
  type Role,
} from '../../hooks/admin.ts'
import { PageHeader, Pagination, Panel, StatCard, Table, copyText, td, th } from '../../components/admin/AdminUi.tsx'
import { ConfirmDialog, Dialog } from '../../components/ui/Dialog.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { DangerButton, PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime, formatRelative } from '../../lib/format.ts'
import { RoleBadges, StatusBadge } from './AdminUsersPage.tsx'
import { AuditTable } from './AdminAuditPage.tsx'
import { DangerZone, DeletionBanner, PendingDeletionActions } from '../../components/admin/AccountDeletion.tsx'

type Tab = 'activity' | 'sessions' | 'audit'

/** Chi tiết tài khoản: khóa/mở, vai trò, đăng xuất mọi thiết bị, TOTP; tab hoạt động, phiên đăng nhập, nhật ký. */
export function AdminUserDetailPage() {
  const { userId = '' } = useParams()
  const user = useAdminUser(userId)
  const { state } = useAuth()
  const isSelf = state.user?.id === userId
  const [tab, setTab] = useState<Tab>('activity')

  if (user.isPending) return <LoadingState />
  if (user.isError) return <ErrorState error={user.error} onRetry={() => user.refetch()} />
  const u = user.data

  return (
    <>
      <Link to="/admin/users" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Tài khoản
      </Link>
      <PageHeader
        title={u.displayName}
        description={u.email}
        actions={u.status === 'DELETION_REQUESTED' ? <PendingDeletionActions user={u} /> : u.status === 'DELETED' ? null : <UserActions user={u} />}
      />
      <DeletionBanner user={u} />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="Trạng thái" value={<StatusBadge status={u.status} />} hint={u.lockedReason ?? undefined} />
        <StatCard label="Vai trò" value={<RoleBadges roles={u.roles} />} />
        <StatCard
          label="Đăng nhập gần nhất"
          value={<span className="text-base">{u.lastLoginAt ? formatRelative(u.lastLoginAt) : 'Chưa đăng nhập'}</span>}
          hint={u.lastSeenAt ? `Hoạt động gần nhất ${formatRelative(u.lastSeenAt)}` : undefined}
        />
        <StatCard
          label="Phiên đang mở"
          value={u.activeSessions ?? 0}
          hint={u.roles.some((r) => r !== 'MEMBER') ? (u.mfaEnrolled ? 'Đã bật Authenticator' : 'Chưa bật Authenticator') : `Tạo ngày ${u.createdAt ? formatDateTime(u.createdAt) : '—'}`}
        />
      </div>

      <div role="tablist" aria-label="Thông tin tài khoản" className="mb-4 flex gap-1 border-b border-line">
        {(
          [
            ['activity', 'Hoạt động'],
            ['sessions', 'Phiên đăng nhập'],
            ['audit', 'Nhật ký quản trị'],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            type="button"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 px-3 py-2 text-sm ${tab === key ? 'border-action font-semibold text-action' : 'border-transparent text-ink-muted hover:text-ink'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'activity' && <ActivityTab userId={userId} />}
      {tab === 'sessions' && <SessionsTab userId={userId} />}
      {tab === 'audit' && <UserAuditTab userId={userId} />}
      {(u.status === 'ACTIVE' || u.status === 'LOCKED') && !isSelf && <DangerZone user={u} />}
    </>
  )
}

function UserActions({ user }: { user: Schemas['AdminUserDetail'] }) {
  const { state } = useAuth()
  const isSelf = state.user?.id === user.id
  const m = useAdminUserMutations(user.id)
  const toast = useToast()
  const [dialog, setDialog] = useState<'lock' | 'unlock' | 'roles' | 'revoke' | 'activation' | null>(null)
  const [reason, setReason] = useState('')
  const [roles, setRoles] = useState<Role[]>(user.roles)
  const [link, setLink] = useState<Schemas['MfaActivationLink'] | null>(null)
  const close = () => {
    setDialog(null)
    setReason('')
    setRoles(user.roles)
    setLink(null)
    m.lock.reset()
    m.unlock.reset()
    m.setRoles.reset()
  }
  const isStaff = user.roles.some((r) => r !== 'MEMBER')

  return (
    <>
      {user.status === 'ACTIVE' && !isSelf && (
        <DangerButton icon={<Lock size={16} aria-hidden="true" />} onClick={() => setDialog('lock')}>
          Khóa
        </DangerButton>
      )}
      {user.status === 'LOCKED' && (
        <SecondaryButton icon={<Unlock size={16} aria-hidden="true" />} onClick={() => setDialog('unlock')}>
          Mở khóa
        </SecondaryButton>
      )}
      <SecondaryButton icon={<UserCog size={16} aria-hidden="true" />} onClick={() => setDialog('roles')}>
        Vai trò
      </SecondaryButton>
      <SecondaryButton icon={<LogOut size={16} aria-hidden="true" />} onClick={() => setDialog('revoke')} disabled={!user.activeSessions}>
        Đăng xuất mọi thiết bị
      </SecondaryButton>
      {isStaff && (
        <SecondaryButton
          icon={<KeyRound size={16} aria-hidden="true" />}
          pending={m.issueActivation.isPending}
          onClick={() =>
            m.issueActivation.mutate(undefined, {
              onSuccess: (data) => {
                setLink(data)
                setDialog('activation')
              },
              onError: (e) => toast.show(adminProblemMessage(e), { tone: 'error' }),
            })
          }
        >
          Link Authenticator
        </SecondaryButton>
      )}

      {(dialog === 'lock' || dialog === 'unlock') && (
        <Dialog
          open
          onClose={close}
          title={dialog === 'lock' ? `Khóa tài khoản ${user.email}?` : `Mở khóa ${user.email}?`}
          description={dialog === 'lock' ? 'Người dùng bị đăng xuất ngay trên mọi thiết bị và không đăng nhập lại được cho tới khi mở khóa.' : 'Người dùng đăng nhập lại được bằng mã email.'}
          footer={
            <>
              <SecondaryButton onClick={close}>Quay lại</SecondaryButton>
              {dialog === 'lock' ? (
                <DangerButton pending={m.lock.isPending} disabled={!reason.trim()} onClick={() => m.lock.mutate(reason.trim(), { onSuccess: () => (close(), toast.show('Đã khóa tài khoản')) })}>
                  Khóa
                </DangerButton>
              ) : (
                <PrimaryButton pending={m.unlock.isPending} disabled={!reason.trim()} onClick={() => m.unlock.mutate(reason.trim(), { onSuccess: () => (close(), toast.show('Đã mở khóa')) })}>
                  Mở khóa
                </PrimaryButton>
              )}
            </>
          }
        >
          <Field.Root error={(m.lock.error ?? m.unlock.error) ? adminProblemMessage(m.lock.error ?? m.unlock.error) : undefined}>
            <Field.Label>Lý do (lưu vào nhật ký)</Field.Label>
            <Field.Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={3} autoFocus />
            <Field.Error />
          </Field.Root>
        </Dialog>
      )}

      {dialog === 'roles' && (
        <Dialog
          open
          onClose={close}
          title="Đổi vai trò"
          description="Đổi vai trò sẽ đăng xuất người này khỏi mọi thiết bị. Vai trò quản trị cần kích hoạt Authenticator trước khi đăng nhập."
          footer={
            <>
              <SecondaryButton onClick={close}>Quay lại</SecondaryButton>
              <PrimaryButton
                pending={m.setRoles.isPending}
                disabled={!reason.trim() || roles.length === 0}
                onClick={() => m.setRoles.mutate({ roles, reason: reason.trim() }, { onSuccess: () => (close(), toast.show('Đã đổi vai trò')) })}
              >
                Lưu
              </PrimaryButton>
            </>
          }
        >
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1 text-sm font-semibold">Vai trò</legend>
            {(Object.keys(ROLE_LABELS) as Role[]).map((r) => (
              <label key={r} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={roles.includes(r)}
                  onChange={(e) => setRoles((cur) => (e.target.checked ? [...cur, r] : cur.filter((x) => x !== r)))}
                />
                {ROLE_LABELS[r]}
              </label>
            ))}
          </fieldset>
          <Field.Root className="mt-4" error={m.setRoles.error ? adminProblemMessage(m.setRoles.error) : undefined}>
            <Field.Label>Lý do (lưu vào nhật ký)</Field.Label>
            <Field.Textarea value={reason} onChange={(e) => setReason(e.target.value)} maxLength={1000} rows={2} />
            <Field.Error />
          </Field.Root>
        </Dialog>
      )}

      <ConfirmDialog
        open={dialog === 'revoke'}
        onClose={close}
        title="Đăng xuất khỏi mọi thiết bị?"
        description="Mọi phiên đang mở của tài khoản bị thu hồi ngay. Tài khoản không bị khóa, người dùng đăng nhập lại được."
        confirmLabel="Đăng xuất tất cả"
        pending={m.revokeSessions.isPending}
        onConfirm={() => m.revokeSessions.mutate(undefined, { onSuccess: () => (close(), toast.show('Đã đăng xuất mọi thiết bị')) })}
      />

      {dialog === 'activation' && link && (
        <Dialog open onClose={close} title="Link kích hoạt Authenticator" footer={<PrimaryButton onClick={close}>Xong</PrimaryButton>}>
          <p className="flex items-start gap-2 text-sm">
            <ShieldCheck size={18} className="mt-0.5 shrink-0 text-action" aria-hidden="true" />
            Gửi link này cho {user.email}. Link dùng một lần, hết hạn {formatDateTime(link.expiresAt)}; các link cũ chưa dùng đã bị hủy.
          </p>
          <code className="mt-3 block break-all rounded-control bg-page px-2 py-1.5 text-[12px]">{link.activationUrl}</code>
          <SecondaryButton
            className="mt-2"
            icon={<Copy size={16} aria-hidden="true" />}
            onClick={async () => toast.show((await copyText(link.activationUrl)) ? 'Đã sao chép link' : 'Không sao chép được')}
          >
            Sao chép link
          </SecondaryButton>
        </Dialog>
      )}
    </>
  )
}

const EVENT_LABELS: Record<string, string> = {
  search_performed: 'Tìm kiếm',
  place_viewed: 'Xem địa điểm',
  place_saved: 'Lưu địa điểm',
  compare_opened: 'Mở so sánh',
  choice_session_created: 'Tạo phiên cùng chọn',
  date_plan_created: 'Tạo kế hoạch',
}

function ActivityTab({ userId }: { userId: string }) {
  const a = useAdminUserActivity(userId)
  if (a.isPending) return <LoadingState />
  if (a.isError) return <ErrorState error={a.error} onRetry={() => a.refetch()} />
  const d = a.data
  const stats: [string, number][] = [
    ['Danh sách đã lưu', d.savedLists],
    ['Địa điểm đã lưu', d.savedPlaces],
    ['Phiên cùng chọn đã tạo', d.choiceSessionsCreated],
    ['Phiên đã chốt', d.choiceSessionsFinalized],
    ['Kế hoạch sắp tới', d.plansScheduled],
    ['Kế hoạch đã qua', d.plansPast],
    ['Kế hoạch đã hủy', d.plansCancelled],
    ['Lần xác nhận đã đi', d.visitsConfirmed],
    ['Yêu cầu hỗ trợ', d.supportTickets],
    ['Báo sai đã gửi', d.placeReports],
  ]
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map(([label, value]) => (
          <StatCard key={label} label={label} value={value.toLocaleString('vi-VN')} />
        ))}
      </div>
      <Panel title="Sự kiện gần đây (50 mục mới nhất)">
        {d.recentEvents.length === 0 ? (
          <p className="text-sm text-ink-muted">Chưa ghi nhận sự kiện nào.</p>
        ) : (
          <ul className="divide-y divide-line text-sm">
            {d.recentEvents.map((e, i) => (
              <li key={`${e.occurredAt}-${i}`} className="flex flex-wrap items-baseline justify-between gap-2 py-2">
                <span>
                  <span className="font-medium">{EVENT_LABELS[e.name] ?? e.name}</span>
                  {e.objectId && <span className="ml-2 font-mono text-[12px] text-ink-muted">{e.objectId}</span>}
                </span>
                <span className="text-[13px] text-ink-muted tabular">
                  {formatDateTime(e.occurredAt)}
                  {e.platform && ` · ${e.platform === 'WEB_MOBILE' ? 'Điện thoại' : e.platform === 'WEB_DESKTOP' ? 'Máy tính' : e.platform}`}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Panel>
      <p className="text-[13px] text-ink-muted">Không hiển thị ghi chú kế hoạch, nội dung tin nhắn hỗ trợ hay mô tả báo sai của người dùng.</p>
    </div>
  )
}

/** Rút gọn user agent thành "Chrome · Windows" cho dễ đọc; giữ chuỗi gốc trong title. */
function deviceOf(ua: string | null | undefined) {
  if (!ua) return 'Không rõ thiết bị'
  const browser = /Edg\//.test(ua) ? 'Edge' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Trình duyệt khác'
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : ''
  return os ? `${browser} · ${os}` : browser
}

function SessionsTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(0)
  const s = useAdminUserSessions(userId, page)
  if (s.isPending) return <LoadingState />
  if (s.isError) return <ErrorState error={s.error} onRetry={() => s.refetch()} />
  return (
    <>
      <Table
        head={
          <tr>
            <th className={th}>Đăng nhập lúc</th>
            <th className={th}>Thiết bị</th>
            <th className={th}>IP</th>
            <th className={th}>Hoạt động gần nhất</th>
            <th className={th}>Trạng thái</th>
          </tr>
        }
        empty={s.data.items.length === 0 ? <EmptyState title="Chưa có phiên đăng nhập nào" /> : undefined}
      >
        {s.data.items.map((x) => (
          <tr key={x.id}>
            <td className={`${td} whitespace-nowrap`}>{formatDateTime(x.createdAt)}</td>
            <td className={td} title={x.userAgent ?? undefined}>
              {deviceOf(x.userAgent)}
            </td>
            <td className={`${td} font-mono text-[13px]`}>{x.ipAddress ?? '—'}</td>
            <td className={`${td} whitespace-nowrap text-ink-muted`}>{x.lastSeenAt ? formatRelative(x.lastSeenAt) : '—'}</td>
            <td className={td}>
              {x.active ? (
                <Badge tone="success">Đang mở</Badge>
              ) : x.revokedAt ? (
                <Badge tone="muted">Đã đăng xuất {formatRelative(x.revokedAt)}</Badge>
              ) : (
                <Badge tone="muted">Hết hạn</Badge>
              )}
            </td>
          </tr>
        ))}
      </Table>
      <Pagination page={s.data.page} onChange={setPage} />
    </>
  )
}

function UserAuditTab({ userId }: { userId: string }) {
  const [page, setPage] = useState(0)
  const logs = useAuditLogs({ objectType: 'app_user', objectId: userId, page, size: 20 })
  if (logs.isPending) return <LoadingState />
  if (logs.isError) return <ErrorState error={logs.error} onRetry={() => logs.refetch()} />
  return (
    <>
      <AuditTable items={logs.data.items} />
      <Pagination page={logs.data.page} onChange={setPage} />
    </>
  )
}
