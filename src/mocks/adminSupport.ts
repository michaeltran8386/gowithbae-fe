/**
 * MSW cho nội dung web, thông báo quản trị, báo sai và yêu cầu hỗ trợ — DỮ LIỆU MINH HỌA.
 * Mô phỏng quy tắc phía server: đóng báo sai phải có ghi chú; ticket đã đóng không mở lại/không trả lời;
 * banner bật phải có chữ, link phải http(s) hoặc bắt đầu bằng "/".
 */
import { http, HttpResponse } from 'msw'
import type { Schemas } from '../api/client.ts'
import { adminDb } from './admin.ts'

const API = '*/api/v1'
const json = HttpResponse.json
const isAdmin = (r: Request) => r.headers.get('Authorization') === 'Bearer mock-admin-token'
const problem = (status: number, detail: string, extra: Partial<Schemas['Problem']> = {}) =>
  json({ status, title: detail, detail, ...extra } satisfies Schemas['Problem'], { status, headers: { 'Content-Type': 'application/problem+json' } })
const unauthorized = () => problem(401, 'Chưa đăng nhập')
const pageOf = <T,>(items: T[]) => ({ items, page: { page: 0, size: 20, totalElements: items.length, totalPages: 1 } })
const ago = (min: number) => new Date(Date.now() - min * 60_000).toISOString()

const REPORT_NEXT: Record<string, string[]> = {
  NEW: ['NEW', 'CHECKING', 'RESOLVED', 'INSUFFICIENT'],
  CHECKING: ['CHECKING', 'RESOLVED', 'INSUFFICIENT'],
  RESOLVED: ['CHECKING'],
  INSUFFICIENT: ['CHECKING'],
}

export const supportDb = {
  content: {} as Schemas['AdminSiteContent'],
  sent: [] as Schemas['AdminNotificationSent'][],
  reports: [] as Schemas['PlaceReport'][],
  tickets: [] as Schemas['SupportTicketDetail'][],
}

export function resetSupportDb() {
  supportDb.content = {
    homeHero: { title: 'Tìm nơi hẹn hò', subtitle: 'Lọc theo khu vực, ngân sách cho hai người và việc hai bạn muốn làm.' },
    homeBanner: { enabled: false, text: '', linkUrl: null },
    faq: [
      { question: 'GoWithBae có mất phí không?', answer: 'Không. Bạn tìm địa điểm, lưu danh sách và mời người ấy cùng chọn hoàn toàn miễn phí.' },
      { question: 'Giá trên GoWithBae là giá gì?', answer: 'Là giá tham khảo cho hai người do đội ngũ tổng hợp.' },
    ],
    terms: { body: 'Điều khoản sử dụng đang được cập nhật.' },
    privacy: { body: '# Dữ liệu chúng tôi lưu\n\n- Email đăng nhập\n- Lịch sử phiên đăng nhập (thời điểm, IP, thiết bị)' },
    contact: { email: 'hello@gowithbae.test', phone: null, address: null, facebook: null },
    footer: { text: '© GoWithBae' },
    updatedAt: null,
    updatedBy: null,
  }
  supportDb.sent = [{ summary: 'Chào mừng bạn đến GoWithBae!', target: 'ALL', recipients: 3, sentAt: ago(60 * 24), sentBy: null }]
  supportDb.reports = [
    {
      id: 'r0000000-0000-4000-8000-000000000001',
      placeId: '00000000-0000-4000-8000-000000000001',
      placeName: 'Cà phê Mèo Mun',
      reason: 'WRONG_PRICE',
      description: 'Giá nước đã tăng lên 65k/ly từ tháng trước.',
      senderUserId: '0000000a-0000-4000-8000-000000000002',
      status: 'NEW',
      createdAt: ago(90),
    },
    {
      id: 'r0000000-0000-4000-8000-000000000002',
      placeId: '00000000-0000-4000-8000-000000000002',
      placeName: 'Rooftop Sông Sài Gòn',
      reason: 'WRONG_HOURS',
      status: 'RESOLVED',
      resolutionNote: 'Đã cập nhật giờ mở cửa theo fanpage.',
      createdAt: ago(60 * 30),
    },
  ]
  supportDb.tickets = [
    {
      id: 't0000000-0000-4000-8000-000000000001',
      category: 'ACCOUNT',
      subject: 'Không nhận được mã đăng nhập',
      status: 'NEW',
      createdAt: ago(45),
      updatedAt: ago(45),
      messages: [{ id: crypto.randomUUID(), authorName: 'Minh Anh', visibility: 'PUBLIC', body: 'Mình bấm gửi mã mấy lần mà không thấy email.', createdAt: ago(45) }],
    },
  ]
}
resetSupportDb()

const BANNER_LINK = /^(https?:\/\/|\/)/

export const supportHandlers = [
  // ───────── Nội dung web ─────────
  http.get(`${API}/site-content`, () => {
    const { updatedAt: _a, updatedBy: _b, ...pub } = supportDb.content
    return json(pub satisfies Schemas['SiteContent'])
  }),
  http.get(`${API}/admin/site-content`, ({ request }) => (isAdmin(request) ? json(supportDb.content) : unauthorized())),
  http.put(`${API}/admin/site-content`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const body = (await request.json()) as Schemas['SiteContent']
    if (body.homeBanner.enabled && !body.homeBanner.text.trim())
      return problem(400, 'Dữ liệu không hợp lệ', { errors: [{ field: 'homeBanner.text', message: 'Bật banner thì cần nội dung' }] })
    if (body.homeBanner.linkUrl && !BANNER_LINK.test(body.homeBanner.linkUrl))
      return problem(400, 'Dữ liệu không hợp lệ', { errors: [{ field: 'homeBanner.linkUrl', message: 'Link phải bắt đầu bằng http(s):// hoặc /' }] })
    supportDb.content = { ...body, updatedAt: new Date().toISOString(), updatedBy: adminDb.admin.id }
    return json(supportDb.content)
  }),

  // ───────── Thông báo ─────────
  http.post(`${API}/admin/notifications`, async ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const body = (await request.json()) as Schemas['AdminNotificationRequest']
    if (body.target === 'USER' && !adminDb.users.some((u) => u.id === body.userId && u.status === 'ACTIVE')) return problem(404, 'Không tìm thấy người nhận đang hoạt động')
    const sent: Schemas['AdminNotificationSent'] = {
      summary: body.summary,
      target: body.target,
      userId: body.userId ?? null,
      recipients: body.target === 'ALL' ? adminDb.users.filter((u) => u.status === 'ACTIVE').length : 1,
      sentAt: new Date().toISOString(),
      sentBy: adminDb.admin.id,
    }
    supportDb.sent.unshift(sent)
    return json(sent, { status: 201 })
  }),
  http.get(`${API}/admin/notifications/sent`, ({ request }) => (isAdmin(request) ? json(pageOf(supportDb.sent)) : unauthorized())),

  // Quản trị viên mở web người dùng: chuông thông báo của chính họ (backend thật cho phép mọi tài khoản đã đăng nhập).
  http.get(`${API}/notifications`, ({ request }) => (isAdmin(request) ? json({ ...pageOf([]), unreadCount: 0 }) : undefined)),

  // ───────── Báo sai ─────────
  http.get(`${API}/admin/place-reports`, ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const status = new URL(request.url).searchParams.get('status')
    return json(pageOf(supportDb.reports.filter((r) => !status || r.status === status)) satisfies Schemas['PlaceReportPage'])
  }),
  http.get(`${API}/admin/place-reports/:id`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const r = supportDb.reports.find((x) => x.id === params.id)
    return r ? json(r) : problem(404, 'Không tìm thấy')
  }),
  http.post(`${API}/admin/place-reports/:id/transitions`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const r = supportDb.reports.find((x) => x.id === params.id)
    if (!r) return problem(404, 'Không tìm thấy')
    const { status, note } = (await request.json()) as { status: Schemas['PlaceReportStatus']; note?: string }
    if ((status === 'RESOLVED' || status === 'INSUFFICIENT') && !note?.trim()) return problem(400, 'Đóng báo sai bắt buộc phải có ghi chú xử lý')
    if (!REPORT_NEXT[r.status].includes(status)) return problem(409, 'Không thể chuyển trạng thái')
    r.status = status
    if (note?.trim()) r.resolutionNote = note.trim()
    r.updatedAt = new Date().toISOString()
    return json(r)
  }),

  // ───────── Yêu cầu hỗ trợ ─────────
  http.get(`${API}/admin/support-tickets`, ({ request }) => {
    if (!isAdmin(request)) return unauthorized()
    const status = new URL(request.url).searchParams.get('status')
    const items = supportDb.tickets.filter((t) => !status || t.status === status).map(({ messages: _m, ...t }) => t)
    return json(pageOf(items) satisfies Schemas['SupportTicketPage'])
  }),
  http.get(`${API}/admin/support-tickets/:id`, ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const t = supportDb.tickets.find((x) => x.id === params.id)
    return t ? json(t) : problem(404, 'Không tìm thấy')
  }),
  http.post(`${API}/admin/support-tickets/:id/messages`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const t = supportDb.tickets.find((x) => x.id === params.id)
    if (!t) return problem(404, 'Không tìm thấy')
    if (t.status === 'CLOSED') return problem(409, 'Yêu cầu hỗ trợ đã đóng')
    const { body, visibility } = (await request.json()) as { body: string; visibility: Schemas['MessageVisibility'] }
    const msg: Schemas['SupportMessage'] = { id: crypto.randomUUID(), authorName: 'Chủ dự án', fromStaff: true, visibility, body, createdAt: new Date().toISOString() }
    t.messages.push(msg)
    if (t.status === 'NEW' && visibility === 'PUBLIC') t.status = 'IN_PROGRESS'
    t.updatedAt = msg.createdAt
    return json(msg, { status: 201 })
  }),
  http.post(`${API}/admin/support-tickets/:id/transitions`, async ({ request, params }) => {
    if (!isAdmin(request)) return unauthorized()
    const t = supportDb.tickets.find((x) => x.id === params.id)
    if (!t) return problem(404, 'Không tìm thấy')
    if (t.status === 'CLOSED') return problem(409, 'Yêu cầu hỗ trợ đã đóng, không thể mở lại')
    t.status = ((await request.json()) as { status: Schemas['TicketStatus'] }).status
    t.updatedAt = new Date().toISOString()
    return json(t)
  }),
]
