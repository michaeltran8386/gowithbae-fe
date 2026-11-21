/**
 * MSW cho link mời xem kế hoạch — DỮ LIỆU MINH HỌA. Mô phỏng quy tắc server: mỗi kế hoạch một link đang hiệu lực,
 * tạo lại thì link cũ hết hiệu lực, chỉ mời được kế hoạch sắp tới, người nhận không thấy ghi chú riêng.
 */
import { http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client.ts'
import { MOCK_TOKEN, toCard } from './data.ts'
import { db, findPlace } from './db.ts'

const API = '*/api/v1'
const json = HttpResponse.json
const problem = (status: number, detail: string) =>
  json({ status, title: detail, detail } satisfies Schemas['Problem'], { status, headers: { 'Content-Type': 'application/problem+json' } })
const isMember = (r: Request) => r.headers.get('Authorization') === `Bearer ${MOCK_TOKEN}`

type Invite = { token: string; planId: string; createdAt: string; revoked: boolean; response: Schemas['PlanInviteResponse'] | null; guestName: string | null; respondedAt: string | null }

export const inviteDb = { invites: [] as Invite[], notifications: 0 }
export function resetPlanInvites() {
  inviteDb.invites = []
  inviteDb.notifications = 0
}

const expiresAt = (scheduledAt: string) => new Date(new Date(scheduledAt).getTime() + 86400_000).toISOString()
const active = (planId: string) => inviteDb.invites.find((i) => i.planId === planId && !i.revoked)

function view(i: Invite): Schemas['PlanInviteView'] | null {
  const plan = db.plans.find((p) => p.id === i.planId)
  const place = plan && findPlace(plan.placeId)
  if (!plan || !place || i.revoked || Date.now() > new Date(expiresAt(plan.scheduledAt)).getTime()) return null
  const status: Schemas['DatePlanStatus'] = plan.status === 'CANCELLED' ? 'CANCELLED' : new Date(plan.scheduledAt).getTime() > Date.now() ? 'SCHEDULED' : 'PAST'
  return {
    ownerName: db.me.displayName ?? 'Bạn',
    place: toCard(place),
    placeAvailable: true,
    scheduledAt: plan.scheduledAt,
    status,
    expiresAt: expiresAt(plan.scheduledAt),
    response: i.response,
    guestName: i.guestName,
    warnings: [],
  }
}

export const planInviteHandlers = [
  http.post(`${API}/date-plans/:id/invite`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const plan = db.plans.find((p) => p.id === params.id)
    if (!plan) return problem(404, 'Không tìm thấy kế hoạch')
    if (plan.status !== 'SCHEDULED' || new Date(plan.scheduledAt).getTime() <= Date.now()) return problem(409, 'Chỉ mời được cho kế hoạch sắp tới, chưa hủy')
    inviteDb.invites.forEach((i) => i.planId === plan.id && (i.revoked = true))
    const token = crypto.randomUUID().replaceAll('-', '') + 'pl'
    inviteDb.invites.push({ token, planId: plan.id, createdAt: new Date().toISOString(), revoked: false, response: null, guestName: null, respondedAt: null })
    return json({ inviteUrl: `${location.origin}/plan-invite/${token}`, expiresAt: expiresAt(plan.scheduledAt) } satisfies Schemas['PlanInviteCreated'], { status: 201 })
  }),
  http.get(`${API}/date-plans/:id/invite`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const plan = db.plans.find((p) => p.id === params.id)
    const i = plan && active(plan.id)
    if (!plan || !i) return problem(404, 'Kế hoạch chưa có link mời')
    return json({ createdAt: i.createdAt, expiresAt: expiresAt(plan.scheduledAt), response: i.response, guestName: i.guestName, respondedAt: i.respondedAt } satisfies Schemas['PlanInviteStatus'])
  }),
  http.delete(`${API}/date-plans/:id/invite`, ({ request, params }) => {
    if (!isMember(request)) return problem(401, 'Chưa đăng nhập')
    const i = active(params.id as string)
    if (!i) return problem(404, 'Kế hoạch chưa có link mời')
    i.revoked = true
    return new HttpResponse(null, { status: 204 })
  }),
  http.get(`${API}/plan-invites/:token`, ({ params }) => {
    const i = inviteDb.invites.find((x) => x.token === params.token)
    const v = i && view(i)
    return v ? json(v) : problem(410, 'Link mời không hợp lệ, đã hết hạn hoặc đã bị thu hồi')
  }),
  http.put(`${API}/plan-invites/:token/response`, async ({ params, request }) => {
    const i = inviteDb.invites.find((x) => x.token === params.token)
    const v = i && view(i)
    if (!i || !v) return problem(410, 'Link mời không hợp lệ, đã hết hạn hoặc đã bị thu hồi')
    if (v.status !== 'SCHEDULED') return problem(409, 'Kế hoạch đã hủy hoặc đã qua, không trả lời được nữa')
    const body = (await request.json()) as Schemas['PlanInviteRespond']
    i.response = body.response
    i.guestName = body.guestName?.trim() || i.guestName
    i.respondedAt = new Date().toISOString()
    inviteDb.notifications++
    return json(view(i)!)
  }),
  http.get(`${API}/plan-invites/:token/calendar.ics`, ({ params }) => {
    const i = inviteDb.invites.find((x) => x.token === params.token)
    return i && view(i) ? new HttpResponse('BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n', { headers: { 'Content-Type': 'text/calendar' } }) : problem(410, 'Link mời không còn hiệu lực')
  }),
]
