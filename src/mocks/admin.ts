/**
 * MSW cho trang quản trị — DỮ LIỆU MINH HỌA. Đặt trước handler web khách để chặn phần dành cho quản trị viên;
 * request không phải của quản trị viên trả `undefined` để rơi xuống handler sau.
 */
import { http, HttpResponse, delay } from 'msw'
import type { Schemas } from '../api/client.ts'
import { MOCK_OTP } from './data.ts'
import { catalogHandlers } from './adminCatalog.ts'

const API = '*/api/v1'
const json = HttpResponse.json

export const MOCK_ADMIN_TOKEN = 'mock-admin-token'
export const MOCK_ADMIN_EMAIL = 'admin@gowithbae.test'
/** Mã Authenticator hợp lệ trong mock. */
export const MOCK_STAFF_CODE = '654321'
export const MOCK_ACTIVATION_TOKEN = 'a'.repeat(43)

const problem = (status: number, title: string, extra: Partial<Schemas['Problem']> = {}) =>
  json({ status, title, ...extra } satisfies Schemas['Problem'], { status, headers: { 'Content-Type': 'application/problem+json' } })

const iso = (minutesAgo: number) => new Date(Date.now() - minutesAgo * 60_000).toISOString()
const page = (n: number, p = 0, size = 20): Schemas['PageMeta'] => ({ page: p, size, totalElements: n, totalPages: Math.max(1, Math.ceil(n / size)) })

export const adminDb = {
  admin: {
    id: '0000000a-0000-4000-8000-000000000001',
    email: MOCK_ADMIN_EMAIL,
    displayName: 'Chủ dự án',
    avatarUrl: null,
    roles: ['SUPER_ADMIN'],
    status: 'ACTIVE',
  } as Schemas['User'],
  users: [] as Schemas['AdminUser'][],
  audit: [] as Schemas['AuditLog'][],
}

function resetAdminDb() {
  adminDb.users = [
    { ...adminDb.admin, createdAt: iso(60 * 24 * 30), lockedReason: null },
    { id: '0000000a-0000-4000-8000-000000000002', email: 'linh@example.com', displayName: 'Linh', avatarUrl: null, roles: ['MEMBER'], status: 'ACTIVE', createdAt: iso(60 * 24 * 5), lockedReason: null },
    { id: '0000000a-0000-4000-8000-000000000003', email: 'spam@example.com', displayName: 'Tài khoản rác', avatarUrl: null, roles: ['MEMBER'], status: 'LOCKED', createdAt: iso(60 * 24 * 2), lockedReason: 'Spam báo sai' },
    {
      id: '0000000a-0000-4000-8000-000000000004', email: 'roi-di@example.com', displayName: 'Muốn rời đi', avatarUrl: null, roles: ['MEMBER'],
      status: 'DELETION_REQUESTED', createdAt: iso(60 * 24 * 40), lockedReason: null,
      deletionRequestedAt: iso(60 * 24 * 3), scheduledDeletionAt: new Date(Date.now() + 27 * 86400_000).toISOString(),
    },
  ]
  adminDb.audit = [
    { id: 1, actorId: adminDb.admin.id, action: 'USER_LOCKED', objectType: 'app_user', objectId: '0000000a-0000-4000-8000-000000000003', reason: 'Spam báo sai', createdAt: iso(60 * 24) },
  ]
}
resetAdminDb()
export { resetAdminDb }

const isAdmin = (request: Request) => request.headers.get('Authorization') === `Bearer ${MOCK_ADMIN_TOKEN}`
const findUser = (id: string) => adminDb.users.find((u) => u.id === id)
let auditSeq = 100
function audit(action: string, objectId: string, reason: string | null = null) {
  adminDb.audit.unshift({ id: ++auditSeq, actorId: adminDb.admin.id, action, objectType: 'app_user', objectId, reason, createdAt: new Date().toISOString() })
}
const activation = (): Schemas['MfaActivationLink'] => ({
  activationUrl: `${location.origin}/admin/activate/${MOCK_ACTIVATION_TOKEN}`,
  expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
})

export const adminHandlers = [
  // ───────── Đăng nhập 2 bước của quản trị viên ─────────
  http.post(`${API}/auth/otp/verify`, async ({ request }) => {
    const body = (await request.clone().json()) as { email: string; code: string; staffCode?: string }
    if (body.email?.toLowerCase() !== MOCK_ADMIN_EMAIL) return undefined
    await delay(200)
    if (body.code !== MOCK_OTP) return problem(400, 'Mã không hợp lệ hoặc đã hết hiệu lực')
    if (!body.staffCode) return problem(401, 'Nhập mã 6 số trong ứng dụng Authenticator', { code: 'STAFF_CODE_REQUIRED' })
    if (body.staffCode !== MOCK_STAFF_CODE) return problem(400, 'Mã không hợp lệ hoặc đã hết hiệu lực')
    return json({ accessToken: MOCK_ADMIN_TOKEN, expiresAt: new Date(Date.now() + 86_400_000).toISOString(), user: adminDb.admin } satisfies Schemas['AuthToken'])
  }),
  http.get(`${API}/me`, ({ request }) => (isAdmin(request) ? json(adminDb.admin) : undefined)),

  http.get(`${API}/auth/mfa-activation/:token`, ({ params }) =>
    params.token === MOCK_ACTIVATION_TOKEN
      ? json({
          email: MOCK_ADMIN_EMAIL,
          otpauthUri: `otpauth://totp/GoWithBae:${MOCK_ADMIN_EMAIL}?secret=JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP&issuer=GoWithBae`,
          secret: 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP',
          expiresAt: new Date(Date.now() + 86_400_000).toISOString(),
        } satisfies Schemas['MfaActivationPreview'])
      : problem(410, 'Link kích hoạt không hợp lệ, đã dùng hoặc đã hết hạn'),
  ),
  http.post(`${API}/auth/mfa-activation/:token`, async ({ request }) => {
    const { code } = (await request.json()) as { code: string }
    return code === MOCK_STAFF_CODE ? new HttpResponse(null, { status: 204 }) : problem(400, 'Mã xác nhận không đúng')
  }),

  // ───────── Tổng quan ─────────
  http.get(`${API}/admin/reports/summary`, ({ request }) =>
    isAdmin(request)
      ? json({
          dataUpdatedAt: new Date().toISOString(),
          activeMembers: { value: 128 },
          activeAnonymous: { value: 940 },
          searches: { value: 3210 },
          zeroResultRate: { value: 0.07 },
          placeViews: { value: 5120 },
          saves: { value: 412 },
          searchToPlanRate: { value: 0.12 },
          medianMinutesToPlan: { value: null, note: 'Chưa đủ dữ liệu' },
          retention30d: { value: null, note: 'Cohort chưa đủ 30 ngày' },
          placesMissingPrice: { value: 3 },
          placesMissingHours: { value: 2 },
          openPlaceReports: { value: 1 },
        } satisfies Schemas['ReportSummary'])
      : problem(401, 'Chưa đăng nhập'),
  ),
  http.get(`${API}/admin/reports/export.csv`, ({ request }) =>
    isAdmin(request) ? new HttpResponse('metric,value\nactiveMembers,128\n', { headers: { 'Content-Type': 'text/csv' } }) : problem(401, 'Chưa đăng nhập'),
  ),
  // Địa điểm, CSV, nhãn, bộ sưu tập: src/mocks/adminCatalog.ts
  ...catalogHandlers,
  // Nội dung web, thông báo, báo sai, ticket: src/mocks/adminSupport.ts (đăng ký trong handlers.ts)

  // ───────── Người dùng ─────────
  http.get(`${API}/admin/users`, ({ request }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const url = new URL(request.url)
    const q = (url.searchParams.get('q') ?? '').toLowerCase()
    const status = url.searchParams.get('status')
    const items = adminDb.users.filter((u) => (!q || u.email.includes(q) || u.displayName.toLowerCase().includes(q)) && (!status || u.status === status))
    return json({ items, page: page(items.length) } satisfies Schemas['AdminUserPage'])
  }),
  http.post(`${API}/admin/users`, async ({ request }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const body = (await request.json()) as Schemas['AdminCreateUserRequest']
    const email = body.email.trim().toLowerCase()
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return problem(400, 'Dữ liệu không hợp lệ', { errors: [{ field: 'email', message: 'Email không hợp lệ' }] })
    if (adminDb.users.some((u) => u.email === email)) return problem(409, 'Conflict', { code: 'EMAIL_TAKEN', detail: 'Email đã có tài khoản' })
    const roles = body.roles?.length ? body.roles : (['MEMBER'] as Schemas['Role'][])
    const user: Schemas['AdminUser'] = { id: crypto.randomUUID(), email, displayName: body.displayName || 'Thành viên', avatarUrl: null, roles, status: 'ACTIVE', createdAt: new Date().toISOString(), lockedReason: null }
    adminDb.users.unshift(user)
    audit('USER_CREATED', user.id)
    return json({ user, ...(roles.some((r) => r !== 'MEMBER') ? { activation: activation() } : {}) } satisfies Schemas['AdminUserCreated'], { status: 201 })
  }),
  http.get(`${API}/admin/users/:id`, ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const u = findUser(params.id as string)
    if (!u) return problem(404, 'Không tìm thấy')
    return json({ ...u, mfaEnrolled: u.roles.includes('SUPER_ADMIN'), lastLoginAt: iso(120), lastSeenAt: iso(5), activeSessions: u.status === 'ACTIVE' ? 1 : 0 } satisfies Schemas['AdminUserDetail'])
  }),
  http.get(`${API}/admin/users/:id/sessions`, ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    if (!findUser(params.id as string)) return problem(404, 'Không tìm thấy')
    const items: Schemas['AdminSession'][] = [
      { id: crypto.randomUUID(), createdAt: iso(120), expiresAt: iso(-360), lastSeenAt: iso(5), ipAddress: '113.161.10.20', userAgent: 'Mozilla/5.0 (Windows NT 10.0) Chrome/130.0', active: true },
      { id: crypto.randomUUID(), createdAt: iso(60 * 30), expiresAt: iso(60 * 22), lastSeenAt: iso(60 * 29), ipAddress: '27.72.1.9', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0) Safari/604.1', active: false, revokedAt: null },
    ]
    return json({ items, page: page(items.length) } satisfies Schemas['AdminSessionPage'])
  }),
  http.get(`${API}/admin/users/:id/activity`, ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    if (!findUser(params.id as string)) return problem(404, 'Không tìm thấy')
    return json({
      savedLists: 2, savedPlaces: 7, choiceSessionsCreated: 1, choiceSessionsFinalized: 1, plansScheduled: 1, plansCancelled: 0, plansPast: 2,
      visitsConfirmed: 2, supportTickets: 0, placeReports: 1,
      recentEvents: [
        { name: 'place_viewed', occurredAt: iso(5), objectId: 'DEMO-001', platform: 'WEB_DESKTOP' },
        { name: 'search_performed', occurredAt: iso(7), platform: 'WEB_DESKTOP' },
      ],
    } satisfies Schemas['AdminUserActivity'])
  }),
  ...(['lock', 'unlock'] as const).map((action) =>
    http.post(`${API}/admin/users/:id/${action}`, async ({ request, params }) => {
      if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
      const u = findUser(params.id as string)
      if (!u) return problem(404, 'Không tìm thấy')
      const { reason } = (await request.json()) as { reason: string }
      u.status = action === 'lock' ? 'LOCKED' : 'ACTIVE'
      u.lockedReason = action === 'lock' ? reason : null
      audit(action === 'lock' ? 'USER_LOCKED' : 'USER_UNLOCKED', u.id, reason)
      return json(u)
    }),
  ),
  http.post(`${API}/admin/users/:id/restore`, async ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const u = findUser(params.id as string)
    if (!u) return problem(404, 'Không tìm thấy')
    if (u.status !== 'DELETION_REQUESTED') return problem(409, 'Chỉ khôi phục được tài khoản đang chờ xóa')
    const { reason } = (await request.json()) as { reason: string }
    Object.assign(u, { status: 'ACTIVE', deletionRequestedAt: null, scheduledDeletionAt: null })
    audit('USER_RESTORED', u.id, reason)
    return json(u)
  }),
  http.post(`${API}/admin/users/:id/erase`, async ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const u = findUser(params.id as string)
    if (!u) return problem(404, 'Không tìm thấy')
    const { reason, confirmEmail } = (await request.json()) as { reason: string; confirmEmail: string }
    if (u.status === 'DELETED') return problem(409, 'Tài khoản đã bị xóa')
    if (u.id === adminDb.admin.id) return problem(409, 'Không thể tự xóa tài khoản của mình')
    if (confirmEmail.trim().toLowerCase() !== u.email.toLowerCase()) return problem(400, 'Email xác nhận không khớp')
    Object.assign(u, {
      email: `deleted+${u.id}@deleted.invalid`, displayName: 'Tài khoản đã xóa', roles: [], status: 'DELETED', lockedReason: null,
      deletionRequestedAt: null, scheduledDeletionAt: null, deletedAt: new Date().toISOString(),
    })
    audit('USER_ERASED', u.id, reason)
    return json(u)
  }),
  http.put(`${API}/admin/users/:id/roles`, async ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const u = findUser(params.id as string)
    if (!u) return problem(404, 'Không tìm thấy')
    const { roles, reason } = (await request.json()) as { roles: Schemas['Role'][]; reason: string }
    u.roles = roles
    audit('USER_ROLES_CHANGED', u.id, reason)
    return json(u)
  }),
  http.post(`${API}/admin/users/:id/sessions/revoke`, ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    if (!findUser(params.id as string)) return problem(404, 'Không tìm thấy')
    audit('USER_SESSIONS_REVOKED', params.id as string)
    return new HttpResponse(null, { status: 204 })
  }),
  http.post(`${API}/admin/users/:id/mfa-activation`, ({ request, params }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const u = findUser(params.id as string)
    if (!u) return problem(404, 'Không tìm thấy')
    if (!u.roles.some((r) => r !== 'MEMBER')) return problem(409, 'Chỉ tài khoản quản trị mới cần kích hoạt TOTP')
    return json(activation())
  }),

  // ───────── Nhật ký ─────────
  http.get(`${API}/admin/audit-logs`, ({ request }) => {
    if (!isAdmin(request)) return problem(401, 'Chưa đăng nhập')
    const url = new URL(request.url)
    const objectId = url.searchParams.get('objectId')
    const items = adminDb.audit.filter((a) => !objectId || a.objectId === objectId)
    return json({ items, page: page(items.length) } satisfies Schemas['AuditLogPage'])
  }),
]
