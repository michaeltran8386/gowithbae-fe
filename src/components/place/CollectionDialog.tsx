import { useCallback } from 'react'
import { useAuth } from '../../app/auth.tsx'
import { useCart } from '../../app/cart.tsx'
import { isStatus } from '../../api/problem.ts'
import { useCollection } from '../../hooks/places.ts'
import { useSavedLists } from '../../hooks/saved.ts'
import { ListIcon } from '../cart/CartIcons.tsx'
import { Dialog } from '../ui/Dialog.tsx'
import { EmptyState, ErrorState, Skeleton } from '../ui/StateView.tsx'
import { PlaceGrid } from './PlaceGrid.tsx'
import { resolveActiveList } from './SaveToList.tsx'

/**
 * Popup bộ sưu tập (feedback: không chuyển trang). Hiện các nơi của bộ sưu tập với tim và "+";
 * có thanh "đang thêm vào" ở đáy làm đích cho hiệu ứng bay, vì icon list nổi bị lớp phủ popup che.
 */
export function CollectionDialog({ collectionId, onClose }: { collectionId: string; onClose: () => void }) {
  const collection = useCollection(collectionId)
  const { state } = useAuth()
  const member = state.status === 'member'
  const c = collection.data

  return (
    <Dialog
      open
      size="xl"
      onClose={onClose}
      title={c?.title ?? 'Bộ sưu tập'}
      description={c?.body ? <span className="line-clamp-2">{c.body}</span> : undefined}
      footer={member ? <ActiveListBar /> : undefined}
    >
      {collection.isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-hidden="true">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : collection.isError ? (
        isStatus(collection.error, 404) ? (
          <EmptyState title="Bộ sưu tập không còn hiển thị" />
        ) : (
          <ErrorState error={collection.error} onRetry={() => collection.refetch()} />
        )
      ) : c?.places?.length ? (
        <>
          <h3 className="sr-only">Địa điểm trong bộ sưu tập</h3>
          <PlaceGrid places={c.places} />
        </>
      ) : (
        <EmptyState title="Bộ sưu tập chưa có địa điểm đang hiển thị" />
      )}
    </Dialog>
  )
}

/** Đích bay trong popup + chọn danh sách mà nút "+" sẽ thêm vào. */
function ActiveListBar() {
  const lists = useSavedLists()
  const cart = useCart()
  const active = resolveActiveList(lists.data, cart.state.activeListId)
  const registerDock = cart.actions.registerDock
  const target = useCallback((el: HTMLSpanElement | null) => registerDock(el), [registerDock])

  return (
    <div className="flex w-full items-center gap-3">
      <span ref={target} className="relative flex size-11 shrink-0 items-center justify-center rounded-full bg-action-soft text-action">
        <ListIcon size={22} />
        {active && active.placeCount > 0 && (
          <span aria-hidden="true" className="absolute -top-1 -left-1 min-w-5 rounded-full bg-attention px-1 text-center text-[11px] leading-5 font-bold text-white tabular">
            {active.placeCount > 99 ? '99+' : active.placeCount}
          </span>
        )}
      </span>
      <label className="flex min-w-0 flex-1 flex-col text-[13px] text-ink-muted sm:flex-row sm:items-center sm:gap-2">
        Nút + thêm vào
        {lists.data && lists.data.length > 0 ? (
          <select
            value={active?.id ?? ''}
            onChange={(e) => cart.actions.setActiveList(e.target.value)}
            className="min-h-11 min-w-0 rounded-control border border-line bg-white px-3 text-sm font-semibold text-ink sm:max-w-64"
          >
            {!active && <option value="">Danh sách 1 (tạo khi bấm +)</option>}
            {lists.data.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name} · {l.placeCount} nơi
              </option>
            ))}
          </select>
        ) : (
          <span className="font-semibold text-ink">Danh sách 1 (tạo khi bấm +)</span>
        )}
      </label>
    </div>
  )
}
