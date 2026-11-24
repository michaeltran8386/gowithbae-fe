import { useEffect, useState } from 'react'
import { Link, Navigate, useBlocker, useNavigate, useSearchParams } from 'react-router'
import { CircleCheck, Plus, RefreshCw } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { problemMessage } from '../api/problem.ts'
import { nextListName, useCart } from '../app/cart.tsx'
import { useSavedList, useSavedListMutations, useSavedLists } from '../hooks/saved.ts'
import { useCreateChoiceSession } from '../hooks/choice.ts'
import { useIdempotencyKey } from '../lib/idempotency.ts'
import { priceForTwo } from '../lib/format.ts'
import { ShareLinkPanel } from '../components/choice/ShareLinkPanel.tsx'
import { InviteListPicker, MIN_INVITE_PLACES } from '../components/choice/InviteEntry.tsx'
import { ConfirmDialog } from '../components/ui/Dialog.tsx'
import { ButtonLink, PrimaryButton, SecondaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'

/**
 * S-09 Rủ cùng chọn — FR-10, CR-002: lời mời gắn với một danh sách, không giới hạn số người được mời,
 * nơi thêm/bỏ sau này tự cập nhật cho người được mời.
 */
export function CreateInvitePage() {
  const [params] = useSearchParams()
  const listId = params.get('listId') ?? ''
  const list = useSavedList(listId)
  // Giữ mutation ở đây: tạo xong thì danh sách có phiên đang chạy, nhưng vẫn phải ở lại để hiện link (chỉ hiện 1 lần).
  const create = useCreateChoiceSession()

  if (!listId) return <PickList />
  if (list.isPending) return <Skeleton className="h-64" />
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />
  // Danh sách đã có phiên đang chạy: mở luôn phiên đó (link mời quản lý ở phần Chia sẻ).
  if (list.data.activeChoiceSessionId && create.isIdle) return <Navigate to={`/choice/${list.data.activeChoiceSessionId}`} replace />
  return <CreateInvite list={list.data} create={create} />
}

/** Chưa chọn danh sách: chọn danh sách có sẵn hoặc tạo danh sách mới ngay tại đây (feedback #11). */
function PickList() {
  const lists = useSavedLists()
  const { create } = useSavedListMutations()
  const cart = useCart()
  const navigate = useNavigate()
  const toast = useToast()

  const createList = () =>
    create.mutate(nextListName(lists.data ?? []), {
      onSuccess: (l) => {
        cart.actions.setActiveList(l.id)
        toast.show(`Đã tạo “${l.name}”. Bấm + trên địa điểm để thêm vào, rồi quay lại rủ cùng chọn.`)
        navigate('/')
      },
      onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
    })

  return (
    <div className="mx-auto max-w-2xl">
      <Steps current={1} />
      <h1 className="mt-3 text-2xl font-bold">Rủ cùng chọn</h1>
      <p className="mt-1 text-ink-muted">Chọn danh sách muốn gửi. Mời bao nhiêu người cũng được, nơi bạn thêm sau sẽ tự hiện cho họ.</p>
      <div className="mt-5">
        {lists.isPending ? (
          <Skeleton className="h-40" />
        ) : lists.isError ? (
          <ErrorState error={lists.error} onRetry={() => lists.refetch()} />
        ) : (
          <InviteListPicker lists={lists.data} />
        )}
      </div>
      <SecondaryButton className="mt-3 w-full" icon={<Plus size={18} aria-hidden="true" />} pending={create.isPending} onClick={createList}>
        Tạo danh sách mới
      </SecondaryButton>
    </div>
  )
}

/** Ba bước rõ ràng, mỗi màn một việc chính (tham khảo cảm giác "không phân vân"). */
function Steps({ current }: { current: 1 | 2 | 3 }) {
  const steps = ['Chọn danh sách', 'Gửi link', 'Cùng chọn & chốt']
  return (
    <ol className="flex items-center gap-2 text-[13px]" aria-label="Các bước">
      {steps.map((s, i) => {
        const n = i + 1
        const state = n < current ? 'done' : n === current ? 'now' : 'next'
        return (
          <li key={s} className="flex min-w-0 flex-1 items-center gap-1.5" aria-current={state === 'now' ? 'step' : undefined}>
            <span
              className={`flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-bold tabular ${
                state === 'next' ? 'bg-page text-ink-muted' : 'bg-action text-white'
              }`}
            >
              {state === 'done' ? '✓' : n}
            </span>
            <span className={`truncate ${state === 'now' ? 'font-semibold' : 'text-ink-muted'}`}>{s}</span>
          </li>
        )
      })}
    </ol>
  )
}

function CreateInvite({ list, create }: { list: Schemas['SavedListDetail']; create: ReturnType<typeof useCreateChoiceSession> }) {
  const available = list.items.filter((i) => i.available).map((i) => i.place)
  const idem = useIdempotencyKey()
  const [copiedOrLeft, setCopiedOrLeft] = useState(false)

  // Link chỉ hiển thị một lần → cảnh báo khi rời trang (UX-11)
  const blocker = useBlocker(({ currentLocation, nextLocation }) => create.isSuccess && !copiedOrLeft && currentLocation.pathname !== nextLocation.pathname)
  useEffect(() => {
    if (!create.isSuccess || copiedOrLeft) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [create.isSuccess, copiedOrLeft])

  if (create.isSuccess) {
    const s = create.data
    return (
      <div className="mx-auto max-w-2xl">
        <Steps current={2} />
        <h1 className="mt-3 flex items-center gap-2 text-2xl font-bold">
          <CircleCheck className="text-success" aria-hidden="true" /> Đã tạo lời mời
        </h1>
        <p className="mt-1 text-ink-muted">Gửi liên kết này cho mọi người muốn rủ (không giới hạn số người). Liên kết chỉ hiển thị một lần ở đây.</p>
        <div className="mt-5 rounded-block border border-line bg-white p-4">
          <ShareLinkPanel url={s.shareGrant.inviteUrl} expiresAt={s.shareGrant.expiresAt} onShared={() => setCopiedOrLeft(true)} />
        </div>
        <div className="mt-5">
          <ButtonLink to={`/choice/${s.id}`} onClick={() => setCopiedOrLeft(true)}>
            Bắt đầu cùng chọn
          </ButtonLink>
        </div>
        <ConfirmDialog
          open={blocker.state === 'blocked'}
          onClose={() => blocker.reset?.()}
          onConfirm={() => blocker.proceed?.()}
          tone="primary"
          title="Rời trang khi chưa sao chép liên kết?"
          description="Liên kết sẽ không hiển thị lại. Nếu mất, bạn có thể cấp liên kết mới trong phiên cùng chọn."
          confirmLabel="Rời trang"
        />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Steps current={1} />
      <p className="mt-3 text-sm text-ink-muted">
        Từ danh sách{' '}
        <Link to={`/saved/${list.id}`} className="text-action hover:underline">
          {list.name}
        </Link>
      </p>
      <h1 className="mt-1 text-2xl font-bold">Rủ cùng chọn</h1>
      <p className="mt-1 flex items-start gap-1.5 text-ink-muted">
        <RefreshCw size={16} className="mt-1 shrink-0" aria-hidden="true" />
        Mọi người bấm Thích hoặc Bỏ qua từng nơi, bạn chốt nơi đi. Nơi bạn thêm vào danh sách sau này sẽ tự hiện cho họ.
      </p>

      {available.length < MIN_INVITE_PLACES ? (
        <div className="mt-5">
          <EmptyState title="Danh sách chưa có địa điểm nào" action={<ButtonLink to="/">Khám phá địa điểm</ButtonLink>}>
            Bấm + trên thẻ địa điểm để thêm vào danh sách, rồi quay lại đây.
          </EmptyState>
        </div>
      ) : (
        <>
          <h2 className="mt-5 text-[15px] font-semibold tabular">{available.length} nơi sẽ được gửi</h2>
          <ul className="mt-2 flex flex-col gap-2">
            {available.map((p) => (
              <li key={p.id} className="flex min-h-14 items-center gap-3 rounded-block border border-line bg-white px-4 py-3">
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold">{p.name}</span>
                  <span className="text-[13px] text-ink-muted">
                    {p.areaName ?? 'Chưa có thông tin khu vực'} · {priceForTwo(p.price) ?? 'Chưa có thông tin giá'}
                  </span>
                </span>
              </li>
            ))}
          </ul>
          <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] mt-4 rounded-block border border-line bg-white p-3 shadow-raised md:bottom-4">
            <PrimaryButton
              className="w-full"
              pending={create.isPending}
              onClick={() => create.mutate({ listId: list.id, idempotencyKey: idem.get() })}
            >
              Tạo link mời
            </PrimaryButton>
          </div>
          {create.isError && (
            <p role="alert" className="mt-3 rounded-control bg-danger-soft px-3 py-3 text-sm text-danger">
              {problemMessage(create.error)}
            </p>
          )}
        </>
      )}
    </div>
  )
}
