/**
 * Kiểm thử bổ sung cho các AC cấp UC (Phase 6), chạy ứng dụng thật trên dữ liệu minh họa (MSW).
 * AC phụ thuộc quyền/đồng thời ở server (AC-015 đồng thời thật, AC-021/022, AC-025 phía server…) chỉ kiểm tra được
 * phần frontend phản ánh; xác minh thật cần backend.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { session } from '../api/client.ts'
import { db } from '../mocks/db.ts'
import { placeId, taxonomies } from '../mocks/data.ts'
import { vnParts } from '../lib/format.ts'
import { renderApp } from './render.tsx'
import { http, HttpResponse } from 'msw'
import { server } from '../mocks/server.ts'
import { collections } from '../mocks/data.ts'

const tag = (group: string, name: string) => taxonomies.find((t) => t.group === group && t.name === name)!.id
const tomorrow = () => vnParts(new Date(Date.now() + 86400_000).toISOString()).date
/** Danh sách mẫu "Cuối tuần này" (đứng sau danh sách mặc định "Đã lưu"). */
const weekend = () => db.savedLists.find((l) => l.name === 'Cuối tuần này')!

describe('UC-001 Tìm và lọc', () => {
  it('AC-001: tìm không dấu + ngân sách 200–<400k + hai tiện ích/không khí chỉ trả nơi đạt đủ', async () => {
    const q = new URLSearchParams({ q: 'gom', budget: 'FROM_200K_TO_400K' })
    q.append('tagIds', tag('VIBE', 'Yên tĩnh'))
    q.append('tagIds', tag('AMENITY', 'Khu không hút thuốc'))
    renderApp(`/search?${q}`)
    expect(await screen.findByRole('heading', { name: '1 địa điểm' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Xưởng gốm Đất Lành' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Cà phê Mái Hiên' })).not.toBeInTheDocument()
  })

  it('FR-03/AC-P02: 0 kết quả vẫn giữ nguyên điều kiện và cho bỏ từng điều kiện', async () => {
    const { user, router } = renderApp(`/search?budget=FREE&tagIds=${tag('FEATURE', 'Band nhạc')}`)
    expect(await screen.findByRole('heading', { name: 'Không có địa điểm khớp tất cả điều kiện' })).toBeInTheDocument()
    const chips = screen.getByRole('list', { name: 'Điều kiện đang áp dụng' })
    expect(within(chips).getByRole('button', { name: /Miễn phí/ })).toBeInTheDocument()
    await user.click(within(chips).getByRole('button', { name: /Band nhạc/ }))
    await waitFor(() => expect(router.state.location.search).not.toContain('tagIds'))
    expect(router.state.location.search).toContain('budget=FREE') // không tự nới điều kiện khác
  })
})

describe('UC-003 So sánh', () => {
  it('AC-006: trường thiếu hiển thị "Chưa có thông tin", không đổi thành "Không có"', async () => {
    renderApp(`/compare?ids=${placeId(0)},${placeId(2)}`)
    const table = await screen.findByRole('table')
    const priceRow = within(table).getByRole('rowheader', { name: 'Giá cho hai người' }).closest('tr')!
    expect(within(priceRow).getByText('Chưa có thông tin')).toBeInTheDocument()
    expect(within(table).queryByText('Không có')).not.toBeInTheDocument()
  })
})

describe('UC-006 Danh sách đã lưu', () => {
  it('AC-056: khách bấm Lưu được chuyển đăng nhập kèm intent, quay lại đúng địa điểm', async () => {
    const { user, router } = renderApp(`/places/${placeId(1)}`)
    await screen.findByRole('heading', { level: 1, name: 'Cà phê Mái Hiên' })
    await user.click(screen.getAllByRole('button', { name: 'Lưu Cà phê Mái Hiên' })[0])
    await screen.findByRole('heading', { name: 'Đăng nhập GoWithBae' })
    expect(router.state.location.search).toContain('intent=save')
    expect(decodeURIComponent(router.state.location.search)).toContain(`/places/${placeId(1)}`)
  })

  it('AC-011: lưu lại nơi đã có trong danh sách không tạo bản ghi trùng', async () => {
    const { user } = renderApp(`/places/${placeId(0)}?intent=save`, { member: true })
    const dialog = await screen.findByRole('dialog', { name: 'Lưu vào danh sách' })
    await user.click(await within(dialog).findByRole('button', { name: /Cuối tuần này/ }))
    await screen.findByText(/Đã lưu vào “Cuối tuần này”/)
    expect(weekend().items.filter((i) => i.placeId === placeId(0))).toHaveLength(1)
  })

  it('AC-012: xóa danh sách không xóa kế hoạch', async () => {
    const plansBefore = db.plans.length
    const { user, router } = renderApp(`/saved/${weekend().id}`, { member: true })
    await screen.findByRole('heading', { level: 1, name: 'Cuối tuần này' })
    await user.click(screen.getByRole('button', { name: 'Xóa' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/kế hoạch buổi hẹn của bạn không bị xóa/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Xóa danh sách' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/saved'))
    expect(db.savedLists.map((l) => l.name)).toEqual(['Đã lưu', 'Dịp kỷ niệm'])
    expect(db.plans).toHaveLength(plansBefore)
  })
})

describe('UC-007/008 Lời mời', () => {
  it('AC-013/014 (CR-002): lời mời gửi cả danh sách; tạo xong có link và cảnh báo quyền của người có link', async () => {
    const { user } = renderApp(`/choice/new?listId=${weekend().id}`, { member: true })
    await screen.findByRole('heading', { name: 'Rủ cùng chọn' })
    expect(screen.getByRole('heading', { name: /\d+ nơi sẽ được gửi/ })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tạo link mời' }))
    expect(await screen.findByRole('heading', { name: /Đã tạo lời mời/ })).toBeInTheDocument()
    expect(screen.getByText(/Ai có liên kết này đều xem được/)).toBeInTheDocument()
    expect((screen.getByLabelText('Liên kết mời') as HTMLInputElement).value).toMatch(/\/invite\/moi-/)
    // Phiên gắn với danh sách: nơi thêm sau tự có trong phiên; danh sách trỏ tới phiên đang chạy.
    const s = db.sessions.at(-1)!
    expect(s.listId).toBe(weekend().id)
    weekend().items.push({ placeId: placeId(5), addedAt: new Date().toISOString() })
    renderApp(`/choice/${s.id}`, { member: true })
    expect(await screen.findByRole('link', { name: 'Phòng tranh Màu Nước' })).toBeInTheDocument()
  })

  it('AC-015 (CR-002): không giới hạn số người — phiên đã có người vẫn cho người mới tham gia', async () => {
    const { user } = renderApp('/invite/loi-moi-cua-toi')
    await user.type(await screen.findByLabelText('Tên của bạn'), 'Huy')
    await user.click(screen.getByRole('button', { name: /Tham gia/ }))
    await waitFor(() => expect(db.sessions[0].participants).toEqual(['Lan', 'Huy']))
  })
})

describe('UC-009/010 Bỏ phiếu và chốt', () => {
  it('AC-018: phiên đã chốt thì không sửa phiếu được', async () => {
    db.sessions[0].status = 'FINALIZED'
    renderApp(`/choice/${db.sessions[0].id}`, { member: true })
    expect(await screen.findByText(/Phiên đã được chốt/)).toBeInTheDocument()
    for (const radio of screen.getAllByRole('radio')) expect(radio).toBeDisabled()
  })

  it('AC-019: chủ tạo chọn nơi và giờ → tạo kế hoạch, phiên chuyển chỉ xem; không tự chọn theo phiếu', async () => {
    const s = db.sessions[0]
    const { user, router } = renderApp(`/choice/${s.id}/results`, { member: true })
    await screen.findByRole('heading', { name: 'Kết quả cùng chọn' })
    expect(screen.queryByRole('button', { name: 'Chốt và tạo kế hoạch' })).not.toBeInTheDocument() // chưa chọn thì không có nút chốt
    await user.click(screen.getAllByRole('button', { name: 'Chọn nơi này' })[0])
    await user.type(screen.getByLabelText('Ngày'), tomorrow())
    await user.click(screen.getByRole('button', { name: 'Chốt và tạo kế hoạch' }))
    await waitFor(() => expect(router.state.location.pathname).toMatch(/^\/plans\//))
    expect(s.status).toBe('FINALIZED')
    expect(db.plans.at(-1)?.choiceSessionId).toBe(s.id)
  })
})

describe('UC-012/013 Kế hoạch', () => {
  it('AC-023: nơi chưa rõ giờ vẫn tạo được, có cảnh báo và câu "chưa giữ chỗ"', async () => {
    const { user } = renderApp(`/plans/new?placeId=${placeId(2)}`, { member: true })
    await screen.findByRole('heading', { name: 'Lên kế hoạch buổi hẹn' })
    await user.type(screen.getByLabelText('Ngày'), tomorrow())
    await user.click(screen.getByRole('button', { name: 'Lưu kế hoạch' }))
    expect(await screen.findByText(/Chưa có thông tin giờ mở cửa. Hãy kiểm tra/)).toBeInTheDocument()
    expect(screen.getByText('Kế hoạch này chưa giữ chỗ tại địa điểm')).toBeInTheDocument()
    expect(screen.getByText('Đã lên lịch')).toBeInTheDocument()
  })

  it('AC-025: người nhận (phiên khách) chỉ xem kế hoạch, không có sửa/hủy', async () => {
    db.sessions[0].datePlanId = db.plans[1].id
    session.setRecipientSession(`rs-${db.sessions[0].id}`)
    renderApp(`/plans/${db.plans[1].id}`)
    expect(await screen.findByText('Bạn đang xem kế hoạch được chia sẻ')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Sửa kế hoạch/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Hủy buổi hẹn/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: /Đi chưa\?/ })).not.toBeInTheDocument()
  })

  it('Hủy kế hoạch cần xác nhận và chuyển Đã hủy', async () => {
    const { user } = renderApp(`/plans/${db.plans[1].id}`, { member: true })
    await user.click(await screen.findByRole('button', { name: 'Hủy buổi hẹn' }))
    const dialog = await screen.findByRole('dialog', { name: 'Hủy buổi hẹn này?' })
    await user.click(within(dialog).getByRole('button', { name: 'Hủy buổi hẹn' }))
    await waitFor(() => expect(db.plans[1].status).toBe('CANCELLED'))
  })
})

describe('UC-004/005 Tài khoản', () => {
  it('CR-002: thành viên chỉ đăng nhập Google (không có ô email/mã) và quay lại returnTo', async () => {
    const { user, router } = renderApp('/login?returnTo=%2Fplans')
    await screen.findByRole('heading', { name: 'Đăng nhập GoWithBae' })
    expect(screen.queryByLabelText('Email')).not.toBeInTheDocument()
    expect(session.getAccessToken()).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Tiếp tục với Google' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/plans'))
    expect(session.getAccessToken()).not.toBeNull()
  })

  it('CR-002: đăng nhập Google lỗi thì báo lỗi, không cấp phiên', async () => {
    server.use(http.post('*/api/v1/auth/google', () => HttpResponse.json({ status: 401, title: 'Unauthorized', detail: 'Không xác minh được tài khoản Google, vui lòng thử lại', code: 'GOOGLE_TOKEN_INVALID' }, { status: 401, headers: { 'Content-Type': 'application/problem+json' } })))
    const { user } = renderApp('/login')
    await user.click(await screen.findByRole('button', { name: 'Tiếp tục với Google' }))
    expect(await screen.findByText('Không xác minh được tài khoản Google, vui lòng thử lại')).toBeInTheDocument()
    expect(session.getAccessToken()).toBeNull()
  })

  it('Chống open redirect: returnTo ra ngoài bị bỏ qua', async () => {
    const { user, router } = renderApp('/login?returnTo=https%3A%2F%2Fevil.example')
    await user.click(await screen.findByRole('button', { name: 'Tiếp tục với Google' }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/'))
  })

  it('AC-009: email cũ giữ nguyên cho đến khi xác minh email mới', async () => {
    const { user } = renderApp('/account', { member: true })
    await user.click(await screen.findByRole('button', { name: 'Đổi email' }))
    const dialog = await screen.findByRole('dialog', { name: 'Đổi email' })
    await user.type(within(dialog).getByLabelText('Email mới'), 'moi@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Gửi mã xác minh' }))
    await within(dialog).findByLabelText('Mã xác minh')
    expect(db.me.email).toBe('ban@example.com')
  })
})

describe('UC-015/016 Báo sai và hỗ trợ', () => {
  it('AC-029/030: khách gửi báo sai không cần đăng ký, nhận mã; thông tin công khai chưa đổi', async () => {
    const { user } = renderApp(`/places/${placeId(1)}`)
    await user.click(await screen.findByRole('button', { name: /Báo thông tin sai/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Báo thông tin sai' })
    await user.click(within(dialog).getByRole('button', { name: 'Gửi báo cáo' }))
    expect(within(dialog).getByText('Hãy chọn loại thông tin sai')).toBeInTheDocument()
    await user.click(within(dialog).getByRole('radio', { name: 'Sai giá' }))
    await user.click(within(dialog).getByRole('button', { name: 'Gửi báo cáo' }))
    expect(await within(dialog).findByText(/Mã báo cáo:/)).toBeInTheDocument()
    expect(within(dialog).getByText(/chưa thay đổi cho đến khi được kiểm tra/)).toBeInTheDocument()
  })

  it('AC-032: mở ticket không thuộc mình → không tìm thấy', async () => {
    renderApp('/account/support/0000000a-0000-4000-8000-000000009999', { member: true })
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy yêu cầu hỗ trợ' })).toBeInTheDocument()
  })

  it('AC-031: bổ sung thông tin khi đang chờ khách phản hồi', async () => {
    const t = db.tickets[0]
    const { user } = renderApp(`/account/support/${t.id}`, { member: true })
    await user.type(await screen.findByLabelText('Bổ sung thông tin'), 'Mình đến lúc 18 giờ.')
    await user.click(screen.getByRole('button', { name: 'Gửi' }))
    expect(await screen.findByText('Mình đến lúc 18 giờ.')).toBeInTheDocument()
    expect(t.status).toBe('IN_PROGRESS')
  })
})

describe('FR-14/17/21 bổ sung', () => {
  it('FR-14 / AC-021 (phía FE): thu hồi link cần xác nhận và link cũ mất hiệu lực', async () => {
    const s = db.sessions[0]
    const { user } = renderApp(`/choice/${s.id}`, { member: true })
    await user.click(await screen.findByRole('button', { name: 'Thu hồi liên kết' }))
    const dialog = await screen.findByRole('dialog', { name: 'Thu hồi liên kết mời?' })
    expect(within(dialog).getByText(/mất quyền xem và bỏ phiếu ngay/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Thu hồi' }))
    await waitFor(() => expect(s.grant?.status).toBe('REVOKED'))
    expect(await screen.findByText('Liên kết đã bị thu hồi')).toBeInTheDocument()
  })

  it('FR-17: tải tệp lịch qua client có xác thực, ghi giờ Việt Nam và "chưa giữ chỗ"', async () => {
    const { downloadCalendar } = await import('../hooks/plans.ts')
    session.setAccessToken('mock-access-token')
    let blob: Blob | null = null
    const original = URL.createObjectURL
    URL.createObjectURL = (b: Blob) => ((blob = b), 'blob:mock')
    URL.revokeObjectURL = () => {}
    const click = HTMLAnchorElement.prototype.click
    HTMLAnchorElement.prototype.click = () => {}
    try {
      await downloadCalendar(db.plans[1].id)
      const text = await (blob as unknown as Blob).text()
      expect(text).toContain('BEGIN:VEVENT')
      expect(text).toContain('Giờ Việt Nam')
      expect(text).toContain('chưa giữ chỗ')
    } finally {
      URL.createObjectURL = original
      HTMLAnchorElement.prototype.click = click
    }
  })

  it('FR-21: thông báo chưa đọc có nhãn, mở được đối tượng bằng link thật và đánh dấu đã đọc', async () => {
    const { user } = renderApp('/account/notifications', { member: true })
    const link = await screen.findByRole('link', { name: /Chưa đọc:\s*Hỗ trợ đã trả lời/ })
    expect(link).toHaveAttribute('href', `/account/support/${db.tickets[0].id}`)
    await user.click(link)
    await waitFor(() => expect(db.notifications[0].readAt).not.toBeNull())
  })
})

describe('AC còn lại phía FE', () => {
  it('AC-020: chốt thất bại → không báo đã chốt, giữ form để thử lại', async () => {
    server.use(http.post('*/api/v1/choice-sessions/:id/finalize', () => HttpResponse.json({ status: 500, title: 'Lỗi máy chủ', traceId: 'T-500' }, { status: 500 })))
    const s = db.sessions[0]
    const { user, router } = renderApp(`/choice/${s.id}/results`, { member: true })
    await user.click((await screen.findAllByRole('button', { name: 'Chọn nơi này' }))[0])
    await user.type(screen.getByLabelText('Ngày'), tomorrow())
    await user.click(screen.getByRole('button', { name: 'Chốt và tạo kế hoạch' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(`/choice/${s.id}/results`)
    expect(s.status).toBe('VOTING')
    expect(screen.getByRole('button', { name: 'Chốt và tạo kế hoạch' })).toBeEnabled()
  })

  it('AC-041/042: bộ sưu tập chỉ hiện nơi đang công khai, theo thứ tự cấu hình', async () => {
    renderApp(`/collections/${collections[0].id}`)
    await screen.findByRole('heading', { level: 1, name: 'Hẹn đầu nhẹ nhàng' })
    const names = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(names).toEqual(['Cà phê Mái Hiên', 'Xưởng gốm Đất Lành', 'Vườn sách Lá Me'])
    expect(screen.queryByText('Quán đã tạm ẩn')).not.toBeInTheDocument()
  })

  it('AC-002: từ chối chia sẻ vị trí → hướng dẫn chọn khu vực, kết quả và bộ lọc giữ nguyên', async () => {
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition: (_ok: unknown, fail: (e: unknown) => void) => fail({ code: 1 }) },
    })
    const { user, router } = renderApp('/search?budget=FROM_200K_TO_400K')
    await screen.findByRole('heading', { name: /địa điểm$/ })
    await user.click(screen.getByRole('button', { name: 'Gần tôi' }))
    expect(await screen.findByText(/Không lấy được vị trí. Hãy chọn khu vực/)).toBeInTheDocument()
    expect(router.state.location.search).toBe('?budget=FROM_200K_TO_400K')
    expect(screen.getByRole('link', { name: 'Xưởng gốm Đất Lành' })).toBeInTheDocument()
  })
})
