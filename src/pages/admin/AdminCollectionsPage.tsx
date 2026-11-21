import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowDown, ArrowLeft, ArrowUp, ImagePlus, Plus, Search, Trash2, X } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { fieldErrors, adminProblemMessage } from '../../api/problem.ts'
import { uploadFile, useAdminCollections, useAdminPlaces, useCollectionMutations } from '../../hooks/adminCatalog.ts'
import { PageHeader, Panel, Table, td, th } from '../../components/admin/AdminUi.tsx'
import { ConfirmDialog } from '../../components/ui/Dialog.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { ButtonLink, DangerButton, GhostButton, PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { Badge, EmptyState, ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { formatDateTime } from '../../lib/format.ts'

function visibility(c: Schemas['CollectionDetail']) {
  const now = Date.now()
  if (c.visibleFrom && new Date(c.visibleFrom).getTime() > now) return { label: 'Sắp hiển thị', tone: 'action' as const }
  if (c.visibleUntil && new Date(c.visibleUntil).getTime() <= now) return { label: 'Đã hết hạn', tone: 'muted' as const }
  return { label: 'Đang hiển thị', tone: 'success' as const }
}

/** Bộ sưu tập khám phá trên trang chủ (FR-26). */
export function AdminCollectionsPage() {
  const collections = useAdminCollections()
  return (
    <>
      <PageHeader
        title="Bộ sưu tập"
        description="Nhóm địa điểm theo chủ đề để hiện ở trang chủ. Trang công khai chỉ hiện địa điểm đang hiển thị, trong khung thời gian đã đặt."
        actions={
          <ButtonLink to="/admin/collections/new" icon={<Plus size={16} aria-hidden="true" />}>
            Tạo bộ sưu tập
          </ButtonLink>
        }
      />
      {collections.isPending ? (
        <LoadingState />
      ) : collections.isError ? (
        <ErrorState error={collections.error} onRetry={() => collections.refetch()} />
      ) : (
        <Table
          head={
            <tr>
              <th className={th}>Tiêu đề</th>
              <th className={th}>Số địa điểm</th>
              <th className={th}>Hiển thị</th>
              <th className={th}>Thời gian</th>
            </tr>
          }
          empty={collections.data.length === 0 ? <EmptyState title="Chưa có bộ sưu tập" /> : undefined}
        >
          {collections.data.map((c) => {
            const v = visibility(c)
            return (
              <tr key={c.id} className="hover:bg-page">
                <td className={td}>
                  <Link to={`/admin/collections/${c.id}`} className="font-semibold text-action hover:underline">
                    {c.title}
                  </Link>
                </td>
                <td className={`${td} tabular`}>{c.places?.length ?? 0}</td>
                <td className={td}>
                  <Badge tone={v.tone}>{v.label}</Badge>
                </td>
                <td className={`${td} text-[13px] text-ink-muted`}>
                  {c.visibleFrom ? `Từ ${formatDateTime(c.visibleFrom)}` : 'Không giới hạn đầu'}
                  <br />
                  {c.visibleUntil ? `Đến ${formatDateTime(c.visibleUntil)}` : 'Không giới hạn cuối'}
                </td>
              </tr>
            )
          })}
        </Table>
      )}
    </>
  )
}

/** ISO → giá trị cho input datetime-local (giờ máy người dùng). */
const toLocalInput = (iso?: string | null) => {
  if (!iso) return ''
  const d = new Date(iso)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 16)
}
const fromLocalInput = (v: string) => (v ? new Date(v).toISOString() : undefined)

export function AdminCollectionEditPage() {
  const { collectionId } = useParams()
  const collections = useAdminCollections()
  if (collectionId && collections.isPending) return <LoadingState />
  if (collectionId && collections.isError) return <ErrorState error={collections.error} onRetry={() => collections.refetch()} />
  const existing = collectionId ? collections.data?.find((c) => c.id === collectionId) : undefined
  if (collectionId && !existing) return <EmptyState title="Không tìm thấy bộ sưu tập" action={<ButtonLink to="/admin/collections">Quay lại</ButtonLink>} />
  return <CollectionEditor key={existing?.id ?? 'new'} existing={existing} />
}

function CollectionEditor({ existing }: { existing?: Schemas['CollectionDetail'] }) {
  const navigate = useNavigate()
  const toast = useToast()
  const m = useCollectionMutations()
  const [title, setTitle] = useState(existing?.title ?? '')
  const [body, setBody] = useState(existing?.body ?? '')
  const [from, setFrom] = useState(toLocalInput(existing?.visibleFrom))
  const [until, setUntil] = useState(toLocalInput(existing?.visibleUntil))
  const [places, setPlaces] = useState<{ id: string; name: string }[]>(existing?.places?.map((p) => ({ id: p.id, name: p.name })) ?? [])
  const [coverFileId, setCoverFileId] = useState<string | undefined>(existing?.coverUrl?.split('/').pop())
  const [coverPreview, setCoverPreview] = useState<string | null | undefined>(existing?.coverUrl)
  const [uploading, setUploading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const save = existing ? m.update : m.create
  const errors = save.error ? fieldErrors(save.error) : {}

  const move = (i: number, d: -1 | 1) =>
    setPlaces((cur) => {
      const next = [...cur]
      ;[next[i], next[i + d]] = [next[i + d], next[i]]
      return next
    })

  const submit = () => {
    const payload: Schemas['CollectionWrite'] = {
      title: title.trim(),
      body: body.trim() || undefined,
      coverFileId,
      visibleFrom: fromLocalInput(from),
      visibleUntil: fromLocalInput(until),
      placeIds: places.map((p) => p.id),
    }
    const onSuccess = (c: Schemas['CollectionDetail']) => {
      toast.show('Đã lưu bộ sưu tập')
      if (!existing) navigate(`/admin/collections/${c.id}`, { replace: true })
    }
    if (existing) m.update.mutate({ id: existing.id, body: payload }, { onSuccess })
    else m.create.mutate(payload, { onSuccess })
  }

  return (
    <>
      <Link to="/admin/collections" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Bộ sưu tập
      </Link>
      <PageHeader
        title={existing ? existing.title : 'Tạo bộ sưu tập'}
        actions={
          <>
            {existing && (
              <DangerButton icon={<Trash2 size={16} aria-hidden="true" />} onClick={() => setConfirmDelete(true)}>
                Xóa
              </DangerButton>
            )}
            <PrimaryButton pending={save.isPending} disabled={!title.trim()} onClick={submit}>
              Lưu
            </PrimaryButton>
          </>
        }
      />
      {save.error && !Object.keys(errors).length && <p role="alert" className="mb-3 text-sm text-danger">{adminProblemMessage(save.error)}</p>}
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Panel title="Nội dung">
          <div className="flex flex-col gap-4">
            <Field.Root error={errors.title}>
              <Field.Label>Tiêu đề</Field.Label>
              <Field.Input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={150} />
              <Field.Error />
            </Field.Root>
            <Field.Root>
              <Field.Label optional>Mô tả</Field.Label>
              <Field.Textarea rows={3} value={body} onChange={(e) => setBody(e.target.value)} maxLength={5000} />
            </Field.Root>
            <div className="grid gap-4 md:grid-cols-2">
              <Field.Root hint>
                <Field.Label optional>Hiển thị từ</Field.Label>
                <Field.Hint>Để trống = hiện ngay</Field.Hint>
                <Field.Input type="datetime-local" value={from} onChange={(e) => setFrom(e.target.value)} />
              </Field.Root>
              <Field.Root hint error={errors.visibleUntil}>
                <Field.Label optional>Hiển thị đến</Field.Label>
                <Field.Hint>Để trống = không hết hạn</Field.Hint>
                <Field.Input type="datetime-local" value={until} onChange={(e) => setUntil(e.target.value)} />
                <Field.Error />
              </Field.Root>
            </div>
            <div>
              <p className="mb-1 text-sm font-semibold">Ảnh bìa</p>
              {coverPreview ? (
                <div className="relative w-64">
                  <img src={coverPreview} alt="Ảnh bìa" className="aspect-video w-64 rounded-control bg-page object-cover" />
                  <button type="button" aria-label="Bỏ ảnh bìa" className="absolute top-1 right-1 rounded-full bg-white/90 p-1" onClick={() => (setCoverFileId(undefined), setCoverPreview(null))}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </div>
              ) : (
                <label className="inline-flex cursor-pointer items-center gap-2 rounded-control border border-dashed border-line px-3 py-2 text-sm text-ink-muted hover:border-action">
                  <ImagePlus size={16} aria-hidden="true" /> {uploading ? 'Đang tải…' : 'Chọn ảnh (PNG/JPEG ≤ 5 MB)'}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    className="sr-only"
                    onChange={async (e) => {
                      const file = e.target.files?.[0]
                      if (!file) return
                      setUploading(true)
                      try {
                        const stored = await uploadFile(file, 'COLLECTION')
                        setCoverFileId(stored.id)
                        setCoverPreview(URL.createObjectURL(file))
                      } catch (err) {
                        toast.show(adminProblemMessage(err), { tone: 'error' })
                      } finally {
                        setUploading(false)
                      }
                    }}
                  />
                </label>
              )}
              {errors.coverFileId && <p className="mt-1 text-sm text-danger">{errors.coverFileId}</p>}
            </div>
          </div>
        </Panel>
        <Panel title={`Địa điểm (${places.length})`}>
          {errors.placeIds && <p className="mb-2 text-sm text-danger">{errors.placeIds}</p>}
          <ol className="mb-3 flex flex-col gap-1">
            {places.map((p, i) => (
              <li key={p.id} className="flex items-center gap-2 rounded-control border border-line px-2 py-1.5 text-sm">
                <span className="w-5 text-ink-muted tabular">{i + 1}</span>
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                <button type="button" aria-label={`Đưa ${p.name} lên`} disabled={i === 0} className="p-1 disabled:opacity-30" onClick={() => move(i, -1)}>
                  <ArrowUp size={14} aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Đưa ${p.name} xuống`} disabled={i === places.length - 1} className="p-1 disabled:opacity-30" onClick={() => move(i, 1)}>
                  <ArrowDown size={14} aria-hidden="true" />
                </button>
                <button type="button" aria-label={`Bỏ ${p.name}`} className="p-1 text-danger" onClick={() => setPlaces((cur) => cur.filter((x) => x.id !== p.id))}>
                  <X size={14} aria-hidden="true" />
                </button>
              </li>
            ))}
          </ol>
          <PlacePicker exclude={places.map((p) => p.id)} onPick={(p) => setPlaces((cur) => [...cur, p])} />
        </Panel>
      </div>
      {existing && (
        <ConfirmDialog
          open={confirmDelete}
          onClose={() => setConfirmDelete(false)}
          title={`Xóa “${existing.title}”?`}
          description="Bộ sưu tập biến mất khỏi trang chủ. Các địa điểm không bị ảnh hưởng. Không hoàn tác được."
          confirmLabel="Xóa"
          pending={m.remove.isPending}
          onConfirm={() => m.remove.mutate(existing.id, { onSuccess: () => (toast.show('Đã xóa bộ sưu tập'), navigate('/admin/collections')) })}
        />
      )}
    </>
  )
}

function PlacePicker({ exclude, onPick }: { exclude: string[]; onPick: (p: { id: string; name: string }) => void }) {
  const [draft, setDraft] = useState('')
  const [q, setQ] = useState('')
  const results = useAdminPlaces({ q, page: 0 })
  return (
    <div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          setQ(draft.trim())
        }}
      >
        <Field.Root className="flex-1">
          <Field.Label>Thêm địa điểm</Field.Label>
          <Field.Input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Tìm theo tên hoặc mã" />
        </Field.Root>
        <SecondaryButton type="submit" className="self-end" icon={<Search size={16} aria-hidden="true" />}>
          Tìm
        </SecondaryButton>
      </form>
      <ul className="mt-2 max-h-64 overflow-y-auto text-sm">
        {results.data?.items
          .filter((p) => !exclude.includes(p.id))
          .map((p) => (
            <li key={p.id} className="flex items-center justify-between gap-2 border-b border-line py-1.5">
              <span className="min-w-0 truncate">
                {p.name} {p.status !== 'PUBLISHED' && <span className="text-[12px] text-ink-muted">({p.status === 'DRAFT' ? 'nháp' : 'chưa hiển thị'})</span>}
              </span>
              <GhostButton icon={<Plus size={14} aria-hidden="true" />} onClick={() => onPick({ id: p.id, name: p.name })}>
                Thêm
              </GhostButton>
            </li>
          ))}
      </ul>
    </div>
  )
}
