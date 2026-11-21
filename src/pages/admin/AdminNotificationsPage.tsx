import { useState } from 'react'
import { Link } from 'react-router'
import { Send } from 'lucide-react'
import { adminProblemMessage } from '../../api/problem.ts'
import { useAdminUsers } from '../../hooks/admin.ts'
import { useSendNotification, useSentNotifications } from '../../hooks/adminSupport.ts'
import { PageHeader, Pagination, Panel, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { ConfirmDialog } from '../../components/ui/Dialog.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

const MAX = 500

/** Gửi thông báo vào hộp thư trong web (chuông thông báo) cho mọi thành viên hoặc một người. */
export function AdminNotificationsPage() {
  return (
    <>
      <PageHeader title="Gửi thông báo" description="Thông báo hiện ở chuông thông báo của người dùng khi họ đăng nhập. Không gửi email." />
      <div className="grid gap-4 xl:grid-cols-[420px_1fr]">
        <Composer />
        <History />
      </div>
    </>
  )
}

function Composer() {
  const send = useSendNotification()
  const toast = useToast()
  const [summary, setSummary] = useState('')
  const [target, setTarget] = useState<'ALL' | 'USER'>('ALL')
  const [q, setQ] = useState('')
  const [search, setSearch] = useState('')
  const [user, setUser] = useState<{ id: string; label: string } | null>(null)
  const [confirm, setConfirm] = useState(false)
  const users = useAdminUsers({ q: search || undefined, page: 0 }, { enabled: target === 'USER' && !!search })
  const ready = summary.trim().length > 0 && (target === 'ALL' || !!user)

  const submit = () =>
    send.mutate(
      { summary: summary.trim(), target, userId: target === 'USER' ? user!.id : undefined },
      {
        onSuccess: (r) => {
          toast.show(`Đã gửi cho ${r.recipients} người`)
          setSummary('')
          setConfirm(false)
        },
        onError: () => setConfirm(false),
      },
    )

  return (
    <Panel title="Soạn thông báo">
      <div className="flex flex-col gap-4">
        <fieldset className="flex flex-col gap-2 text-sm">
          <legend className="mb-1 font-semibold">Gửi tới</legend>
          <label className="flex items-center gap-2">
            <input type="radio" name="target" checked={target === 'ALL'} onChange={() => setTarget('ALL')} /> Tất cả thành viên đang hoạt động
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="target" checked={target === 'USER'} onChange={() => setTarget('USER')} /> Một người
          </label>
        </fieldset>

        {target === 'USER' && (
          <div className="flex flex-col gap-2">
            {user ? (
              <p className="flex items-center justify-between gap-2 rounded-control bg-action-soft px-3 py-2 text-sm">
                <span>
                  Người nhận: <b>{user.label}</b>
                </span>
                <button type="button" className="text-action underline" onClick={() => setUser(null)}>
                  Đổi
                </button>
              </p>
            ) : (
              <>
                <form
                  className="flex items-end gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    setSearch(q.trim())
                  }}
                >
                  <Field.Root className="flex-1">
                    <Field.Label>Tìm người nhận</Field.Label>
                    <Field.Input value={q} placeholder="Email hoặc tên" onChange={(e) => setQ(e.target.value)} />
                  </Field.Root>
                  <SecondaryButton type="submit">Tìm</SecondaryButton>
                </form>
                {users.data && (
                  <ul className="flex flex-col divide-y divide-line rounded-control border border-line text-sm">
                    {users.data.items.length === 0 && <li className="px-3 py-2 text-ink-muted">Không tìm thấy</li>}
                    {users.data.items.slice(0, 8).map((u) => (
                      <li key={u.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left hover:bg-page disabled:opacity-50"
                          disabled={u.status !== 'ACTIVE'}
                          onClick={() => setUser({ id: u.id, label: `${u.displayName ?? ''} <${u.email}>`.trim() })}
                        >
                          {u.displayName ?? '—'} <span className="text-ink-muted">{u.email}</span>
                          {u.status !== 'ACTIVE' && <span className="ml-2 text-[12px] text-ink-muted">(đã khóa)</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </div>
        )}

        <Field.Root hint>
          <Field.Label>Nội dung</Field.Label>
          <Field.Hint>
            {summary.length}/{MAX} ký tự. Viết ngắn gọn; người dùng đọc trong danh sách thông báo.
          </Field.Hint>
          <Field.Textarea rows={4} maxLength={MAX} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </Field.Root>
        {send.error && <p role="alert" className="text-sm text-danger">{adminProblemMessage(send.error)}</p>}
        <PrimaryButton icon={<Send size={16} aria-hidden="true" />} disabled={!ready} onClick={() => setConfirm(true)}>
          Gửi thông báo
        </PrimaryButton>
      </div>
      <ConfirmDialog
        open={confirm}
        onClose={() => setConfirm(false)}
        onConfirm={submit}
        pending={send.isPending}
        tone="primary"
        title="Gửi thông báo?"
        description={target === 'ALL' ? 'Mọi thành viên đang hoạt động sẽ nhận thông báo này. Không thu hồi được.' : `Gửi cho ${user?.label}. Không thu hồi được.`}
        confirmLabel="Gửi"
      />
    </Panel>
  )
}

function History() {
  const [page, setPage] = useState(0)
  const sent = useSentNotifications(page)
  return (
    <Panel title="Đã gửi">
      {sent.isPending ? (
        <LoadingState />
      ) : sent.isError ? (
        <ErrorState error={sent.error} onRetry={() => sent.refetch()} />
      ) : (
        <>
          <Table
            head={
              <tr>
                <th className={th}>Thời điểm</th>
                <th className={th}>Nội dung</th>
                <th className={th}>Gửi tới</th>
                <th className={th}>Số người nhận</th>
              </tr>
            }
            empty={sent.data.items.length === 0 ? <EmptyState title="Chưa gửi thông báo nào" /> : undefined}
          >
            {sent.data.items.map((n, i) => (
              <tr key={`${n.sentAt}-${i}`}>
                <td className={`${td} whitespace-nowrap`}>{formatDateTime(n.sentAt)}</td>
                <td className={td}>{n.summary}</td>
                <td className={td}>
                  {n.target === 'ALL' ? (
                    <Badge tone="action">Tất cả</Badge>
                  ) : n.userId ? (
                    <Link to={`/admin/users/${n.userId}`} className="text-action hover:underline">
                      Một người
                    </Link>
                  ) : (
                    'Một người'
                  )}
                </td>
                <td className={`${td} tabular`}>{n.recipients}</td>
              </tr>
            ))}
          </Table>
          <Pagination page={sent.data.page} onChange={setPage} />
        </>
      )}
    </Panel>
  )
}
