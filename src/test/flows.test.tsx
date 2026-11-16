/**
 * Kiểm thử luồng chính theo AC của SRS v1.1, chạy ứng dụng thật trên dữ liệu minh họa (MSW).
 * Đây là kiểm thử frontend; quyền thật ở server cần kiểm thử riêng khi backend sẵn sàng.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { isReminderDue } from '../hooks/plans.ts'
import { db, planView } from '../mocks/db.ts'
import { placeId } from '../mocks/data.ts'
import { renderApp } from './render.tsx'

describe('UC-014 Lời nhắc "Đi chưa?" (CR-001)', () => {
  it('AC-057/058: hiện đúng 2 nút, Bỏ qua lời nhắc thì biến mất và không hiện lại khi tải lại; không đổi visitAnswer', async () => {
    const { user, unmount } = renderApp('/plans', { member: true })
    const ticket = await screen.findByRole('region', { name: /Đi chưa\?/ })
    expect(within(ticket).getByRole('button', { name: 'Đã đi' })).toBeInTheDocument()
    expect(within(ticket).getByRole('button', { name: 'Bỏ qua lời nhắc' })).toBeInTheDocument()
    expect(screen.queryByText(/Chưa đi/)).not.toBeInTheDocument()

    await user.click(within(ticket).getByRole('button', { name: 'Bỏ qua lời nhắc' }))
    await waitFor(() => expect(screen.queryByRole('region', { name: /Đi chưa\?/ })).not.toBeInTheDocument())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument() // không popup khác
    expect(db.plans[0].visitAnswer).toBeNull() // không tự ghi "Không"
    expect(db.plans[0].status).toBe('SCHEDULED') // không đổi/hủy lịch

    unmount()
    renderApp('/plans', { member: true })
    await screen.findByRole('heading', { name: 'Buổi hẹn', level: 1 })
    await screen.findAllByRole('link', { name: /Tiệm bánh/ })
    expect(screen.queryByRole('region', { name: /Đi chưa\?/ })).not.toBeInTheDocument()
  })

  it('Đã đi: ghi tự xác nhận và đóng lời nhắc', async () => {
    const { user } = renderApp('/plans', { member: true })
    const ticket = await screen.findByRole('region', { name: /Đi chưa\?/ })
    await user.click(within(ticket).getByRole('button', { name: 'Đã đi' }))
    await waitFor(() => expect(db.plans[0].visitAnswer).toBe('YES'))
    await waitFor(() => expect(screen.queryByRole('region', { name: /Đi chưa\?/ })).not.toBeInTheDocument())
  })

  it('AC-027/028: kế hoạch đã hủy, chưa tới giờ, đã trả lời hoặc người nhận → không nhắc', () => {
    const [due, future, cancelled, answered] = db.plans
    const now = Date.now()
    expect(isReminderDue(planView(due, 'OWNER'), now)).toBe(true)
    expect(isReminderDue(planView(due, 'OWNER'), now, [due.id])).toBe(false) // đã bỏ qua
    expect(isReminderDue(planView(future, 'OWNER'), now)).toBe(false)
    expect(isReminderDue(planView(cancelled, 'OWNER'), now)).toBe(false)
    expect(isReminderDue(planView(answered, 'OWNER'), now)).toBe(false)
    expect(isReminderDue(planView(due, 'RECIPIENT'), now)).toBe(false)
  })
})

describe('UC-008 Người nhận link (CR-001)', () => {
  it('AC-055: trình duyệt chưa đăng nhập xem và tham gia bằng tên, không bị đưa sang đăng nhập', async () => {
    const { user, router } = renderApp('/invite/loi-moi-mau')
    expect(await screen.findByRole('heading', { name: /Hà mời bạn cùng chọn/ })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/invite/loi-moi-mau')

    await user.click(screen.getByRole('button', { name: 'Tham gia chọn' }))
    expect(await screen.findByText('Hãy nhập tên hiển thị')).toBeInTheDocument()

    await user.type(screen.getByLabelText('Tên của bạn'), 'Lan')
    await user.click(screen.getByRole('button', { name: 'Tham gia chọn' }))
    expect(await screen.findByRole('heading', { name: 'Cùng chọn với Hà' })).toBeInTheDocument()
    expect(router.state.location.pathname).not.toBe('/login')
  })

  it('AC-016: link đã thu hồi bị chặn và không lộ nội dung', async () => {
    renderApp('/invite/loi-moi-da-thu-hoi')
    expect(await screen.findByRole('heading', { name: 'Liên kết không còn hiệu lực' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Tên của bạn')).not.toBeInTheDocument()
  })
})

describe('UC-009 Bỏ phiếu', () => {
  it('AC-017: nơi chưa chọn hiển thị "Chưa trả lời", không mặc định là Bỏ qua; chỉ cả hai Thích mới là trùng', async () => {
    renderApp(`/choice/${db.sessions[0].id}`, { member: true })
    const card = (await screen.findByRole('link', { name: 'Sân thượng Hoàng Hôn' })).closest('article')!
    expect(within(card).getByText('Bạn chưa trả lời')).toBeInTheDocument()
    expect(within(card).getByRole('radio', { name: /Thích/ })).not.toBeChecked()
    expect(within(card).getByRole('radio', { name: /Bỏ qua/ })).not.toBeChecked()
    expect(screen.getByRole('link', { name: /Xem nơi cả hai cùng thích \(1\)/ })).toBeInTheDocument()
  })
})

describe('UC-002/003 Chi tiết và so sánh', () => {
  it('AC-003: giá và giờ chưa rõ hiển thị "Chưa có thông tin", không có sao/đánh giá', async () => {
    renderApp(`/places/${placeId(2)}`)
    expect(await screen.findByRole('heading', { name: 'Sân thượng Hoàng Hôn', level: 1 })).toBeInTheDocument()
    expect(screen.getAllByText('Chưa có thông tin giá').length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Chưa có thông tin giờ/).length).toBeGreaterThan(0)
    expect(screen.queryByText(/đánh giá|★/)).not.toBeInTheDocument()
  })

  it('AC-004: địa điểm đã ẩn mở bằng URL trực tiếp không trả nội dung', async () => {
    renderApp(`/places/${placeId(7)}`)
    expect(await screen.findByRole('heading', { name: 'Không tìm thấy địa điểm' })).toBeInTheDocument()
    expect(screen.queryByText('Quán đã tạm ẩn')).not.toBeInTheDocument()
  })

  it('AC-005: đã có 3 nơi trong khay thì không thêm nơi thứ tư', async () => {
    localStorage.setItem('gwb.compare', JSON.stringify([placeId(0), placeId(1), placeId(2)]))
    const { user } = renderApp(`/places/${placeId(3)}`)
    await screen.findByRole('heading', { name: 'Tiệm bánh Bột Mì Nhỏ', level: 1 })
    const [toggle] = screen.getAllByRole('button', { name: /So sánh Tiệm bánh/ })
    await user.click(toggle)
    expect(await screen.findByText(/Bạn chỉ có thể so sánh tối đa 3 địa điểm/)).toBeInTheDocument()
    expect(JSON.parse(localStorage.getItem('gwb.compare')!)).toHaveLength(3)
  })
})

describe('UC-012 Tạo kế hoạch', () => {
  it('AC-024: giờ đã xác minh là đóng → không lưu, báo tại ô thời gian; luôn có câu "chưa giữ chỗ"', async () => {
    const { user } = renderApp(`/plans/new?placeId=${placeId(0)}`, { member: true })
    await screen.findByRole('heading', { name: 'Lên kế hoạch buổi hẹn' })
    expect(screen.getByText('Kế hoạch này chưa giữ chỗ tại địa điểm')).toBeInTheDocument()
    const nextMonday = nextWeekday(1) // Xưởng gốm nghỉ Thứ Hai
    await user.type(screen.getByLabelText('Ngày'), nextMonday)
    await user.click(screen.getByRole('button', { name: 'Lưu kế hoạch' }))
    expect(await screen.findByText('Địa điểm đóng cửa vào thời gian bạn chọn')).toBeInTheDocument()
    expect(db.plans).toHaveLength(4)
  })
})

describe('Bảo vệ route', () => {
  it('chưa đăng nhập vào /saved → chuyển đăng nhập kèm đường quay lại', async () => {
    const { router } = renderApp('/saved')
    await screen.findByRole('heading', { name: 'Đăng nhập GoWithBae' })
    expect(router.state.location.pathname).toBe('/login')
    expect(router.state.location.search).toContain('returnTo=%2Fsaved')
  })
})

function nextWeekday(dow: number) {
  const d = new Date()
  do d.setDate(d.getDate() + 1)
  while (((d.getDay() + 6) % 7) + 1 !== dow)
  return d.toISOString().slice(0, 10)
}
