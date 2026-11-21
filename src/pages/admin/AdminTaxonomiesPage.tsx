import { useState } from 'react'
import { Plus } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { fieldErrors, problemMessage } from '../../api/problem.ts'
import { TAXONOMY_GROUP_LABELS, useAdminTaxonomies, useAreas, useTaxonomyMutations } from '../../hooks/adminCatalog.ts'
import { PageHeader, Panel } from '../../components/admin/AdminUi.tsx'
import { Dialog } from '../../components/ui/Dialog.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { GhostButton, PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'

type Group = Schemas['TaxonomyGroup']
type Editing = { kind: 'taxonomy' | 'area'; id?: string; group?: Group; code: string; name: string; status?: Schemas['ActiveStatus'] }

/** Loại hình, nhãn lọc và khu vực (FR-25). Không xóa: đổi tên hoặc ngừng dùng để dữ liệu cũ còn nguyên (RULE-22). */
export function AdminTaxonomiesPage() {
  const taxonomies = useAdminTaxonomies()
  const areas = useAreas()
  const [editing, setEditing] = useState<Editing | null>(null)

  if (taxonomies.isPending) return <LoadingState />
  if (taxonomies.isError) return <ErrorState error={taxonomies.error} onRetry={() => taxonomies.refetch()} />
  const groups = Object.keys(TAXONOMY_GROUP_LABELS) as Group[]

  return (
    <>
      <PageHeader
        title="Nhãn & khu vực"
        description="Nhãn ngừng dùng biến mất khỏi bộ lọc trên web nhưng vẫn giữ trên địa điểm cũ. Đổi tên sẽ cập nhật tìm kiếm không dấu."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel
          title="Khu vực"
          actions={
            <GhostButton icon={<Plus size={16} aria-hidden="true" />} onClick={() => setEditing({ kind: 'area', code: '', name: '' })}>
              Thêm
            </GhostButton>
          }
        >
          {areas.data?.length ? (
            <ul className="flex flex-wrap gap-1.5">
              {areas.data.map((a) => (
                <li key={a.id}>
                  <button type="button" className="rounded-full border border-line bg-white px-3 py-1 text-sm hover:border-action" onClick={() => setEditing({ kind: 'area', id: a.id, code: a.code, name: a.name, status: a.status })}>
                    {a.name}
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-ink-muted">Chưa có khu vực nào.</p>
          )}
          <p className="mt-2 text-[12px] text-ink-muted">Danh sách chỉ hiện khu vực đang dùng.</p>
        </Panel>
        {groups.map((g) => {
          const items = taxonomies.data.filter((t) => t.group === g)
          return (
            <Panel
              key={g}
              title={TAXONOMY_GROUP_LABELS[g]}
              actions={
                <GhostButton icon={<Plus size={16} aria-hidden="true" />} onClick={() => setEditing({ kind: 'taxonomy', group: g, code: '', name: '' })}>
                  Thêm
                </GhostButton>
              }
            >
              {items.length === 0 ? (
                <p className="text-sm text-ink-muted">Chưa có nhãn.</p>
              ) : (
                <ul className="flex flex-wrap gap-1.5">
                  {items.map((t) => (
                    <li key={t.id}>
                      <button
                        type="button"
                        className={`rounded-full border px-3 py-1 text-sm hover:border-action ${t.status === 'ACTIVE' ? 'border-line bg-white' : 'border-dashed border-line bg-page text-ink-muted line-through'}`}
                        onClick={() => setEditing({ kind: 'taxonomy', id: t.id, group: t.group, code: t.code, name: t.name, status: t.status })}
                      >
                        {t.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          )
        })}
      </div>
      {editing && <EditDialog editing={editing} onClose={() => setEditing(null)} />}
    </>
  )
}

function EditDialog({ editing, onClose }: { editing: Editing; onClose: () => void }) {
  const m = useTaxonomyMutations()
  const toast = useToast()
  const [code, setCode] = useState(editing.code)
  const [name, setName] = useState(editing.name)
  const isNew = !editing.id
  const mutation = editing.kind === 'taxonomy' ? (isNew ? m.createTaxonomy : m.updateTaxonomy) : isNew ? m.createArea : m.updateArea
  const errors = mutation.error ? fieldErrors(mutation.error) : {}
  const title = `${isNew ? 'Thêm' : 'Sửa'} ${editing.kind === 'area' ? 'khu vực' : TAXONOMY_GROUP_LABELS[editing.group!].toLowerCase()}`
  const done = (msg: string) => () => (toast.show(msg), onClose())

  const save = () => {
    if (editing.kind === 'taxonomy') {
      if (isNew) m.createTaxonomy.mutate({ group: editing.group!, code: code.trim(), name: name.trim() }, { onSuccess: done('Đã thêm nhãn') })
      else m.updateTaxonomy.mutate({ id: editing.id!, name: name.trim() }, { onSuccess: done('Đã đổi tên') })
    } else if (isNew) m.createArea.mutate({ code: code.trim(), name: name.trim() }, { onSuccess: done('Đã thêm khu vực') })
    else m.updateArea.mutate({ id: editing.id!, name: name.trim() }, { onSuccess: done('Đã đổi tên') })
  }
  const toggle = () => {
    const status = editing.status === 'ACTIVE' ? 'DEPRECATED' : 'ACTIVE'
    const msg = status === 'ACTIVE' ? 'Đã dùng lại' : 'Đã ngừng dùng'
    if (editing.kind === 'taxonomy') m.updateTaxonomy.mutate({ id: editing.id!, status }, { onSuccess: done(msg) })
    else m.updateArea.mutate({ id: editing.id!, status }, { onSuccess: done(msg) })
  }

  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      footer={
        <>
          {!isNew && (
            <SecondaryButton className="mr-auto" onClick={toggle}>
              {editing.status === 'ACTIVE' ? 'Ngừng dùng' : 'Dùng lại'}
            </SecondaryButton>
          )}
          <SecondaryButton onClick={onClose}>Hủy</SecondaryButton>
          <PrimaryButton pending={mutation.isPending} disabled={!name.trim() || (isNew && !code.trim())} onClick={save}>
            Lưu
          </PrimaryButton>
        </>
      }
    >
      <div className="flex flex-col gap-4">
        {!isNew && editing.status && (
          <p className="text-sm">
            Trạng thái: <Badge tone={editing.status === 'ACTIVE' ? 'success' : 'muted'}>{editing.status === 'ACTIVE' ? 'Đang dùng' : 'Ngừng dùng'}</Badge>
          </p>
        )}
        <Field.Root error={errors.code} hint>
          <Field.Label>Mã</Field.Label>
          <Field.Hint>Chữ in hoa, số và _, 2–40 ký tự. Không đổi được sau khi tạo.</Field.Hint>
          <Field.Input value={code} disabled={!isNew} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={40} />
          <Field.Error />
        </Field.Root>
        <Field.Root error={errors.name}>
          <Field.Label>Tên hiển thị</Field.Label>
          <Field.Input value={name} onChange={(e) => setName(e.target.value)} maxLength={100} autoFocus />
          <Field.Error />
        </Field.Root>
        {mutation.error && !Object.keys(errors).length && <p role="alert" className="text-sm text-danger">{problemMessage(mutation.error)}</p>}
      </div>
    </Dialog>
  )
}
