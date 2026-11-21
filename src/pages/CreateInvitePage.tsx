import { useEffect, useState } from 'react'
import { Link, useBlocker, useSearchParams } from 'react-router'
import { CircleCheck } from 'lucide-react'
import type { Schemas } from '../api/client.ts'
import { problemMessage } from '../api/problem.ts'
import { useSavedList, useSavedLists } from '../hooks/saved.ts'
import { useCreateChoiceSession } from '../hooks/choice.ts'
import { useIdempotencyKey } from '../lib/idempotency.ts'
import { priceForTwo } from '../lib/format.ts'
import { ShareLinkPanel } from '../components/choice/ShareLinkPanel.tsx'
import { InviteListPicker, MIN_INVITE_PLACES, canInviteFrom } from '../components/choice/InviteEntry.tsx'
import { ConfirmDialog } from '../components/ui/Dialog.tsx'
import { ButtonLink, PrimaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'

const MIN = 2
const MAX = 5

/** S-09 Tạo lời mời cùng chọn — FR-10, RULE-08 (2–5 nơi đã lưu). */
export function CreateInvitePage() {
  const [params] = useSearchParams()
  const listId = params.get('listId') ?? ''
  const list = useSavedList(listId)

  if (!listId) return <PickList />
  if (list.isPending) return <Skeleton className="h-64" />
  if (list.isError) return <ErrorState error={list.error} onRetry={() => list.refetch()} />
  return <CreateInvite list={list.data} />
}

/** Chưa chọn danh sách: hiện luôn các danh sách để chọn thay vì bắt quay về Đã lưu. */
function PickList() {
  const lists = useSavedLists()
  return (
    <>
      <h1 className="text-2xl font-bold">Mời người ấy cùng chọn</h1>
      <p className="mt-1 text-ink-muted">
        Lời mời gửi 2–5 nơi trong một danh sách đã lưu. Chọn danh sách có ít nhất {MIN_INVITE_PLACES} địa điểm.
      </p>
      <div className="mt-5">
        {lists.isPending ? (
          <Skeleton className="h-40" />
        ) : lists.isError ? (
          <ErrorState error={lists.error} onRetry={() => lists.refetch()} />
        ) : lists.data.length === 0 ? (
          <EmptyState title="Bạn chưa lưu địa điểm nào" action={<ButtonLink to="/">Khám phá địa điểm</ButtonLink>}>
            Bấm biểu tượng trái tim trên thẻ địa điểm để lưu ít nhất {MIN_INVITE_PLACES} nơi vào một danh sách, rồi quay lại đây.
          </EmptyState>
        ) : (
          <>
            <InviteListPicker lists={lists.data} />
            {!lists.data.some(canInviteFrom) && (
              <p className="mt-3 text-sm text-attention">Chưa danh sách nào đủ {MIN_INVITE_PLACES} nơi. Lưu thêm địa điểm rồi quay lại.</p>
            )}
          </>
        )}
      </div>
    </>
  )
}

function CreateInvite({ list }: { list: Schemas['SavedListDetail'] }) {
  const available = list.items.filter((i) => i.available).map((i) => i.place)
  const [selected, setSelected] = useState<string[]>(() => (available.length <= MAX ? available.map((p) => p.id) : []))
  const create = useCreateChoiceSession()
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

  const valid = selected.length >= MIN && selected.length <= MAX

  if (create.isSuccess) {
    const s = create.data
    return (
      <div className="mx-auto max-w-2xl">
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <CircleCheck className="text-success" aria-hidden="true" /> Đã tạo lời mời
        </h1>
        <p className="mt-1 text-ink-muted">Gửi liên kết này cho người ấy. Liên kết chỉ hiển thị một lần ở đây.</p>
        <div className="mt-5 rounded-block border border-line bg-white p-4">
          <ShareLinkPanel url={s.shareGrant.inviteUrl} expiresAt={s.shareGrant.expiresAt} onShared={() => setCopiedOrLeft(true)} />
        </div>
        <div className="mt-5">
          <ButtonLink to={`/choice/${s.id}`} onClick={() => setCopiedOrLeft(true)}>
            Xem phiên cùng chọn
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
      <p className="text-sm text-ink-muted">
        Từ danh sách{' '}
        <Link to={`/saved/${list.id}`} className="text-action hover:underline">
          {list.name}
        </Link>
      </p>
      <h1 className="mt-1 text-2xl font-bold">Mời người ấy cùng chọn</h1>
      <p className="mt-1 text-ink-muted">Chọn 2–5 nơi. Người ấy và bạn cùng bấm Thích hoặc Bỏ qua từng nơi, sau đó bạn chọn nơi cuối cùng.</p>

      <form
        className="mt-5"
        onSubmit={(e) => {
          e.preventDefault()
          if (valid) create.mutate({ placeIds: selected, idempotencyKey: idem.get() })
        }}
      >
        <fieldset>
          <legend className="sr-only">Địa điểm gửi cho người ấy</legend>
          <ul className="flex flex-col gap-2">
            {available.map((p) => {
              const checked = selected.includes(p.id)
              return (
                <li key={p.id}>
                  <label className="flex min-h-14 cursor-pointer items-center gap-3 rounded-block border border-line bg-white px-4 py-3 has-checked:border-action has-checked:bg-action-soft">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        idem.reset()
                        setSelected((s) => (checked ? s.filter((x) => x !== p.id) : [...s, p.id]))
                      }}
                      className="size-5 accent-action"
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{p.name}</span>
                      <span className="text-[13px] text-ink-muted">
                        {p.areaName ?? 'Chưa có thông tin khu vực'} · {priceForTwo(p.price) ?? 'Chưa có thông tin giá'}
                      </span>
                    </span>
                  </label>
                </li>
              )
            })}
          </ul>
        </fieldset>

        <div className="sticky bottom-[calc(64px+env(safe-area-inset-bottom))] mt-4 flex flex-wrap items-center gap-3 rounded-block border border-line bg-white p-3 shadow-raised md:bottom-4">
          <p className={`flex-1 text-sm tabular ${valid ? '' : 'text-attention'}`} aria-live="polite">
            Đã chọn {selected.length}/{MAX}
            {!valid && ' · Hãy chọn từ 2 đến 5 địa điểm'}
          </p>
          <PrimaryButton type="submit" disabled={!valid} pending={create.isPending}>
            Tạo lời mời
          </PrimaryButton>
        </div>
        {create.isError && (
          <p role="alert" className="mt-3 rounded-control bg-danger-soft px-3.5 py-3 text-sm text-danger">
            {problemMessage(create.error)}
          </p>
        )}
      </form>
    </div>
  )
}
