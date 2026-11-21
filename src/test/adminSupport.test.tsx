/**
 * Kiểm thử nội dung web, thông báo, báo sai, yêu cầu hỗ trợ (quản trị) và trang tĩnh phía người dùng, trên MSW.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { session } from '../api/client.ts'
import { MOCK_ADMIN_TOKEN } from '../mocks/admin.ts'
import { supportDb } from '../mocks/adminSupport.ts'
import { renderApp } from './render.tsx'

function renderAdmin(path: string) {
  session.setAccessToken(MOCK_ADMIN_TOKEN)
  return renderApp(path)
}

describe('Nội dung web', () => {
  it('sửa tiêu đề trang chủ, bật banner, thêm câu hỏi rồi lưu', async () => {
    const { user } = renderAdmin('/admin/content')
    const save = await screen.findByRole('button', { name: 'Lưu nội dung' })
    expect(save).toBeDisabled()

    const title = screen.getByLabelText('Tiêu đề lớn')
    await user.clear(title)
    await user.type(title, 'Hẹn hò cuối tuần')
    await user.click(screen.getByLabelText('Hiện banner'))
    await user.click(save)
    expect(await screen.findByText(/Bật banner thì cần nội dung/)).toBeInTheDocument()

    await user.type(screen.getByLabelText('Nội dung banner'), 'Ưu đãi tháng 12')
    await user.type(screen.getByLabelText(/Link khi bấm/), '/faq')
    await user.click(screen.getByRole('button', { name: 'Thêm câu hỏi' }))
    await user.type(screen.getByLabelText('Câu hỏi 3'), 'Có app điện thoại không?')
    await user.type(screen.getByLabelText('Trả lời 3'), 'Chưa, hiện chỉ có web.')
    await user.click(screen.getByRole('button', { name: 'Đưa câu 3 lên' }))
    await user.click(save)

    await waitFor(() => expect(supportDb.content.updatedAt).toBeTruthy())
    expect(supportDb.content.homeHero.title).toBe('Hẹn hò cuối tuần')
    expect(supportDb.content.homeBanner).toEqual({ enabled: true, text: 'Ưu đãi tháng 12', linkUrl: '/faq' })
    expect(supportDb.content.faq.map((f) => f.question)[1]).toBe('Có app điện thoại không?')
  })

  it('trang chủ dùng tiêu đề, banner và chân trang do quản trị viên đặt', async () => {
    supportDb.content.homeHero.title = 'Hẹn hò cuối tuần'
    supportDb.content.homeBanner = { enabled: true, text: 'Ưu đãi tháng 12', linkUrl: '/faq' }
    supportDb.content.footer.text = '© 2026 Nhóm GoWithBae'
    const { user, router } = renderApp('/')
    expect(await screen.findByRole('heading', { name: 'Hẹn hò cuối tuần' })).toBeInTheDocument()
    expect(screen.getByText('© 2026 Nhóm GoWithBae')).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Ưu đãi tháng 12/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/faq'))
    expect(await screen.findByRole('heading', { name: 'Câu hỏi thường gặp', level: 1 })).toBeInTheDocument()
    expect(screen.getByText('GoWithBae có mất phí không?')).toBeInTheDocument()
  })

  it('trang quyền riêng tư hiện tiêu đề và gạch đầu dòng', async () => {
    renderApp('/privacy')
    expect(await screen.findByRole('heading', { name: 'Dữ liệu chúng tôi lưu', level: 2 })).toBeInTheDocument()
    const article = screen.getByRole('article')
    expect(within(article).getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Email đăng nhập', 'Lịch sử phiên đăng nhập (thời điểm, IP, thiết bị)'])
  })

  it('trang liên hệ hiện email, ẩn mục chưa điền', async () => {
    renderApp('/contact')
    expect(await screen.findByRole('link', { name: 'hello@gowithbae.test' })).toHaveAttribute('href', 'mailto:hello@gowithbae.test')
    expect(screen.queryByText('Điện thoại')).not.toBeInTheDocument()
  })
})

describe('Gửi thông báo', () => {
  it('gửi cho tất cả cần xác nhận, xong hiện trong lịch sử', async () => {
    const { user } = renderAdmin('/admin/notifications')
    const send = await screen.findByRole('button', { name: 'Gửi thông báo' })
    expect(send).toBeDisabled()
    await user.type(screen.getByLabelText('Nội dung'), 'Bảo trì hệ thống 22h tối nay')
    await user.click(send)
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText(/Mọi thành viên đang hoạt động/)).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Gửi' }))
    expect(await screen.findByText(/Đã gửi cho \d+ người/)).toBeInTheDocument()
    expect(await screen.findByRole('cell', { name: 'Bảo trì hệ thống 22h tối nay' })).toBeInTheDocument()
  })

  it('gửi cho một người phải chọn người nhận', async () => {
    const { user } = renderAdmin('/admin/notifications')
    await user.click(await screen.findByLabelText('Một người'))
    await user.type(screen.getByLabelText('Nội dung'), 'Chào bạn')
    expect(screen.getByRole('button', { name: 'Gửi thông báo' })).toBeDisabled()
    await user.type(screen.getByLabelText('Tìm người nhận'), 'linh{Enter}')
    await user.click(await screen.findByRole('button', { name: /linh@example.com/ }))
    expect(screen.getByText(/Người nhận:/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Gửi thông báo' })).toBeEnabled()
  })
})

describe('Báo sai', () => {
  it('đóng báo sai bắt buộc ghi chú', async () => {
    const { user } = renderAdmin('/admin/place-reports?status=NEW')
    await user.click(await screen.findByRole('link', { name: 'Cà phê Mèo Mun' }))
    expect(await screen.findByText(/Giá nước đã tăng/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Mở địa điểm để sửa/ })).toHaveAttribute('href', '/admin/places/00000000-0000-4000-8000-000000000001')

    await user.selectOptions(screen.getByLabelText('Chuyển sang'), 'RESOLVED')
    const update = screen.getByRole('button', { name: 'Cập nhật' })
    expect(update).toBeDisabled()
    await user.type(screen.getByLabelText(/Ghi chú xử lý/), 'Đã sửa giá thành 65.000đ')
    await user.click(update)
    expect(await screen.findByText(/Đã chuyển sang “Đã sửa”/)).toBeInTheDocument()
    expect(supportDb.reports[0].status).toBe('RESOLVED')
    expect(screen.getAllByText('Đã sửa giá thành 65.000đ').length).toBeGreaterThan(0)
  })
})

describe('Yêu cầu hỗ trợ', () => {
  it('ghi chú nội bộ không đổi trạng thái; trả lời công khai chuyển sang đang xử lý; đóng thì hết ô trả lời', async () => {
    const ticket = supportDb.tickets[0]
    const { user } = renderAdmin(`/admin/tickets/${ticket.id}`)
    expect(await screen.findByText(/Mình bấm gửi mã/)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Ghi chú nội bộ' }))
    await user.type(screen.getByLabelText('Nội dung'), 'Kiểm tra log email')
    await user.click(screen.getByRole('button', { name: 'Lưu ghi chú' }))
    expect(await screen.findByText('Kiểm tra log email')).toBeInTheDocument()
    expect(ticket.status).toBe('NEW')

    await user.click(screen.getByRole('button', { name: 'Trả lời công khai' }))
    await user.type(screen.getByLabelText('Nội dung'), 'Bạn kiểm tra giúp mục Spam nhé.')
    await user.click(screen.getByRole('button', { name: 'Gửi trả lời' }))
    expect(await screen.findByText('Bạn kiểm tra giúp mục Spam nhé.')).toBeInTheDocument()
    await waitFor(() => expect(ticket.status).toBe('IN_PROGRESS'))

    await user.click(screen.getByRole('button', { name: 'Đóng yêu cầu' }))
    await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Đóng yêu cầu' }))
    expect(await screen.findByText(/không trả lời thêm được/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Gửi trả lời' })).not.toBeInTheDocument()
  }, 20_000)
})

describe('Phiên hết hạn trên trang công khai', () => {
  it('token hết hạn bị xóa và trang vẫn tải xong nội dung (không kẹt "Đang tải…")', async () => {
    session.setAccessToken('expired-token')
    renderApp('/terms')
    expect(await screen.findByText('Điều khoản sử dụng đang được cập nhật.')).toBeInTheDocument()
    expect(session.getAccessToken()).toBeNull()
  })
})
