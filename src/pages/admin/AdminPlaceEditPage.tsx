import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import { ArrowLeft, CircleAlert, CircleCheck, ExternalLink, ImagePlus, Plus, Star, Trash2, X } from 'lucide-react'
import type { Schemas } from '../../api/client.ts'
import { fieldErrors, adminProblemMessage } from '../../api/problem.ts'
import {
  PLACE_STATUS_LABELS,
  TAXONOMY_GROUP_LABELS,
  TRANSITIONS,
  useAdminPlace,
  useAdminPlaceMutations,
  useAdminTaxonomies,
  useAreas,
  type TransitionAction,
} from '../../hooks/adminCatalog.ts'
import { PageHeader, Panel } from '../../components/admin/AdminUi.tsx'
import { Dialog } from '../../components/ui/Dialog.tsx'
import { Field } from '../../components/ui/Field.tsx'
import { DangerButton, GhostButton, PrimaryButton, SecondaryButton } from '../../components/ui/Button.tsx'
import { ErrorState, LoadingState } from '../../components/ui/StateView.tsx'
import { useToast } from '../../components/ui/Toast.tsx'
import { PlaceStatusBadge } from './AdminPlacesPage.tsx'

/** Câu điều kiện xuất bản backend dùng khi địa điểm chưa có dòng giá (AdminPlaceService). */
const PRICE_MISSING_BLOCKER = 'Chưa ghi trạng thái giá'

const DAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
const EDITABLE = new Set(['DRAFT', 'PENDING'])

type Range = { opensAt: string; closesAt: string }
type DayHours = { open: boolean; ranges: Range[] }
type ExceptionRow = { date: string; closed: boolean; opensAt: string; closesAt: string; note: string }

type FormState = {
  code: string
  name: string
  categoryId: string
  areaId: string
  address: string
  lat: string
  lng: string
  description: string
  phone: string
  website: string
  notes: string
  reservation: '' | 'yes' | 'no'
  tagIds: string[]
  priceStatus: 'KNOWN' | 'UNKNOWN' | ''
  standardForTwo: string
  min: string
  max: string
  includes: string
  priceSource: string
  hoursKnown: boolean
  days: DayHours[]
  exceptions: ExceptionRow[]
  source: string
  verifiedAt: string
}

const emptyDays = (): DayHours[] => DAYS.map(() => ({ open: false, ranges: [{ opensAt: '08:00', closesAt: '22:00' }] }))

function fromPlace(p: Schemas['AdminPlace'] | undefined): FormState {
  const days = emptyDays()
  p?.hours.weekly?.forEach((w) => {
    days[w.dayOfWeek - 1] = { open: w.ranges.length > 0, ranges: w.ranges.length ? w.ranges.map((r) => ({ ...r })) : days[w.dayOfWeek - 1].ranges }
  })
  return {
    code: p?.code ?? '',
    name: p?.name ?? '',
    categoryId: p?.category?.id ?? '',
    areaId: p?.area?.id ?? '',
    address: p?.address ?? '',
    lat: p?.lat != null ? String(p.lat) : '',
    lng: p?.lng != null ? String(p.lng) : '',
    description: p?.description ?? '',
    phone: p?.phone ?? '',
    website: p?.website ?? '',
    notes: p?.notes ?? '',
    reservation: p?.reservationRecommended == null ? '' : p.reservationRecommended ? 'yes' : 'no',
    tagIds: p?.tags.map((t) => t.id) ?? [],
    // API đọc trả UNKNOWN cả khi chưa có dòng giá (coalesce); dựa vào điều kiện xuất bản để không hiện nhầm “Chưa rõ giá”.
    priceStatus: !p || p.publishBlockers?.some((b) => b.startsWith(PRICE_MISSING_BLOCKER)) ? '' : p.price.status,
    standardForTwo: p?.price.standardForTwo != null ? String(p.price.standardForTwo) : '',
    min: p?.price.min != null ? String(p.price.min) : '',
    max: p?.price.max != null ? String(p.price.max) : '',
    includes: p?.price.includes ?? '',
    priceSource: '',
    hoursKnown: p?.hours.status === 'KNOWN',
    days,
    exceptions:
      p?.hours.exceptions?.map((e) => ({
        date: e.date,
        closed: e.closed,
        opensAt: e.ranges?.[0]?.opensAt ?? '10:00',
        closesAt: e.ranges?.[0]?.closesAt ?? '20:00',
        note: e.note ?? '',
      })) ?? [],
    source: p?.source ?? '',
    verifiedAt: p?.verifiedAt ?? '',
  }
}

function toWrite(f: FormState): Schemas['AdminPlaceWrite'] {
  const num = (s: string) => (s.trim() === '' ? null : Number(s))
  return {
    code: f.code.trim().toUpperCase(),
    name: f.name.trim(),
    categoryId: f.categoryId,
    areaId: f.areaId,
    address: f.address.trim(),
    lat: Number(f.lat),
    lng: Number(f.lng),
    description: f.description.trim() || undefined,
    phone: f.phone.trim() || undefined,
    website: f.website.trim() || undefined,
    notes: f.notes.trim() || undefined,
    reservationRecommended: f.reservation === '' ? null : f.reservation === 'yes',
    tagIds: f.tagIds,
    price: f.priceStatus
      ? {
          status: f.priceStatus,
          standardForTwo: f.priceStatus === 'KNOWN' ? num(f.standardForTwo) : null,
          min: f.priceStatus === 'KNOWN' ? num(f.min) : null,
          max: f.priceStatus === 'KNOWN' ? num(f.max) : null,
          includes: f.includes.trim() || null,
          source: f.priceSource.trim() || undefined,
        }
      : undefined,
    hours: f.hoursKnown
      ? {
          status: 'KNOWN',
          weekly: f.days.flatMap((d, i) => (d.open ? [{ dayOfWeek: i + 1, ranges: d.ranges }] : [])),
          exceptions: f.exceptions
            .filter((e) => e.date)
            .map((e) => ({ date: e.date, closed: e.closed, ranges: e.closed ? [] : [{ opensAt: e.opensAt, closesAt: e.closesAt }], note: e.note.trim() || undefined })),
        }
      : { status: 'UNKNOWN' },
    source: f.source.trim() || undefined,
    verifiedAt: f.verifiedAt || undefined,
  }
}

/** Tạo hoặc sửa địa điểm (FR-23), gắn ảnh có quyền sử dụng (RULE-28), gửi duyệt / duyệt / ẩn (FR-24). */
export function AdminPlaceEditPage() {
  const { placeId } = useParams()
  const isNew = !placeId
  const place = useAdminPlace(placeId)
  if (!isNew && place.isPending) return <LoadingState />
  if (!isNew && place.isError) return <ErrorState error={place.error} onRetry={() => place.refetch()} />
  // key: dựng lại form khi tải xong / sau khi lưu đổi dữ liệu gốc
  return <PlaceEditor key={place.data?.updatedAt ?? 'new'} place={place.data} />
}

function PlaceEditor({ place }: { place: Schemas['AdminPlace'] | undefined }) {
  const navigate = useNavigate()
  const toast = useToast()
  const taxonomies = useAdminTaxonomies()
  const areas = useAreas()
  const m = useAdminPlaceMutations(place?.id)
  const [f, setF] = useState<FormState>(() => fromPlace(place))
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setF((cur) => ({ ...cur, [key]: value }))
  const editable = !place || EDITABLE.has(place.status)
  const save = place ? m.update : m.create
  const errors = save.error ? fieldErrors(save.error) : {}

  const byGroup = useMemo(() => {
    const groups = new Map<Schemas['TaxonomyGroup'], Schemas['Taxonomy'][]>()
    for (const t of taxonomies.data ?? []) {
      if (t.status !== 'ACTIVE' && !f.tagIds.includes(t.id)) continue
      const list = groups.get(t.group) ?? []
      list.push(t)
      groups.set(t.group, list)
    }
    return groups
  }, [taxonomies.data, f.tagIds])

  const submit = () =>
    save.mutate(toWrite(f), {
      onSuccess: (saved) => {
        toast.show(place ? 'Đã lưu' : 'Đã tạo nháp — giờ có thể thêm ảnh')
        if (!place) navigate(`/admin/places/${saved.id}`, { replace: true })
      },
      onError: (e) => toast.show(adminProblemMessage(e), { tone: 'error' }),
    })

  return (
    <>
      <Link to="/admin/places" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-muted hover:text-ink">
        <ArrowLeft size={16} aria-hidden="true" /> Địa điểm
      </Link>
      <PageHeader
        title={place ? place.name : 'Thêm địa điểm'}
        description={
          place ? (
            <span className="flex flex-wrap items-center gap-2">
              <PlaceStatusBadge status={place.status} />
              <span className="font-mono text-[13px]">{place.code}</span>
              {place.status === 'PUBLISHED' && (
                <a href={`/places/${place.id}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-action hover:underline">
                  Xem trên web <ExternalLink size={14} aria-hidden="true" />
                </a>
              )}
            </span>
          ) : (
            'Lưu thành nháp trước, sau đó thêm ảnh và gửi duyệt.'
          )
        }
        actions={
          editable && (
            <PrimaryButton pending={save.isPending} onClick={submit} disabled={!f.code || !f.name || !f.categoryId || !f.areaId || !f.address || !f.lat || !f.lng}>
              {place ? 'Lưu thay đổi' : 'Tạo nháp'}
            </PrimaryButton>
          )
        }
      />

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div className="flex flex-col gap-4">
          {!editable && (
            <p className="rounded-control border border-line bg-peach-50 px-3 py-2 text-sm text-attention">
              Địa điểm đang ở trạng thái “{PLACE_STATUS_LABELS[place!.status]}” nên không sửa trực tiếp được. Muốn sửa: tạm ẩn rồi khôi phục để về “Chờ duyệt”.
            </p>
          )}
          <fieldset disabled={!editable} className="flex flex-col gap-4 disabled:opacity-80">
            <Panel title="Thông tin cơ bản">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Mã chi nhánh" error={errors.code} hint="Chữ in hoa, số, _ hoặc -, 3–40 ký tự" value={f.code} onChange={(v) => set('code', v.toUpperCase())} maxLength={40} />
                <Input label="Tên địa điểm" error={errors.name} value={f.name} onChange={(v) => set('name', v)} maxLength={150} />
                <Field.Root error={errors.categoryId}>
                  <Field.Label>Loại hình</Field.Label>
                  <Field.Select value={f.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                    <option value="">Chọn loại hình</option>
                    {byGroup.get('CATEGORY')?.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </Field.Select>
                  <Field.Error />
                </Field.Root>
                <Field.Root error={errors.areaId}>
                  <Field.Label>Khu vực</Field.Label>
                  <Field.Select value={f.areaId} onChange={(e) => set('areaId', e.target.value)}>
                    <option value="">Chọn khu vực</option>
                    {areas.data?.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name}
                      </option>
                    ))}
                  </Field.Select>
                  <Field.Error />
                </Field.Root>
                <Input label="Địa chỉ" className="md:col-span-2" error={errors.address} value={f.address} onChange={(v) => set('address', v)} maxLength={300} />
                <Input label="Vĩ độ (lat)" hint="vd. 10.7769" inputMode="decimal" error={errors.lat} value={f.lat} onChange={(v) => set('lat', v)} />
                <Input label="Kinh độ (lng)" hint="vd. 106.7009" inputMode="decimal" error={errors.lng} value={f.lng} onChange={(v) => set('lng', v)} />
                <Field.Root className="md:col-span-2">
                  <Field.Label>Mô tả</Field.Label>
                  <Field.Textarea rows={3} maxLength={5000} value={f.description} onChange={(e) => set('description', e.target.value)} />
                </Field.Root>
                <Input label="Điện thoại" optional value={f.phone} onChange={(v) => set('phone', v)} maxLength={20} />
                <Input label="Website" optional hint="https://…" error={errors.website} value={f.website} onChange={(v) => set('website', v)} />
                <Field.Root>
                  <Field.Label>Nên đặt chỗ trước?</Field.Label>
                  <Field.Select value={f.reservation} onChange={(e) => set('reservation', e.target.value as FormState['reservation'])}>
                    <option value="">Chưa có thông tin</option>
                    <option value="yes">Nên đặt trước</option>
                    <option value="no">Không cần</option>
                  </Field.Select>
                </Field.Root>
                <Input label="Lưu ý" optional value={f.notes} onChange={(v) => set('notes', v)} maxLength={2000} />
              </div>
            </Panel>

            <Panel title="Nhãn">
              {errors.tagIds && <p className="mb-2 text-sm text-danger">{errors.tagIds}</p>}
              <div className="flex flex-col gap-3">
                {[...byGroup.entries()]
                  .filter(([g]) => g !== 'CATEGORY')
                  .map(([group, tags]) => (
                    <div key={group}>
                      <p className="mb-1 text-[13px] font-semibold text-ink-muted">{TAXONOMY_GROUP_LABELS[group]}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {tags.map((t) => {
                          const on = f.tagIds.includes(t.id)
                          return (
                            <button
                              key={t.id}
                              type="button"
                              aria-pressed={on}
                              onClick={() => set('tagIds', on ? f.tagIds.filter((x) => x !== t.id) : [...f.tagIds, t.id])}
                              className={`rounded-full border px-3 py-1 text-sm ${on ? 'border-action bg-action-soft font-semibold text-action' : 'border-line bg-white text-ink-muted'}`}
                            >
                              {t.name}
                              {t.status !== 'ACTIVE' && ' (ngừng dùng)'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </Panel>

            <Panel title="Giá cho hai người">
              {errors.price && <p className="mb-2 text-sm text-danger">{errors.price}</p>}
              <div className="grid gap-4 md:grid-cols-3">
                <Field.Root className="md:col-span-3">
                  <Field.Label>Trạng thái giá</Field.Label>
                  <Field.Select value={f.priceStatus} onChange={(e) => set('priceStatus', e.target.value as FormState['priceStatus'])}>
                    <option value="">Chưa ghi</option>
                    <option value="KNOWN">Đã biết giá</option>
                    <option value="UNKNOWN">Chưa rõ giá (ghi rõ là chưa rõ)</option>
                  </Field.Select>
                </Field.Root>
                {f.priceStatus === 'KNOWN' && (
                  <>
                    <Input label="Giá chuẩn (VND)" inputMode="numeric" value={f.standardForTwo} onChange={(v) => set('standardForTwo', v.replace(/\D/g, ''))} />
                    <Input label="Thấp nhất (VND)" inputMode="numeric" value={f.min} onChange={(v) => set('min', v.replace(/\D/g, ''))} />
                    <Input label="Cao nhất (VND)" inputMode="numeric" value={f.max} onChange={(v) => set('max', v.replace(/\D/g, ''))} />
                    <Input label="Gồm những gì" optional className="md:col-span-2" value={f.includes} onChange={(v) => set('includes', v)} />
                    <Input label="Nguồn giá" optional value={f.priceSource} onChange={(v) => set('priceSource', v)} />
                  </>
                )}
              </div>
            </Panel>

            <Panel title="Giờ mở cửa">
              <label className="mb-3 flex items-center gap-2 text-sm">
                <input type="checkbox" checked={f.hoursKnown} onChange={(e) => set('hoursKnown', e.target.checked)} />
                Đã xác minh giờ mở cửa (bỏ chọn = “Chưa có thông tin”)
              </label>
              {f.hoursKnown && <HoursEditor f={f} setF={setF} />}
              {errors['hours.weekly'] && <p className="mt-2 text-sm text-danger">{errors['hours.weekly']}</p>}
              {errors['hours.exceptions'] && <p className="mt-2 text-sm text-danger">{errors['hours.exceptions']}</p>}
            </Panel>

            <Panel title="Nguồn dữ liệu">
              <div className="grid gap-4 md:grid-cols-2">
                <Input label="Nguồn" hint="vd. Khảo sát thực tế, menu quán" value={f.source} onChange={(v) => set('source', v)} maxLength={500} />
                <Field.Root>
                  <Field.Label>Ngày kiểm tra</Field.Label>
                  <Field.Input type="date" value={f.verifiedAt} onChange={(e) => set('verifiedAt', e.target.value)} />
                </Field.Root>
              </div>
            </Panel>
          </fieldset>
        </div>

        <aside className="flex flex-col gap-4">
          {place && <StatusPanel place={place} />}
          {place && <ImagesPanel place={place} editable={editable} />}
          {!place && (
            <Panel title="Ảnh">
              <p className="text-sm text-ink-muted">Tạo nháp trước rồi thêm ảnh.</p>
            </Panel>
          )}
        </aside>
      </div>
    </>
  )
}

function Input({
  label,
  value,
  onChange,
  error,
  hint,
  optional,
  className,
  inputMode,
  maxLength,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  error?: string
  hint?: string
  optional?: boolean
  className?: string
  inputMode?: 'decimal' | 'numeric'
  maxLength?: number
}) {
  return (
    <Field.Root error={error} hint={!!hint} className={className}>
      <Field.Label optional={optional}>{label}</Field.Label>
      {hint && <Field.Hint>{hint}</Field.Hint>}
      <Field.Input value={value} onChange={(e) => onChange(e.target.value)} inputMode={inputMode} maxLength={maxLength} />
      <Field.Error />
    </Field.Root>
  )
}

function HoursEditor({ f, setF }: { f: FormState; setF: React.Dispatch<React.SetStateAction<FormState>> }) {
  const updateDay = (i: number, day: DayHours) => setF((cur) => ({ ...cur, days: cur.days.map((d, j) => (j === i ? day : d)) }))
  const updateEx = (i: number, ex: ExceptionRow | null) =>
    setF((cur) => ({ ...cur, exceptions: ex ? cur.exceptions.map((e, j) => (j === i ? ex : e)) : cur.exceptions.filter((_, j) => j !== i) }))
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[13px] text-ink-muted">Giờ đóng nhỏ hơn hoặc bằng giờ mở nghĩa là mở qua đêm (vd. 18:00–02:00).</p>
      <div className="flex flex-col gap-2">
        {f.days.map((d, i) => (
          <div key={DAYS[i]} className="flex flex-wrap items-center gap-2 text-sm">
            <label className="flex w-28 items-center gap-2">
              <input type="checkbox" checked={d.open} onChange={(e) => updateDay(i, { ...d, open: e.target.checked })} />
              {DAYS[i]}
            </label>
            {d.open ? (
              <>
                {d.ranges.map((r, k) => (
                  <span key={k} className="flex items-center gap-1">
                    <TimeInput label={`${DAYS[i]} mở ${k + 1}`} value={r.opensAt} onChange={(v) => updateDay(i, { ...d, ranges: d.ranges.map((x, j) => (j === k ? { ...x, opensAt: v } : x)) })} />–
                    <TimeInput label={`${DAYS[i]} đóng ${k + 1}`} value={r.closesAt} onChange={(v) => updateDay(i, { ...d, ranges: d.ranges.map((x, j) => (j === k ? { ...x, closesAt: v } : x)) })} />
                    {d.ranges.length > 1 && (
                      <button type="button" aria-label="Bỏ khung giờ" className="p-1 text-ink-muted" onClick={() => updateDay(i, { ...d, ranges: d.ranges.filter((_, j) => j !== k) })}>
                        <X size={14} aria-hidden="true" />
                      </button>
                    )}
                  </span>
                ))}
                <button type="button" className="text-[13px] text-action" onClick={() => updateDay(i, { ...d, ranges: [...d.ranges, { opensAt: '17:00', closesAt: '22:00' }] })}>
                  + khung giờ
                </button>
                {i > 0 && (
                  <button type="button" className="text-[13px] text-ink-muted underline" onClick={() => updateDay(i, { open: f.days[i - 1].open, ranges: f.days[i - 1].ranges.map((r) => ({ ...r })) })}>
                    như hôm trước
                  </button>
                )}
              </>
            ) : (
              <span className="text-ink-muted">Nghỉ</span>
            )}
          </div>
        ))}
      </div>
      <div>
        <p className="mb-2 text-sm font-semibold">Ngày ngoại lệ (nghỉ lễ, đổi giờ)</p>
        <div className="flex flex-col gap-2">
          {f.exceptions.map((e, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 text-sm">
              <input type="date" aria-label="Ngày ngoại lệ" className="rounded-control border border-field px-2 py-1" value={e.date} onChange={(ev) => updateEx(i, { ...e, date: ev.target.value })} />
              <label className="flex items-center gap-1">
                <input type="checkbox" checked={e.closed} onChange={(ev) => updateEx(i, { ...e, closed: ev.target.checked })} /> Nghỉ
              </label>
              {!e.closed && (
                <>
                  <TimeInput label="Ngoại lệ mở" value={e.opensAt} onChange={(v) => updateEx(i, { ...e, opensAt: v })} />–
                  <TimeInput label="Ngoại lệ đóng" value={e.closesAt} onChange={(v) => updateEx(i, { ...e, closesAt: v })} />
                </>
              )}
              <input aria-label="Ghi chú ngoại lệ" placeholder="Ghi chú" className="min-w-32 flex-1 rounded-control border border-field px-2 py-1" value={e.note} onChange={(ev) => updateEx(i, { ...e, note: ev.target.value })} />
              <button type="button" aria-label="Xóa ngoại lệ" className="p-1 text-ink-muted" onClick={() => updateEx(i, null)}>
                <Trash2 size={14} aria-hidden="true" />
              </button>
            </div>
          ))}
        </div>
        <GhostButton
          className="mt-1"
          icon={<Plus size={14} aria-hidden="true" />}
          onClick={() => setF((cur) => ({ ...cur, exceptions: [...cur.exceptions, { date: '', closed: true, opensAt: '10:00', closesAt: '20:00', note: '' }] }))}
        >
          Thêm ngày ngoại lệ
        </GhostButton>
      </div>
    </div>
  )
}

function TimeInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return <input type="time" aria-label={label} className="rounded-control border border-field px-2 py-1 tabular" value={value} onChange={(e) => onChange(e.target.value)} />
}

function StatusPanel({ place }: { place: Schemas['AdminPlace'] }) {
  const m = useAdminPlaceMutations(place.id)
  const toast = useToast()
  const [pending, setPending] = useState<{ action: TransitionAction; label: string } | null>(null)
  const [reason, setReason] = useState('')
  const blockers = place.publishBlockers ?? []
  const options = TRANSITIONS[place.status]

  const run = (action: TransitionAction, label: string, why?: string) =>
    m.transition.mutate(
      { action, reason: why },
      {
        onSuccess: (p) => {
          setPending(null)
          setReason('')
          toast.show(`Đã ${label.toLowerCase()} — trạng thái: ${PLACE_STATUS_LABELS[p.status]}`)
        },
        onError: (e) => toast.show(adminProblemMessage(e), { tone: 'error' }),
      },
    )

  return (
    <Panel title="Trạng thái & duyệt">
      {(place.status === 'DRAFT' || place.status === 'PENDING') &&
        (blockers.length === 0 ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CircleCheck size={16} aria-hidden="true" /> Đủ điều kiện xuất bản
          </p>
        ) : (
          <div className="text-sm">
            <p className="font-semibold text-attention">Còn thiếu để xuất bản:</p>
            <ul className="mt-1 flex flex-col gap-1">
              {blockers.map((b) => (
                <li key={b} className="flex items-start gap-1.5 text-ink-muted">
                  <CircleAlert size={14} className="mt-1 shrink-0 text-attention" aria-hidden="true" />
                  {b}
                </li>
              ))}
            </ul>
          </div>
        ))}
      {place.statusReason && <p className="mt-2 text-[13px] text-ink-muted">Lý do gần nhất: {place.statusReason}</p>}
      <div className="mt-3 flex flex-wrap gap-2">
        {options.map((o) => {
          const Button = o.tone === 'danger' ? DangerButton : o.tone === 'primary' ? PrimaryButton : SecondaryButton
          const blocked = (o.action === 'SUBMIT' || o.action === 'APPROVE') && blockers.length > 0
          return (
            <Button
              key={o.action}
              disabled={blocked}
              pending={m.transition.isPending && m.transition.variables?.action === o.action}
              onClick={() => (o.needsReason ? setPending(o) : run(o.action, o.label))}
            >
              {o.label}
            </Button>
          )
        })}
      </div>
      {place.status === 'PENDING' && (
        <p className="mt-2 text-[12px] text-ink-muted">Không tự duyệt được địa điểm do chính mình tạo — cần một quản trị viên khác duyệt.</p>
      )}
      {pending && (
        <Dialog
          open
          onClose={() => setPending(null)}
          title={pending.label}
          footer={
            <>
              <SecondaryButton onClick={() => setPending(null)}>Quay lại</SecondaryButton>
              <PrimaryButton pending={m.transition.isPending} disabled={!reason.trim()} onClick={() => run(pending.action, pending.label, reason.trim())}>
                Xác nhận
              </PrimaryButton>
            </>
          }
        >
          <Field.Root>
            <Field.Label>Lý do (hiện cho người biên tập và lưu vào nhật ký)</Field.Label>
            <Field.Textarea rows={3} maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} autoFocus />
          </Field.Root>
        </Dialog>
      )}
    </Panel>
  )
}

function ImagesPanel({ place, editable }: { place: Schemas['AdminPlace']; editable: boolean }) {
  const m = useAdminPlaceMutations(place.id)
  const toast = useToast()
  const [adding, setAdding] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [rights, setRights] = useState('')
  const [caption, setCaption] = useState('')
  const [cover, setCover] = useState(false)
  const preview = useMemo(() => (file ? URL.createObjectURL(file) : null), [file])
  const reset = () => {
    setAdding(false)
    setFile(null)
    setRights('')
    setCaption('')
    setCover(false)
    m.addImage.reset()
  }

  return (
    <Panel
      title={`Ảnh (${place.images.length})`}
      actions={
        editable && (
          <GhostButton icon={<ImagePlus size={16} aria-hidden="true" />} onClick={() => setAdding(true)}>
            Thêm ảnh
          </GhostButton>
        )
      }
    >
      {place.images.length === 0 ? (
        <p className="text-sm text-ink-muted">Chưa có ảnh. Cần ít nhất một ảnh có quyền sử dụng và chọn ảnh bìa để xuất bản.</p>
      ) : (
        <ul className="grid grid-cols-2 gap-2">
          {place.images.map((img) => (
            <li key={img.id} className="relative overflow-hidden rounded-control border border-line">
              <img src={img.url} alt={img.caption ?? place.name} className="aspect-[4/3] w-full bg-page object-cover" loading="lazy" />
              {img.cover && (
                <span className="absolute top-1 left-1 flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-attention">
                  <Star size={12} aria-hidden="true" /> Bìa
                </span>
              )}
              {editable && (
                <button
                  type="button"
                  aria-label="Xóa ảnh"
                  className="absolute top-1 right-1 rounded-full bg-white/90 p-1 text-danger"
                  onClick={() => m.removeImage.mutate(img.id, { onError: (e) => toast.show(adminProblemMessage(e), { tone: 'error' }) })}
                >
                  <Trash2 size={14} aria-hidden="true" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      {adding && (
        <Dialog
          open
          onClose={reset}
          title="Thêm ảnh"
          description="PNG hoặc JPEG, tối đa 5 MB. Chỉ đăng ảnh bạn có quyền sử dụng."
          footer={
            <>
              <SecondaryButton onClick={reset}>Hủy</SecondaryButton>
              <PrimaryButton
                pending={m.addImage.isPending}
                disabled={!file || !rights.trim()}
                onClick={() =>
                  m.addImage.mutate(
                    { file: file!, sourceRights: rights.trim(), caption: caption.trim(), cover: cover || place.images.length === 0 },
                    { onSuccess: () => (reset(), toast.show('Đã thêm ảnh')) },
                  )
                }
              >
                Tải lên
              </PrimaryButton>
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <Field.Root>
              <Field.Label>Tệp ảnh</Field.Label>
              <input type="file" accept="image/png,image/jpeg" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
            </Field.Root>
            {preview && <img src={preview} alt="Xem trước" className="max-h-48 rounded-control object-contain" />}
            <Field.Root hint>
              <Field.Label>Nguồn và quyền sử dụng</Field.Label>
              <Field.Hint>vd. “Ảnh tự chụp”, “Quán cung cấp, đồng ý sử dụng”</Field.Hint>
              <Field.Input value={rights} onChange={(e) => setRights(e.target.value)} maxLength={500} />
            </Field.Root>
            <Field.Root>
              <Field.Label optional>Chú thích</Field.Label>
              <Field.Input value={caption} onChange={(e) => setCaption(e.target.value)} maxLength={300} />
            </Field.Root>
            {place.images.length === 0 ? (
              <p className="text-[13px] text-ink-muted">Ảnh đầu tiên sẽ là ảnh bìa.</p>
            ) : (
              <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={cover} onChange={(e) => setCover(e.target.checked)} /> Đặt làm ảnh bìa (thay ảnh bìa hiện tại)
              </label>
            )}
            {m.addImage.error && <p role="alert" className="text-sm text-danger">{adminProblemMessage(m.addImage.error)}</p>}
          </div>
        </Dialog>
      )}
    </Panel>
  )
}

