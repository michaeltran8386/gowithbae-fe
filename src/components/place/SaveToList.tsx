import { useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Check, Plus } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { loginHref, useAuth } from '../../app/auth.tsx'
import { nextListName, useCart } from '../../app/cart.tsx'
import { fieldErrors, problemMessage } from '../../api/problem.ts'
import { useSavedList, useSavedListMutations, useSavedLists } from '../../hooks/saved.ts'
import { Dialog } from '../ui/Dialog.tsx'
import { Field } from '../ui/Field.tsx'
import { Heart } from '../ui/Heart.tsx'
import { GhostButton, IconButton, PrimaryButton } from '../ui/Button.tsx'
import { LoadingState } from '../ui/StateView.tsx'
import { useToast } from '../ui/Toast.tsx'

type Place = Pick<Schemas['PlaceCard'], 'id' | 'name'> & { coverUrl?: string | null }

/** Danh sách "Đã lưu" (nút tim) và trạng thái đã lưu của từng nơi — CR-002. */
export function useDefaultList(enabled: boolean) {
  const lists = useSavedLists(enabled)
  const def = lists.data?.find((l) => l.isDefault)
  const detail = useSavedList(def?.id ?? '', enabled && !!def)
  const savedIds = new Set(detail.data?.items.map((i) => i.place.id))
  return { list: def, isSaved: (placeId: string) => savedIds.has(placeId) }
}

/**
 * Danh sách nút "+" sẽ thêm vào: danh sách đang chọn nếu còn tồn tại, nếu không thì danh sách thường mới nhất.
 * Trả null khi chưa có danh sách thường nào (lần bấm "+" đầu tiên sẽ tạo "Danh sách 1").
 */
export function resolveActiveList(lists: Schemas['SavedListSummary'][] | undefined, activeId: string | null) {
  if (!lists) return null
  return lists.find((l) => l.id === activeId) ?? lists.find((l) => !l.isDefault) ?? null
}

/** Nút tim: 1 chạm lưu vào / bỏ khỏi "Đã lưu". Khách chưa đăng nhập → đăng nhập rồi quay lại (UX-06). */
export function SaveButton({ placeId, placeName, variant = 'icon' }: { placeId: string; placeName: string; variant?: 'icon' | 'labelled' }) {
  const { state } = useAuth()
  const member = state.status === 'member'
  const navigate = useNavigate()
  const location = useLocation()
  const { list, isSaved } = useDefaultList(member)
  const { addPlace, removePlace } = useSavedListMutations()
  const { actions } = useCart()
  const toast = useToast()
  const [pop, setPop] = useState(false)
  const saved = member && isSaved(placeId)
  const busy = addPlace.isPending || removePlace.isPending

  const toggle = () => {
    if (!member) {
      navigate(loginHref(location.pathname, 'save'))
      return
    }
    if (!list) return
    const vars = { listId: list.id, placeId, alreadySaved: saved }
    const onError = (e: unknown) => toast.show(problemMessage(e), { tone: 'error' })
    if (saved) {
      removePlace.mutate(vars, {
        onSuccess: () => toast.show(`Đã bỏ “${placeName}” khỏi Đã lưu`, { action: { label: 'Hoàn tác', onClick: () => addPlace.mutate(vars) } }),
        onError,
      })
    } else {
      setPop(true)
      actions.bumpDock()
      addPlace.mutate(vars, { onSuccess: () => toast.show(`Đã lưu “${placeName}”`), onError })
    }
  }

  const heart = <Heart filled={saved} className={pop ? 'animate-heart-pop' : ''} />
  return variant === 'icon' ? (
    <IconButton
      label={saved ? `Bỏ lưu ${placeName}` : `Lưu ${placeName}`}
      aria-pressed={saved}
      onClick={toggle}
      disabled={busy || (member && !list)}
      onAnimationEnd={() => setPop(false)}
      className="bg-white/95 shadow-sm"
    >
      {heart}
    </IconButton>
  ) : (
    <GhostButton aria-pressed={saved} onClick={toggle} disabled={busy} icon={heart} className="border border-line bg-white" onAnimationEnd={() => setPop(false)}>
      {saved ? 'Đã lưu' : 'Lưu'}
    </GhostButton>
  )
}

/**
 * Nút "+": thêm nơi vào danh sách đang chọn và cho ảnh bay vào icon list ở mép phải (CR-002).
 * Chưa có danh sách thường nào thì tự tạo "Danh sách 1".
 */
export function AddToListButton({ place, className = '' }: { place: Place; className?: string }) {
  const { state } = useAuth()
  const member = state.status === 'member'
  const navigate = useNavigate()
  const location = useLocation()
  const lists = useSavedLists(member)
  const { addPlace, removePlace, create } = useSavedListMutations()
  const cart = useCart()
  const toast = useToast()
  const button = useRef<HTMLButtonElement>(null)
  const busy = addPlace.isPending || create.isPending

  const add = async () => {
    if (!member) {
      navigate(loginHref(location.pathname, 'add'))
      return
    }
    if (!lists.data) return
    // Bay ngay khi bấm để cảm giác tức thì; lỗi thì báo bằng toast.
    cart.actions.flyToDock(button.current, place.coverUrl)
    try {
      let target = resolveActiveList(lists.data, cart.state.activeListId)
      if (!target) {
        target = await create.mutateAsync(nextListName(lists.data))
      }
      if (target.id !== cart.state.activeListId) cart.actions.setActiveList(target.id)
      const listId = target.id
      await addPlace.mutateAsync({ listId, placeId: place.id, alreadySaved: false })
      toast.show(`Đã thêm “${place.name}” vào “${target.name}”`, {
        action: { label: 'Hoàn tác', onClick: () => removePlace.mutate({ listId, placeId: place.id }) },
      })
    } catch (e) {
      toast.show(problemMessage(e), { tone: 'error' })
    }
  }

  return (
    <IconButton
      ref={button}
      label={`Thêm ${place.name} vào danh sách`}
      onClick={() => void add()}
      disabled={busy}
      className={`bg-white/95 text-action shadow-sm ${className}`}
    >
      <Plus size={22} strokeWidth={2.5} aria-hidden="true" />
    </IconButton>
  )
}

export function SaveToListDialog({ placeId, placeName, onClose }: { placeId: string; placeName: string; onClose: () => void; returnTo?: string }) {
  const lists = useSavedLists()
  const { addPlace, create } = useSavedListMutations()
  const cart = useCart()
  const toast = useToast()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const save = async (listId: string, listName: string) => {
    try {
      await addPlace.mutateAsync({ listId, placeId, alreadySaved: false })
      toast.show(`Đã lưu vào “${listName}”`)
      onClose()
    } catch (e) {
      toast.show(problemMessage(e), { tone: 'error' })
    }
  }

  const createAndSave = async () => {
    setError(undefined)
    if (!newName.trim()) return setError('Hãy đặt tên danh sách')
    try {
      const list = await create.mutateAsync(newName.trim())
      cart.actions.setActiveList(list.id)
      await save(list.id, list.name)
    } catch (e) {
      setError(fieldErrors(e).name ?? problemMessage(e))
    }
  }

  return (
    <Dialog open onClose={onClose} title="Lưu vào danh sách" description={placeName}>
      {lists.isPending ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-2">
            {lists.data?.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  disabled={addPlace.isPending}
                  onClick={() => save(l.id, l.name)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-control border border-line px-4 text-left hover:border-action hover:bg-action-soft disabled:opacity-60"
                >
                  <span className="flex items-center gap-2 font-medium">
                    {l.isDefault && <Heart size={16} />}
                    {l.name}
                  </span>
                  <span className="text-[13px] text-ink-muted tabular">{l.placeCount} nơi</span>
                </button>
              </li>
            ))}
          </ul>
          {creating ? (
            <form
              className="mt-2 flex flex-col gap-3"
              onSubmit={(e) => {
                e.preventDefault()
                void createAndSave()
              }}
            >
              <Field.Root error={error}>
                <Field.Label>Tên danh sách mới</Field.Label>
                <Field.Input value={newName} onChange={(e) => setNewName(e.target.value)} maxLength={100} placeholder="vd. Cuối tuần này…" autoComplete="off" />
                <Field.Error />
              </Field.Root>
              <PrimaryButton type="submit" pending={create.isPending || addPlace.isPending} icon={<Check size={18} aria-hidden="true" />}>
                Tạo và lưu
              </PrimaryButton>
            </form>
          ) : (
            <GhostButton onClick={() => setCreating(true)} icon={<Plus size={18} aria-hidden="true" />} className="mt-1 justify-start">
              Danh sách mới
            </GhostButton>
          )}
        </div>
      )}
    </Dialog>
  )
}
