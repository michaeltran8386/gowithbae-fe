import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { Check, Plus } from 'lucide-react'
import { loginHref, useAuth } from '../../app/auth.tsx'
import { fieldErrors, problemMessage } from '../../api/problem.ts'
import { useSavedListMutations, useSavedLists } from '../../hooks/saved.ts'
import { Dialog } from '../ui/Dialog.tsx'
import { Field } from '../ui/Field.tsx'
import { Heart } from '../ui/Heart.tsx'
import { GhostButton, IconButton, PrimaryButton } from '../ui/Button.tsx'
import { LoadingState } from '../ui/StateView.tsx'
import { useToast } from '../ui/Toast.tsx'

/** Nút Lưu (tim). Khách chưa đăng nhập → đăng nhập kèm intent, quay lại mở dialog (AC-056, UX-06). */
export function SaveButton({ placeId, placeName, variant = 'icon' }: { placeId: string; placeName: string; variant?: 'icon' | 'labelled' }) {
  const { state } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [open, setOpen] = useState(false)

  const start = () => {
    if (state.status !== 'member') {
      navigate(loginHref(`/places/${placeId}`, 'save'))
      return
    }
    setOpen(true)
  }

  return (
    <>
      {variant === 'icon' ? (
        <IconButton label={`Lưu ${placeName}`} onClick={start} className="bg-white/95 shadow-sm">
          <Heart filled={false} />
        </IconButton>
      ) : (
        <GhostButton onClick={start} icon={<Heart filled={false} />} className="border border-line bg-white">
          Lưu
        </GhostButton>
      )}
      {open && <SaveToListDialog placeId={placeId} placeName={placeName} onClose={() => setOpen(false)} returnTo={location.pathname} />}
    </>
  )
}

export function SaveToListDialog({ placeId, placeName, onClose }: { placeId: string; placeName: string; onClose: () => void; returnTo?: string }) {
  const lists = useSavedLists()
  const { addPlace, create } = useSavedListMutations()
  const toast = useToast()
  const [newName, setNewName] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | undefined>()

  const save = async (listId: string, listName: string, placeCount: number) => {
    try {
      await addPlace.mutateAsync({ listId, placeId, alreadySaved: false })
      // UX-15 (đã duyệt): gợi ý cùng chọn khi danh sách còn ít hơn 2 nơi
      toast.show(
        placeCount + 1 < 2 ? `Đã lưu vào “${listName}”. Lưu thêm nơi để mời người ấy cùng chọn.` : `Đã lưu vào “${listName}”`,
      )
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
      await save(list.id, list.name, 0)
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
          {lists.data?.length === 0 && <p className="text-sm text-ink-muted">Bạn chưa có danh sách nào. Tạo danh sách đầu tiên bên dưới.</p>}
          <ul className="flex flex-col gap-2">
            {lists.data?.map((l) => (
              <li key={l.id}>
                <button
                  type="button"
                  disabled={addPlace.isPending}
                  onClick={() => save(l.id, l.name, l.placeCount)}
                  className="flex min-h-12 w-full items-center justify-between gap-3 rounded-control border border-line px-4 text-left hover:border-action hover:bg-action-soft disabled:opacity-60"
                >
                  <span className="font-medium">{l.name}</span>
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
