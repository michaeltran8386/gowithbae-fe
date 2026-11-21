/**
 * MSW cho quản trị nội dung (địa điểm, ảnh, CSV, nhãn/khu vực, bộ sưu tập) — DỮ LIỆU MINH HỌA.
 * Mô phỏng các quy tắc chính phía server: điều kiện xuất bản (RULE-20), vòng đời trạng thái, chỉ sửa nháp/chờ duyệt.
 */
import { http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client.ts'
import { areas, taxonomies } from './data.ts'

const API = '*/api/v1'
/** id quản trị viên đang đăng nhập trong mock (adminDb.admin) — dùng cho RULE-21 không tự duyệt. */
const MOCK_ADMIN_ID = '0000000a-0000-4000-8000-000000000001'
const json = HttpResponse.json
const ADMIN = 'Bearer mock-admin-token'
const isAdmin = (r: Request) => r.headers.get('Authorization') === ADMIN
const problem = (status: number, detail: string, extra: Partial<Schemas['Problem']> = {}) =>
  json({ status, title: detail, detail, ...extra } satisfies Schemas['Problem'], { status, headers: { 'Content-Type': 'application/problem+json' } })
const unauthorized = () => problem(401, 'Chưa đăng nhập')
const page = (n: number): Schemas['PageMeta'] => ({ page: 0, size: 20, totalElements: n, totalPages: 1 })

type Place = Schemas['AdminPlace']
const category = taxonomies.find((t) => t.group === 'CATEGORY')!
const activity = taxonomies.find((t) => t.group === 'ACTIVITY')!

function blockers(p: Place): string[] {
  const b: string[] = []
  if (!p.description) b.push('Thiếu mô tả')
  if (p.images.length === 0) b.push('Chưa có ảnh có quyền sử dụng')
  else if (!p.images.some((i) => i.cover)) b.push('Chưa chọn ảnh bìa')
  if (!p.tags.some((t) => t.group === 'ACTIVITY')) b.push('Chưa có hoạt động chính')
  if (!p.source || !p.verifiedAt) b.push('Thiếu nguồn dữ liệu hoặc ngày kiểm tra')
  return b
}
const withBlockers = (p: Place): Place => ({ ...p, publishBlockers: blockers(p) })

function newPlace(over: Partial<Place>): Place {
  return {
    id: crypto.randomUUID(),
    code: 'NEW-001',
    name: 'Địa điểm mới',
    category,
    area: areas[0],
    address: '1 Đường Thử',
    lat: 10.77,
    lng: 106.7,
    images: [],
    tags: [],
    price: { status: 'UNKNOWN' },
    hours: { status: 'UNKNOWN', weekly: [], exceptions: [] },
    status: 'DRAFT',
    createdBy: '0000000a-0000-4000-8000-000000000002',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...over,
  }
}

export const catalogDb = {
  places: [] as Place[],
  collections: [] as Schemas['CollectionDetail'][],
  taxonomies: [] as Schemas['Taxonomy'][],
  areas: [] as Schemas['Area'][],
  batches: new Map<string, Schemas['ImportBatch']>(),
}

export function resetCatalogDb() {
  catalogDb.taxonomies = taxonomies.map((t) => ({ ...t }))
  catalogDb.areas = areas.map((a) => ({ ...a }))
  catalogDb.places = [
    newPlace({ code: 'MOCK-PENDING', name: 'Quán Chờ Duyệt Mẫu', status: 'PENDING', description: 'Đủ điều kiện', tags: [activity], source: 'Khảo sát', verifiedAt: '2026-11-01', images: [{ id: crypto.randomUUID(), url: '/favicon.svg', sortOrder: 0, cover: true }] }),
    newPlace({ code: 'MOCK-DRAFT', name: 'Quán Nháp Thiếu Ảnh', status: 'DRAFT' }),
  ]
  catalogDb.collections = [{ id: crypto.randomUUID(), title: 'Hẹn đầu nhẹ nhàng', body: 'Mẫu', places: [] }]
  catalogDb.batches.clear()
}
resetCatalogDb()

function applyWrite(p: Place, w: Schemas['AdminPlaceWrite']): Place {
  return {
    ...p,
    code: w.code,
    name: w.name,
    category: catalogDb.taxonomies.find((t) => t.id === w.categoryId) ?? p.category,
    area: catalogDb.areas.find((a) => a.id === w.areaId) ?? p.area,
    address: w.address,
    lat: w.lat,
    lng: w.lng,
    description: w.description ?? null,
    phone: w.phone ?? null,
    website: w.website ?? null,
    notes: w.notes ?? null,
    reservationRecommended: w.reservationRecommended ?? null,
    tags: catalogDb.taxonomies.filter((t) => w.tagIds?.includes(t.id)),
    price: w.price ? { status: w.price.status, standardForTwo: w.price.standardForTwo, min: w.price.min, max: w.price.max, includes: w.price.includes } : { status: 'UNKNOWN' },
    hours: w.hours ?? { status: 'UNKNOWN' },
    source: w.source ?? null,
    verifiedAt: w.verifiedAt ?? null,
    updatedAt: new Date().toISOString(),
  }
}

/** Thẻ địa điểm rút gọn: trang sửa bộ sưu tập chỉ dùng id và tên. */
const collectionFields = (w: Schemas['CollectionWrite']) => ({
  title: w.title,
  body: w.body ?? null,
  visibleFrom: w.visibleFrom ?? null,
  visibleUntil: w.visibleUntil ?? null,
  places: w.placeIds.map((id) => ({ id, name: catalogDb.places.find((p) => p.id === id)?.name ?? id }) as Schemas['PlaceCard']),
})

/** Kiểm tra CSV giả lập (chỉ xét mã chi nhánh ở cột đầu). Dùng chung cho handler và test. */
export function mockValidateCsv(text: string): Schemas['ImportBatch'] | null {
  const lines = text.trim().split(/\r?\n/).slice(1)
  if (!lines.length) return null
  const rows = lines.map((l, i) => {
    const code = l.split(',')[0]
    const valid = /^[A-Z0-9_-]{3,40}$/.test(code)
    return { rowNumber: i + 2, placeCode: code || null, valid, errors: valid ? [] : ['Mã chi nhánh chỉ gồm A–Z, 0–9, _ hoặc -, dài 3–40 ký tự'] }
  })
  const errorRows = rows.filter((r) => !r.valid).length
  const batch: Schemas['ImportBatch'] = { id: crypto.randomUUID(), status: errorRows ? 'INVALID' : 'VALIDATED', templateVersion: 'v1', totalRows: rows.length, errorRows, rows, createdAt: new Date().toISOString(), committedAt: null }
  catalogDb.batches.set(batch.id, batch)
  return batch
}

const NEXT: Record<string, Record<string, Schemas['PlaceStatus']>> = {
  SUBMIT: { DRAFT: 'PENDING' },
  APPROVE: { PENDING: 'PUBLISHED' },
  RETURN: { PENDING: 'DRAFT' },
  HIDE: { PUBLISHED: 'HIDDEN' },
  DEACTIVATE: { PUBLISHED: 'INACTIVE' },
  RESTORE: { HIDDEN: 'PENDING', INACTIVE: 'PENDING' },
}

export const catalogHandlers = [
  // ───────── Địa điểm ─────────
  http.get(`${API}/admin/places`, ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const items = catalogDb.places.filter((p) => (!status || p.status === status) && (!q || p.name.toLowerCase().includes(q) || p.code.toLowerCase().includes(q))).map(withBlockers)
    return json({ items, page: page(items.length) } satisfies Schemas['AdminPlacePage'])
  }),
  http.post(`${API}/admin/places`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const w = (await request.json()) as Schemas['AdminPlaceWrite']
    if (catalogDb.places.some((p) => p.code === w.code)) return problem(409, 'Mã chi nhánh đã tồn tại', { code: 'PLACE_CODE_TAKEN' })
    const p = applyWrite(newPlace({ createdBy: '0000000a-0000-4000-8000-000000000001' }), w)
    catalogDb.places.unshift(p)
    return json(withBlockers(p), { status: 201 })
  }),
  http.get(`${API}/admin/places/:id`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const p = catalogDb.places.find((x) => x.id === params.id)
    return p ? json(withBlockers(p)) : problem(404, 'Không tìm thấy')
  }),
  http.put(`${API}/admin/places/:id`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const i = catalogDb.places.findIndex((x) => x.id === params.id)
    if (i < 0) return problem(404, 'Không tìm thấy')
    if (!['DRAFT', 'PENDING'].includes(catalogDb.places[i].status)) return problem(409, 'Chỉ sửa được nháp hoặc chờ duyệt', { code: 'PLACE_NOT_EDITABLE' })
    catalogDb.places[i] = applyWrite(catalogDb.places[i], (await request.json()) as Schemas['AdminPlaceWrite'])
    return json(withBlockers(catalogDb.places[i]))
  }),
  http.post(`${API}/admin/places/:id/transitions`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const p = catalogDb.places.find((x) => x.id === params.id)
    if (!p) return problem(404, 'Không tìm thấy')
    const { action, reason } = (await request.json()) as { action: string; reason?: string }
    const to = NEXT[action]?.[p.status]
    if (!to) return problem(409, 'Không thể chuyển trạng thái', { code: 'INVALID_TRANSITION' })
    if ((action === 'SUBMIT' || action === 'APPROVE') && blockers(p).length) return problem(400, 'Chưa đủ điều kiện xuất bản')
    if (action === 'APPROVE' && p.createdBy === MOCK_ADMIN_ID) return problem(403, 'Không được tự duyệt địa điểm do chính mình tạo')
    p.status = to
    p.statusReason = reason ?? null
    p.updatedAt = new Date().toISOString()
    return json(withBlockers(p))
  }),
  http.post(`${API}/uploads`, () =>
    json({ id: crypto.randomUUID(), contentType: 'image/png', sizeBytes: 100, url: null } satisfies Schemas['StoredFile'], { status: 201 }),
  ),
  http.post(`${API}/admin/places/:id/images`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const p = catalogDb.places.find((x) => x.id === params.id)
    if (!p) return problem(404, 'Không tìm thấy')
    const w = (await request.json()) as Schemas['PlaceImageWrite']
    if (w.cover) p.images = p.images.map((i) => ({ ...i, cover: false }))
    const img: Schemas['PlaceImage'] = { id: crypto.randomUUID(), url: '/favicon.svg', caption: w.caption ?? null, sortOrder: p.images.length, cover: !!w.cover }
    p.images.push(img)
    return json(img, { status: 201 })
  }),
  http.delete(`${API}/admin/places/:id/images/:imageId`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const p = catalogDb.places.find((x) => x.id === params.id)
    if (!p) return problem(404, 'Không tìm thấy')
    p.images = p.images.filter((i) => i.id !== params.imageId)
    return new HttpResponse(null, { status: 204 })
  }),

  // ───────── Nhãn & khu vực ─────────
  http.get(`${API}/admin/taxonomies`, ({ request }) => (isAdmin(request) ? json(catalogDb.taxonomies) : unauthorized())),
  http.post(`${API}/admin/taxonomies`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const w = (await request.json()) as Schemas['TaxonomyWrite']
    if (catalogDb.taxonomies.some((t) => t.group === w.group && t.code === w.code)) return problem(409, 'Mã nhãn đã tồn tại trong nhóm này', { code: 'TAXONOMY_CODE_TAKEN' })
    const t: Schemas['Taxonomy'] = { id: crypto.randomUUID(), group: w.group, code: w.code, name: w.name, status: 'ACTIVE' }
    catalogDb.taxonomies.push(t)
    return json(t, { status: 201 })
  }),
  http.patch(`${API}/admin/taxonomies/:id`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const t = catalogDb.taxonomies.find((x) => x.id === params.id)
    if (!t) return problem(404, 'Không tìm thấy')
    Object.assign(t, Object.fromEntries(Object.entries((await request.json()) as object).filter(([, v]) => v !== undefined)))
    return json(t)
  }),
  http.post(`${API}/admin/areas`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const w = (await request.json()) as Schemas['AreaWrite']
    const a: Schemas['Area'] = { id: crypto.randomUUID(), code: w.code, name: w.name, status: 'ACTIVE' }
    catalogDb.areas.push(a)
    return json(a, { status: 201 })
  }),

  // ───────── Bộ sưu tập ─────────
  http.get(`${API}/admin/collections`, ({ request }) => (isAdmin(request) ? json(catalogDb.collections) : unauthorized())),
  http.post(`${API}/admin/collections`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const w = (await request.json()) as Schemas['CollectionWrite']
    const c: Schemas['CollectionDetail'] = { id: crypto.randomUUID(), ...collectionFields(w) }
    catalogDb.collections.push(c)
    return json(c, { status: 201 })
  }),
  http.put(`${API}/admin/collections/:id`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const i = catalogDb.collections.findIndex((c) => c.id === params.id)
    if (i < 0) return problem(404, 'Không tìm thấy')
    catalogDb.collections[i] = { id: catalogDb.collections[i].id, ...collectionFields((await request.json()) as Schemas['CollectionWrite']) }
    return json(catalogDb.collections[i])
  }),
  http.delete(`${API}/admin/collections/:id`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    catalogDb.collections = catalogDb.collections.filter((c) => c.id !== params.id)
    return new HttpResponse(null, { status: 204 })
  }),

  // ───────── Nhập CSV ─────────
  http.get(`${API}/admin/imports/template.csv`, ({ request }) => (isAdmin(request) ? new HttpResponse('code,name\n', { headers: { 'Content-Type': 'text/csv' } }) : unauthorized())),
  http.post(`${API}/admin/imports`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const form = await request.formData()
    const text = await (form.get('file') as File).text()
    const batch = mockValidateCsv(text)
    return batch ? json(batch, { status: 201 }) : problem(400, 'File không có dòng dữ liệu', { errors: [{ field: 'file', message: 'Cần ít nhất một dòng sau tiêu đề' }] })
  }),
  http.get(`${API}/admin/imports/:id`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const b = catalogDb.batches.get(params.id as string)
    return b ? json(b) : problem(404, 'Không tìm thấy')
  }),
  http.post(`${API}/admin/imports/:id/commit`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const b = catalogDb.batches.get(params.id as string)
    if (!b) return problem(404, 'Không tìm thấy')
    if (b.status !== 'VALIDATED') return problem(409, 'Lô còn dòng lỗi; sửa file và tải lại', { code: 'RULE-23' })
    b.status = 'COMMITTED'
    b.committedAt = new Date().toISOString()
    b.rows?.forEach((r) => catalogDb.places.push(newPlace({ code: r.placeCode ?? 'X', name: `Nhập từ CSV ${r.placeCode}` })))
    return json(b)
  }),
]
