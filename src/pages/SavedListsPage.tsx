import { useState } from 'react'
import { Link } from 'react-router'
import { ChevronRight, Plus } from 'lucide-react'
import { fieldErrors, problemMessage } from '../api/problem.ts'
import { useSavedListMutations, useSavedLists } from '../hooks/saved.ts'
import { Dialog } from '../components/ui/Dialog.tsx'
import { Field } from '../components/ui/Field.tsx'
import { ButtonLink, GhostButton, PrimaryButton } from '../components/ui/Button.tsx'
import { EmptyState, ErrorState, Skeleton } from '../components/ui/StateView.tsx'
import { Heart } from '../components/ui/Heart.tsx'

/** S-07 Đã lưu — FR-09: danh sách riêng tư của thành viên. */
export function SavedListsPage() {
  const lists = useSavedLists()
  const [creating, setCreating] = useState(false)

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold md:text-3xl">Đã lưu</h1>
        <PrimaryButton icon={<Plus size={18} aria-hidden="true" />} onClick={() => setCreating(true)}>
          Danh sách mới
        </PrimaryButton>
      </div>
      <p className="mt-1 text-ink-muted">Chỉ bạn thấy các danh sách này.</p>

      <div className="mt-6">
        {lists.isPending ? (
          <Skeleton className="h-40" />
        ) : lists.isError ? (
          <ErrorState error={lists.error} onRetry={() => lists.refetch()} />
        ) : lists.data.length === 0 ? (
          <EmptyState icon={<Heart filled={false} size={36} />} title="Bạn chưa lưu địa điểm nào" action={<ButtonLink to="/">Khám phá địa điểm</ButtonLink>}>
            Bấm biểu tượng trái tim trên thẻ địa điểm để lưu vào danh sách.
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-2">
            {lists.data.map((l) => (
              <li key={l.id}>
                <Link to={`/saved/${l.id}`} className="flex min-h-16 items-center gap-3 rounded-block border border-line bg-white px-4 py-3 hover:border-action">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-control bg-peach-50">
                    <Heart size={20} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-semibold">{l.name}</span>
                    <span className="text-[13px] text-ink-muted tabular">{l.placeCount} địa điểm</span>
                  </span>
                  <ChevronRight size={18} className="text-ink-muted" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
      {creating && <ListNameDialog onClose={() => setCreating(false)} />}
    </>
  )
}

export function ListNameDialog({ listId, initialName = '', onClose }: { listId?: string; initialName?: string; onClose: () => void }) {
  const { create, rename } = useSavedListMutations()
  const mutation = listId ? rename : create
  const [name, setName] = useState(initialName)
  const [error, setError] = useState<string>()

  const submit = () => {
    if (!name.trim()) return setError('Hãy đặt tên danh sách')
    const onError = (e: unknown) => setError(fieldErrors(e).name ?? problemMessage(e))
    if (listId) rename.mutate({ listId, name: name.trim() }, { onSuccess: onClose, onError })
    else create.mutate(name.trim(), { onSuccess: onClose, onError })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={listId ? 'Đổi tên danh sách' : 'Danh sách mới'}
      footer={
        <>
          <GhostButton onClick={onClose}>Hủy</GhostButton>
          <PrimaryButton pending={mutation.isPending} onClick={submit}>
            {listId ? 'Lưu tên' : 'Tạo danh sách'}
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
          <Field.Label>Tên danh sách</Field.Label>
          <Field.Input
            value={name}
            maxLength={100}
            autoComplete="off"
            onChange={(e) => {
              setName(e.target.value)
              setError(undefined)
            }}
            placeholder="vd. Cuối tuần này…"
          />
          <Field.Error />
        </Field.Root>
      </form>
    </Dialog>
  )
}
