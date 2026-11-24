import { useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Pencil, Trash2, Users } from 'lucide-react'
import { isStatus, problemMessage } from '../api/problem.ts'
import { useSavedList, useSavedListMutations } from '../hooks/saved.ts'
import { PlaceCard } from '../components/place/PlaceCard.tsx'
import { ConfirmDialog } from '../components/ui/Dialog.tsx'
import { ButtonLink, GhostButton } from '../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { useToast } from '../components/ui/Toast.tsx'
import { ListNameDialog } from './SavedListsPage.tsx'
import { MIN_INVITE_PLACES, inviteHref } from '../components/choice/InviteEntry.tsx'
import { NotFoundPage } from './NotFoundPage.tsx'

/** S-08 Chi tiết danh sách — FR-09, điểm bắt đầu mời cùng chọn FR-10. */
export function SavedListPage() {
  const { listId = '' } = useParams()
  const list = useSavedList(listId)
  const { remove, removePlace, addPlace } = useSavedListMutations()
  const toast = useToast()
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (list.isPending) return <Skeleton className="h-64" />
  if (list.isError) return isStatus(list.error, 404) ? <NotFoundPage title="Không tìm thấy danh sách" /> : <ErrorState error={list.error} onRetry={() => list.refetch()} />

  const l = list.data
  const available = l.items.filter((i) => i.available)
  const canInvite = available.length >= MIN_INVITE_PLACES

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold break-words md:text-3xl">{l.name}</h1>
          <p className="mt-1 text-ink-muted tabular">{l.items.length} địa điểm</p>
        </div>
        {!l.isDefault && (
        <div className="flex gap-1">
          <GhostButton icon={<Pencil size={16} aria-hidden="true" />} onClick={() => setRenaming(true)}>
            Đổi tên
          </GhostButton>
          <GhostButton icon={<Trash2 size={16} aria-hidden="true" />} onClick={() => setDeleting(true)} className="text-danger hover:text-danger">
            Xóa
          </GhostButton>
        </div>
        )}
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-block border border-sky-100 bg-action-soft p-4 md:flex-row md:items-center">
        <p className="flex-1 text-sm">
          {l.activeChoiceSessionId ? (
            <>
              <span className="font-semibold">Đang cùng chọn từ danh sách này.</span> Nơi bạn thêm hoặc bỏ sẽ tự cập nhật cho mọi người được mời.
            </>
          ) : (
            <>
              <span className="font-semibold">Chưa chốt được nơi nào?</span> Gửi link cho bao nhiêu người cũng được. Nơi bạn thêm sau sẽ tự cập nhật cho họ.
            </>
          )}
        </p>
        {canInvite ? (
          <ButtonLink to={inviteHref(l)} icon={<Users size={18} aria-hidden="true" />}>
            {l.activeChoiceSessionId ? 'Xem phiên cùng chọn' : 'Rủ cùng chọn'}
          </ButtonLink>
        ) : (
          <p className="text-[13px] text-ink-muted">Thêm ít nhất 1 địa điểm đang hiển thị để rủ cùng chọn.</p>
        )}
      </div>

      <h2 className="sr-only">Địa điểm trong danh sách</h2>
      <div className="mt-6">
        {l.items.length === 0 ? (
          <EmptyState title="Danh sách đang trống" action={<ButtonLink to="/">Khám phá địa điểm</ButtonLink>}>
            {l.isDefault ? 'Bấm trái tim trên thẻ địa điểm để lưu vào đây.' : 'Bấm + trên thẻ địa điểm để thêm vào đây.'}
          </EmptyState>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {l.items.map(({ place, available: isAvailable }) => (
              <li key={place.id} className="flex">
                <PlaceCard.Root place={place} muted={!isAvailable} className="w-full">
                  <PlaceCard.Media />
                  <PlaceCard.Body>
                    {isAvailable ? <PlaceCard.Title /> : <h3 className="text-[17px] font-semibold">{place.name}</h3>}
                    {!isAvailable && <Badge tone="attention">Không còn hiển thị, không chọn được cho kế hoạch mới</Badge>}
                    <PlaceCard.Meta />
                    <PlaceCard.Price />
                    <PlaceCard.Actions>
                      <GhostButton
                        className="border border-line"
                        disabled={removePlace.isPending}
                        onClick={() =>
                          removePlace.mutate(
                            { listId: l.id, placeId: place.id },
                            {
                              onSuccess: () =>
                                toast.show(`Đã bỏ “${place.name}” khỏi danh sách`, {
                                  action: isAvailable ? { label: 'Hoàn tác', onClick: () => addPlace.mutate({ listId: l.id, placeId: place.id, alreadySaved: true }) } : undefined,
                                }),
                              onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
                            },
                          )
                        }
                      >
                        Bỏ khỏi danh sách<span className="sr-only"> {place.name}</span>
                      </GhostButton>
                    </PlaceCard.Actions>
                  </PlaceCard.Body>
                </PlaceCard.Root>
              </li>
            ))}
          </ul>
        )}
      </div>

      {renaming && <ListNameDialog listId={l.id} initialName={l.name} onClose={() => setRenaming(false)} />}
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title={`Xóa danh sách “${l.name}”?`}
        description="Các địa điểm và kế hoạch buổi hẹn của bạn không bị xóa. Thao tác này không hoàn tác được."
        confirmLabel="Xóa danh sách"
        pending={remove.isPending}
        onConfirm={() =>
          remove.mutate(l.id, {
            onSuccess: () => {
              toast.show('Đã xóa danh sách')
              navigate('/saved', { replace: true })
            },
            onError: (e) => toast.show(problemMessage(e), { tone: 'error' }),
          })
        }
      />
    </>
  )
}
