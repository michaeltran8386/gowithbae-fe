/**
 * MSW handler cho toàn bộ operation web khách F1 — DỮ LIỆU MINH HỌA.
 * Hành vi bám contract + SRS (RULE-02/03/04/05/06/07/08/10/11/12/30). Các chính sách PROP
 * (ranh giới giá OQ-03, điều kiện chốt OQ-08…) mô phỏng mặc định đã ghi trong docs, không phải chính sách đã duyệt.
 */
import { http, HttpResponse, delay } from 'msw'
import type { Schemas } from '../api/client.ts'
import { hoursOn } from '../lib/hours.ts'
import { vnParts } from '../lib/format.ts'
import { adminHandlers } from './admin.ts'
import { supportHandlers } from './adminSupport.ts'
import { MOCK_OTP, MOCK_TOKEN, areas, collections, places, taxonomies, toCard } from './data.ts'
import {
  collectionSummary,
  db,
  findPlace,
  isVisible,
  listDetail,
  listSummary,
  newId,
  planView,
  sessionView,
  type Session,
} from './db.ts'

const API = '*/api/v1'
const json = HttpResponse.json

const problem = (status: number, title: string, extra: Partial<Schemas['Problem']> = {}) =>
  json({ status, title, traceId: `mock-${Date.now().toString(36)}`, ...extra } satisfies Schemas['Problem'], {
    status,
    headers: { 'Content-Type': 'application/problem+json' },
  })
const notFound = () => problem(404, 'Không tìm thấy')
const badRequest = (field: string, message: string) => problem(400, 'Dữ liệu không hợp lệ', { errors: [{ field, message }] })

function isMember(request: Request) {
  return request.headers.get('Authorization') === `Bearer ${MOCK_TOKEN}`
}

function recipientSessionOf(request: Request): Session | null {
  const token = request.headers.get('X-Recipient-Session')
  if (!token?.startsWith('rs-')) return null
  const s = db.sessions.find((x) => x.id === token.slice(3))
  // RULE-12: phiên người nhận chỉ còn quyền khi grant còn hiệu lực — thu hồi có hiệu lực ngay.
  return s && s.grant?.status === 'VALID' ? s : null
}

const normalize = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()

function inBudget(price: Schemas['Price'], band: Schemas['BudgetBand']) {
  if (price.status !== 'KNOWN' || price.standardForTwo == null) return false // RULE-04
  const p = price.standardForTwo
  switch (band) {
    case 'FREE':
      return p === 0
    case 'UNDER_200K':
      return p > 0 && p < 200_000
    case 'FROM_200K_TO_400K':
      return p >= 200_000 && p < 400_000
    case 'FROM_400K_TO_700K':
      return p >= 400_000 && p <= 700_000
    case 'OVER_700K':
      return p > 700_000
  }
}

const OR_GROUPS: Schemas['TaxonomyGroup'][] = ['CATEGORY', 'ACTIVITY', 'STYLE', 'SCENERY', 'OCCASION']

function matchesTags(tagIds: string[], placeTagIds: Set<string>) {
  const byGroup = new Map<Schemas['TaxonomyGroup'], string[]>()
  for (const id of tagIds) {
    const tx = taxonomies.find((x) => x.id === id)
    if (!tx) continue
    byGroup.set(tx.group, [...(byGroup.get(tx.group) ?? []), id])
  }
  // RULE-02: giữa các nhóm AND; trong nhóm OR hoặc AND tùy nhóm
  return [...byGroup].every(([group, ids]) =>
    OR_GROUPS.includes(group) ? ids.some((id) => placeTagIds.has(id)) : ids.every((id) => placeTagIds.has(id)),
  )
}

function openAt(p: (typeof places)[number], iso: string) {
  const day = hoursOn(p.hours, iso)
  if (day.kind !== 'open') return false // giờ chưa rõ không đạt lọc (RULE-05)
  const { time } = vnParts(iso)
  return day.ranges.some((r) => r.opensAt <= time && time < r.closesAt)
}

function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const rad = (d: number) => (d * Math.PI) / 180
  const a = Math.sin(rad(lat2 - lat1) / 2) ** 2 + Math.cos(rad(lat1)) * Math.cos(rad(lat2)) * Math.sin(rad(lng2 - lng1) / 2) ** 2
  return Math.round(6371 * 2 * Math.asin(Math.sqrt(a)) * 10) / 10
}

const visiblePlaces = () => places.filter((p) => !p.hidden)

export const handlers = [
  // Quản trị trước: chặn request của quản trị viên, phần còn lại rơi xuống handler web khách
  ...adminHandlers,
  ...supportHandlers,
  // ───────── Discovery ─────────
  http.get(`${API}/collections`, () => json(collections.map(collectionSummary))),
  http.get(`${API}/collections/:id`, ({ params }) => {
    const c = collections.find((x) => x.id === params.id)
    if (!c) return notFound()
    return json({
      ...collectionSummary(c),
      body: c.body,
      visibleFrom: c.visibleFrom,
      visibleUntil: c.visibleUntil,
      places: c.placeIds.filter(isVisible).map((id) => toCard(findPlace(id)!)), // AC-042
    } satisfies Schemas['CollectionDetail'])
  }),
  http.get(`${API}/taxonomies`, () => json(taxonomies)),
  http.get(`${API}/areas`, () => json(areas)),

  // ───────── Places ─────────
  http.get(`${API}/places`, async ({ request }) => {
    await delay(250)
    const url = new URL(request.url)
    const q = url.searchParams.get('q')?.trim()
    const areaId = url.searchParams.get('areaId')
    const budget = url.searchParams.get('budget') as Schemas['BudgetBand'] | null
    const at = url.searchParams.get('at')
    const tagIds = url.searchParams.getAll('tagIds')
    const lat = Number(url.searchParams.get('lat'))
    const lng = Number(url.searchParams.get('lng'))
    const hasOrigin = url.searchParams.has('lat') && url.searchParams.has('lng')
    const radiusKm = url.searchParams.get('radiusKm')
    const sort = url.searchParams.get('sort') ?? 'DEFAULT'
    const page = Number(url.searchParams.get('page') ?? 0)
    const size = Number(url.searchParams.get('size') ?? 20)
    if (sort === 'NEAREST' && !hasOrigin) return badRequest('sort', 'Cần điểm xuất phát để sắp xếp theo gần nhất')

    let result = visiblePlaces().map((p) => ({ p, d: hasOrigin && p.lat != null && p.lng != null ? distanceKm(lat, lng, p.lat, p.lng) : null }))
    if (q) {
      const nq = normalize(q)
      result = result.filter(({ p }) =>
        [p.name, p.area?.name ?? '', ...p.tags.map((x) => x.name)].some((s) => normalize(s).includes(nq)),
      )
    }
    if (areaId) result = result.filter(({ p }) => p.area?.id === areaId)
    if (budget) result = result.filter(({ p }) => inBudget(p.price, budget))
    if (tagIds.length) result = result.filter(({ p }) => matchesTags(tagIds, new Set(p.tags.map((x) => x.id))))
    if (at) result = result.filter(({ p }) => openAt(p, at))
    if (hasOrigin && radiusKm) result = result.filter(({ d }) => d !== null && d <= Number(radiusKm))

    const priceOf = (p: (typeof places)[number]) =>
      p.price.status === 'KNOWN' ? (p.price.standardForTwo ?? Number.POSITIVE_INFINITY) : Number.POSITIVE_INFINITY
    if (sort === 'PRICE_ASC') result.sort((a, b) => priceOf(a.p) - priceOf(b.p)) // giá chưa rõ xếp cuối
    else if (sort === 'NEAREST') result.sort((a, b) => (a.d ?? 0) - (b.d ?? 0))
    else result.sort((a, b) => (b.p.verifiedAt ?? '').localeCompare(a.p.verifiedAt ?? '') || a.p.code.localeCompare(b.p.code))

    const items = result.slice(page * size, page * size + size).map(({ p, d }) => toCard(p, d))
    return json({
      searchId: crypto.randomUUID(),
      items,
      page: { page, size, totalElements: result.length, totalPages: Math.max(1, Math.ceil(result.length / size)) },
    } satisfies Schemas['PlaceSearchPage'])
  }),
  http.get(`${API}/places/compare`, ({ request }) => {
    const ids = (new URL(request.url).searchParams.get('ids') ?? '').split(',').filter(Boolean)
    if (ids.length < 2 || ids.length > 3 || new Set(ids).size !== ids.length)
      return problem(400, 'So sánh cần 2–3 địa điểm khác nhau', { code: 'RULE-06' })
    if (!ids.every(isVisible)) return notFound()
    return json(ids.map((id) => findPlace(id)!) satisfies Schemas['PlaceDetail'][])
  }),
  http.get(`${API}/places/:id`, async ({ params }) => {
    await delay(200)
    const p = findPlace(String(params.id))
    if (!p || p.hidden) return notFound() // AC-004
    const { hidden: _hidden, ...detail } = p
    return json(detail satisfies Schemas['PlaceDetail'])
  }),
  http.post(`${API}/places/:id/reports`, async ({ params, request }) => {
    if (!isVisible(String(params.id))) return notFound()
    const body = (await request.json()) as Schemas['PlaceReportCreate']
    if (!body.reason) return badRequest('reason', 'Hãy chọn loại thông tin sai')
    db.reports += 1
    if (db.reports > 5) return problem(429, 'Gửi quá nhiều', {}) // RULE-18
    return json({ id: newId('0000000c'), status: 'NEW', createdAt: new Date().toISOString() } satisfies Schemas['PlaceReportReceipt'], {
      status: 201,
    })
  }),

  // ───────── Auth / Me ─────────
  http.post(`${API}/auth/otp/request`, async ({ request }) => {
    const { email } = (await request.json()) as { email: string }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email ?? '')) return badRequest('email', 'Email không hợp lệ')
    return new HttpResponse(null, { status: 202 })
  }),
  http.post(`${API}/auth/otp/verify`, async ({ request }) => {
    await delay(300)
    const { email, code } = (await request.json()) as { email: string; code: string }
    if (code !== MOCK_OTP) return badRequest('code', 'Mã không đúng hoặc đã hết hạn')
    db.me.email = email
    return json({ accessToken: MOCK_TOKEN, expiresAt: new Date(Date.now() + 86400_000).toISOString(), user: db.me } satisfies Schemas['AuthToken'])
  }),
  http.post(`${API}/auth/logout`, () => new HttpResponse(null, { status: 204 })),
  http.get(`${API}/me`, ({ request }) => (isMember(request) ? json(db.me) : problem(401, 'Chưa đăng nhập'))),
  http.patch(`${API}/me`, async ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const body = (await request.json()) as Schemas['UserUpdate']
    if (body.displayName !== undefined && !body.displayName.trim()) return badRequest('displayName', 'Tên hiển thị không được để trống')
    if (body.displayName) db.me.displayName = body.displayName.trim()
    return json(db.me)
  }),
  http.post(`${API}/me/email-change`, async ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const { newEmail } = (await request.json()) as { newEmail: string }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(newEmail ?? '')) return badRequest('newEmail', 'Email không hợp lệ')
    pendingEmail = newEmail
    return new HttpResponse(null, { status: 202 })
  }),
  http.post(`${API}/me/email-change/verify`, async ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const { code } = (await request.json()) as { code: string }
    if (code !== MOCK_OTP || !pendingEmail) return badRequest('code', 'Mã không đúng hoặc đã hết hạn')
    db.me.email = pendingEmail
    pendingEmail = null
    return json(db.me)
  }),
  http.post(`${API}/me/deletion-request`, ({ request }) =>
    isMember(request) ? new HttpResponse(null, { status: 202 }) : problem(401, 'Chưa đăng nhập'),
  ),

  // ───────── Saved lists ─────────
  http.get(`${API}/saved-lists`, ({ request }) => (isMember(request) ? json(db.savedLists.map(listSummary)) : problem(401, 'Chưa đăng nhập'))),
  http.post(`${API}/saved-lists`, async ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const { name } = (await request.json()) as Schemas['SavedListWrite']
    if (!name?.trim()) return badRequest('name', 'Hãy đặt tên danh sách')
    const list = { id: newId('00000006'), name: name.trim(), createdAt: new Date().toISOString(), items: [] }
    db.savedLists.push(list)
    return json(listSummary(list), { status: 201 })
  }),
  http.get(`${API}/saved-lists/:id`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const l = db.savedLists.find((x) => x.id === params.id)
    return l ? json(listDetail(l)) : notFound()
  }),
  http.patch(`${API}/saved-lists/:id`, async ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const l = db.savedLists.find((x) => x.id === params.id)
    if (!l) return notFound()
    const { name } = (await request.json()) as Schemas['SavedListWrite']
    if (!name?.trim()) return badRequest('name', 'Hãy đặt tên danh sách')
    l.name = name.trim()
    return json(listSummary(l))
  }),
  http.delete(`${API}/saved-lists/:id`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const i = db.savedLists.findIndex((x) => x.id === params.id)
    if (i < 0) return notFound()
    db.savedLists.splice(i, 1) // RULE-07: không xóa place/plan
    return new HttpResponse(null, { status: 204 })
  }),
  http.put(`${API}/saved-lists/:id/places/:placeId`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const l = db.savedLists.find((x) => x.id === params.id)
    if (!l || !isVisible(String(params.placeId))) return notFound()
    if (!l.items.some((x) => x.placeId === params.placeId))
      l.items.push({ placeId: String(params.placeId), addedAt: new Date().toISOString() }) // idempotent
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${API}/saved-lists/:id/places/:placeId`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const l = db.savedLists.find((x) => x.id === params.id)
    if (!l) return notFound()
    l.items = l.items.filter((x) => x.placeId !== params.placeId)
    return new HttpResponse(null, { status: 204 })
  }),

  // ───────── Choice sessions ─────────
  http.get(`${API}/choice-sessions`, ({ request }) =>
    isMember(request) ? json(db.sessions.filter((s) => s.creatorIsMe).map((s) => sessionView(s, 'CREATOR'))) : problem(401, 'Chưa đăng nhập'),
  ),
  http.post(`${API}/choice-sessions`, async ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const { placeIds } = (await request.json()) as { placeIds: string[] }
    if (!Array.isArray(placeIds) || placeIds.length < 2 || placeIds.length > 5 || new Set(placeIds).size !== placeIds.length)
      return problem(400, 'Số địa điểm không hợp lệ', { code: 'RULE-08' })
    if (!placeIds.every(isVisible)) return problem(400, 'Có địa điểm không còn hiển thị', { code: 'RULE-01' })
    const token = `moi-${Math.random().toString(36).slice(2, 10)}`
    const s: Session = {
      id: newId('00000007'),
      creatorIsMe: true,
      creatorName: db.me.displayName,
      recipientName: null,
      candidateIds: placeIds,
      votes: { creator: {}, recipient: {} },
      status: 'WAITING',
      grant: { id: newId('00000008'), token, status: 'VALID', expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString() },
      datePlanId: null,
      createdAt: new Date().toISOString(),
      finalizedAt: null,
    }
    db.sessions.push(s)
    const view = sessionView(s, 'CREATOR')
    return json(
      {
        ...view,
        shareGrant: { ...view.activeShareGrant!, inviteToken: token, inviteUrl: `${new URL(request.url).origin}/invite/${token}` },
      } satisfies Schemas['ChoiceSessionCreated'],
      { status: 201 },
    )
  }),
  http.get(`${API}/choice-sessions/:id`, ({ request, params }) => {
    const s = db.sessions.find((x) => x.id === params.id)
    if (!s) return notFound()
    if (isMember(request) && s.creatorIsMe) return json(sessionView(s, 'CREATOR'))
    if (recipientSessionOf(request)?.id === s.id) return json(sessionView(s, 'RECIPIENT'))
    return notFound()
  }),
  http.put(`${API}/choice-sessions/:id/votes/:candidateId`, async ({ request, params }) => {
    const s = db.sessions.find((x) => x.id === params.id)
    if (!s) return notFound()
    const role = isMember(request) && s.creatorIsMe ? 'creator' : recipientSessionOf(request)?.id === s.id ? 'recipient' : null
    if (!role) return notFound()
    if (s.status === 'FINALIZED') return problem(409, 'Phiên đã chốt', { code: 'RULE-11' }) // AC-018
    if (!s.candidateIds.includes(String(params.candidateId))) return notFound()
    const { preference } = (await request.json()) as { preference: Schemas['VotePreference'] }
    s.votes[role][String(params.candidateId)] = preference
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${API}/choice-sessions/:id/finalize`, async ({ request, params }) => {
    await delay(300)
    const s = db.sessions.find((x) => x.id === params.id)
    if (!s || !isMember(request) || !s.creatorIsMe) return notFound()
    if (s.status === 'FINALIZED') return problem(409, 'Phiên đã chốt', { code: 'RULE-11' })
    if (s.status === 'WAITING') return problem(409, 'Chưa có người cùng chọn tham gia', { code: 'OQ-08' }) // PROP
    const body = (await request.json()) as { candidateId: string; scheduledAt: string; note?: string }
    if (!isVisible(body.candidateId)) return problem(409, 'Địa điểm không còn hiển thị', { code: 'RULE-01' })
    const err = validateSchedule(body.candidateId, body.scheduledAt)
    if (err) return err
    const plan = {
      id: newId('00000009'),
      placeId: body.candidateId,
      scheduledAt: body.scheduledAt,
      note: body.note ?? null,
      status: 'SCHEDULED' as const,
      choiceSessionId: s.id,
      visitAnswer: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.plans.push(plan)
    s.status = 'FINALIZED'
    s.datePlanId = plan.id
    s.finalizedAt = new Date().toISOString()
    return json(planView(plan, 'OWNER'), { status: 201 })
  }),
  http.post(`${API}/choice-sessions/:id/share-grants`, ({ request, params }) => {
    const s = db.sessions.find((x) => x.id === params.id)
    if (!s || !isMember(request) || !s.creatorIsMe) return notFound()
    if (s.grant?.status === 'VALID') s.grant.status = 'REVOKED'
    const token = `moi-${Math.random().toString(36).slice(2, 10)}`
    s.grant = { id: newId('00000008'), token, status: 'VALID', expiresAt: new Date(Date.now() + 7 * 86400_000).toISOString() }
    return json(
      {
        id: s.grant.id,
        status: 'VALID',
        expiresAt: s.grant.expiresAt,
        inviteToken: token,
        inviteUrl: `${new URL(request.url).origin}/invite/${token}`,
      } satisfies Schemas['ShareGrantCreated'],
      { status: 201 },
    )
  }),
  http.delete(`${API}/choice-sessions/:id/share-grants/:grantId`, ({ request, params }) => {
    const s = db.sessions.find((x) => x.id === params.id)
    if (!s?.grant || !isMember(request) || !s.creatorIsMe || s.grant.id !== params.grantId) return notFound()
    s.grant.status = 'REVOKED'
    return new HttpResponse(null, { status: 204 })
  }),
  http.delete(`${API}/choice-sessions/:id/recipient`, ({ request, params }) => {
    const s = db.sessions.find((x) => x.id === params.id)
    if (!s || !isMember(request) || !s.creatorIsMe) return notFound()
    s.recipientName = null
    if (s.grant) s.grant.status = 'REVOKED'
    return new HttpResponse(null, { status: 204 })
  }),

  // ───────── Share grants (người nhận, không cần tài khoản) ─────────
  http.get(`${API}/share-grants/:token`, ({ params }) => {
    const s = db.sessions.find((x) => x.grant?.token === params.token)
    if (!s || s.grant?.status !== 'VALID') return problem(410, 'Liên kết không còn hiệu lực')
    return json({
      creatorName: s.creatorName,
      candidateCount: s.candidateIds.length,
      candidates: s.candidateIds.map((id) => toCard(findPlace(id)!)),
      slotAvailable: s.recipientName === null,
      expiresAt: s.grant.expiresAt,
    } satisfies Schemas['ShareGrantPreview'])
  }),
  http.post(`${API}/share-grants/:token/join`, async ({ params, request }) => {
    await delay(300)
    const s = db.sessions.find((x) => x.grant?.token === params.token)
    if (!s || s.grant?.status !== 'VALID') return problem(410, 'Liên kết không còn hiệu lực')
    const { displayName } = (await request.json()) as { displayName: string }
    if (!displayName?.trim()) return badRequest('displayName', 'Hãy nhập tên hiển thị')
    if (s.recipientName !== null) return problem(409, 'Suất đã có người', { code: 'SLOT_TAKEN' }) // AC-015
    s.recipientName = displayName.trim()
    s.status = 'VOTING'
    return json({ recipientSession: `rs-${s.id}`, choiceSessionId: s.id } satisfies Schemas['RecipientSessionToken'])
  }),

  // ───────── Date plans ─────────
  http.get(`${API}/date-plans`, ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const status = new URL(request.url).searchParams.get('status')
    return json(db.plans.filter((p) => !status || p.status === status).map((p) => planView(p, 'OWNER')))
  }),
  http.post(`${API}/date-plans`, async ({ request }) => {
    await delay(300)
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const body = (await request.json()) as Schemas['DatePlanWrite']
    if (!isVisible(body.placeId)) return problem(409, 'Địa điểm không còn hiển thị', { code: 'RULE-01' })
    const err = validateSchedule(body.placeId, body.scheduledAt)
    if (err) return err
    const plan = {
      id: newId('00000009'),
      placeId: body.placeId,
      scheduledAt: body.scheduledAt,
      note: body.note?.trim() || null,
      status: 'SCHEDULED' as const,
      choiceSessionId: null,
      visitAnswer: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    db.plans.push(plan)
    return json(planView(plan, 'OWNER'), { status: 201 })
  }),
  http.get(`${API}/date-plans/:id`, ({ request, params }) => {
    const p = db.plans.find((x) => x.id === params.id)
    if (!p) return notFound()
    if (isMember(request)) return json(planView(p, 'OWNER'))
    const rs = recipientSessionOf(request)
    if (rs && rs.datePlanId === p.id) return json(planView(p, 'RECIPIENT'))
    return notFound()
  }),
  http.patch(`${API}/date-plans/:id`, async ({ request, params }) => {
    if (!isMember(request)) return notFound() // AC-025: người nhận không sửa được
    const p = db.plans.find((x) => x.id === params.id)
    if (!p) return notFound()
    if (p.status !== 'SCHEDULED') return problem(409, 'Kế hoạch không còn sửa được', { code: 'OQ-10' })
    const body = (await request.json()) as Schemas['DatePlanUpdate']
    const placeId = body.placeId ?? p.placeId
    if (!isVisible(placeId)) return problem(409, 'Địa điểm không còn hiển thị', { code: 'RULE-01' }) // AC-026
    if (body.scheduledAt || body.placeId) {
      const err = validateSchedule(placeId, body.scheduledAt ?? p.scheduledAt)
      if (err) return err
    }
    p.placeId = placeId
    if (body.scheduledAt) p.scheduledAt = body.scheduledAt
    if (body.note !== undefined) p.note = body.note?.trim() || null
    p.updatedAt = new Date().toISOString()
    return json(planView(p, 'OWNER'))
  }),
  http.post(`${API}/date-plans/:id/cancel`, ({ request, params }) => {
    if (!isMember(request)) return notFound()
    const p = db.plans.find((x) => x.id === params.id)
    if (!p) return notFound()
    if (p.status !== 'SCHEDULED') return problem(409, 'Kế hoạch không còn hủy được')
    p.status = 'CANCELLED'
    p.updatedAt = new Date().toISOString()
    return json(planView(p, 'OWNER'))
  }),
  http.get(`${API}/date-plans/:id/calendar.ics`, ({ params }) => {
    const p = db.plans.find((x) => x.id === params.id)
    if (!p) return notFound()
    const place = findPlace(p.placeId)!
    const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '')
    const end = new Date(new Date(p.scheduledAt).getTime() + 2 * 3600_000).toISOString()
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//GoWithBae//Mock//VI',
      'BEGIN:VEVENT',
      `UID:${p.id}@gowithbae`,
      `DTSTAMP:${stamp(new Date().toISOString())}`,
      `DTSTART:${stamp(p.scheduledAt)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:Hẹn tại ${place.name}`,
      `LOCATION:${place.address}`,
      'DESCRIPTION:Giờ Việt Nam. Kế hoạch này chưa giữ chỗ tại địa điểm.',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')
    return new HttpResponse(ics, { headers: { 'Content-Type': 'text/calendar; charset=utf-8' } })
  }),
  http.put(`${API}/date-plans/:id/visit-report`, async ({ request, params }) => {
    if (!isMember(request)) return notFound() // OQ-10: mặc định chỉ chủ kế hoạch tự xác nhận
    const p = db.plans.find((x) => x.id === params.id)
    if (!p) return notFound()
    if (p.status === 'CANCELLED' || new Date(p.scheduledAt).getTime() > Date.now())
      return problem(409, 'Chưa đến giờ hẹn hoặc kế hoạch đã hủy', { code: 'RULE-15' })
    const { answer } = (await request.json()) as { answer: 'YES' | 'NO' }
    p.visitAnswer = answer // lặp lại không tạo lượt mới (RULE-29)
    return new HttpResponse(null, { status: 204 })
  }),

  // ───────── Support ─────────
  http.get(`${API}/support-tickets`, ({ request }) =>
    isMember(request) ? json(db.tickets.map(({ messages: _m, ...t }) => t)) : problem(401, 'Chưa đăng nhập'),
  ),
  http.post(`${API}/support-tickets`, async ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const body = (await request.json()) as Schemas['SupportTicketCreate']
    if (!body.subject?.trim()) return badRequest('subject', 'Hãy nhập chủ đề')
    if (!body.body?.trim()) return badRequest('body', 'Hãy mô tả vấn đề')
    const now = new Date().toISOString()
    const ticket: Schemas['SupportTicketDetail'] = {
      id: newId('0000000a'),
      category: body.category,
      subject: body.subject.trim(),
      status: 'NEW',
      assigneeName: null,
      createdAt: now,
      updatedAt: now,
      messages: [{ id: newId(), authorName: db.me.displayName, fromStaff: false, visibility: 'PUBLIC', body: body.body.trim(), createdAt: now }],
    }
    db.tickets.unshift(ticket)
    return json(ticket, { status: 201 })
  }),
  http.get(`${API}/support-tickets/:id`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const t = db.tickets.find((x) => x.id === params.id)
    if (!t) return notFound()
    return json({ ...t, messages: t.messages.filter((m) => m.visibility === 'PUBLIC') }) // RULE-19
  }),
  http.post(`${API}/support-tickets/:id/messages`, async ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const t = db.tickets.find((x) => x.id === params.id)
    if (!t) return notFound()
    if (t.status === 'CLOSED') return problem(409, 'Yêu cầu đã đóng', { code: 'OQ-13' })
    const { body } = (await request.json()) as Schemas['MessageCreate']
    if (!body?.trim()) return badRequest('body', 'Hãy nhập nội dung')
    const msg: Schemas['SupportMessage'] = {
      id: newId(),
      authorName: db.me.displayName,
      fromStaff: false,
      visibility: 'PUBLIC',
      body: body.trim(),
      createdAt: new Date().toISOString(),
    }
    t.messages.push(msg)
    if (t.status === 'WAITING_CUSTOMER') t.status = 'IN_PROGRESS'
    t.updatedAt = msg.createdAt
    return json(msg, { status: 201 })
  }),

  // ───────── Notifications ─────────
  http.get(`${API}/notifications`, ({ request }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const items = db.notifications
    return json({
      items,
      page: { page: 0, size: 20, totalElements: items.length, totalPages: 1 },
      unreadCount: items.filter((n) => !n.readAt).length,
    } satisfies Schemas['NotificationPage'])
  }),
  http.post(`${API}/notifications/:id/read`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const n = db.notifications.find((x) => x.id === params.id)
    if (!n) return notFound()
    n.readAt ??= new Date().toISOString()
    return new HttpResponse(null, { status: 204 })
  }),

  // ───────── Events ─────────
  http.post(`${API}/events`, () => new HttpResponse(null, { status: 202 })),
]

let pendingEmail: string | null = null

function validateSchedule(placeIdValue: string, scheduledAt: string) {
  if (new Date(scheduledAt).getTime() <= Date.now()) return badRequest('scheduledAt', 'Hãy chọn thời điểm trong tương lai')
  const p = findPlace(placeIdValue)!
  const day = hoursOn(p.hours, scheduledAt)
  if (day.kind === 'closed') return problem(409, 'Địa điểm đóng cửa', { code: 'RULE-05' })
  if (day.kind === 'open') {
    const { time } = vnParts(scheduledAt)
    if (!day.ranges.some((r) => r.opensAt <= time && time < r.closesAt)) return problem(409, 'Địa điểm đóng cửa', { code: 'RULE-05' })
  }
  return null // giờ chưa rõ: cho tạo, kèm warnings HOURS_UNKNOWN (FR-15)
}
