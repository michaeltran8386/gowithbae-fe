/**
 * Kiểm thử trang quản trị trên dữ liệu minh họa (MSW): đăng nhập 2 bước, kích hoạt Authenticator,
 * tài khoản (tạo, khóa, phiên), nhật ký. Quyền thật ở server có test riêng bên backend.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { session } from '../api/client.ts'
import { MOCK_ACTIVATION_TOKEN, MOCK_ADMIN_EMAIL, MOCK_ADMIN_TOKEN, MOCK_STAFF_CODE, adminDb } from '../mocks/admin.ts'
import { MOCK_OTP } from '../mocks/data.ts'
import { renderApp } from './render.tsx'

function renderAdmin(path: string) {
  session.setAccessToken(MOCK_ADMIN_TOKEN)
  return renderApp(path)
}

describe('Đăng nhập quản trị', () => {
  it('OTP email đúng thì hỏi thêm mã Authenticator, đủ hai mã thì vào bảng điều khiển', async () => {
    const { user, router } = renderApp('/login')
    await user.type(await screen.findByLabelText('Email'), MOCK_ADMIN_EMAIL)
    await user.click(screen.getByRole('button', { name: 'Gửi mã đăng nhập' }))
    await user.type(await screen.findByLabelText('Mã đăng nhập'), MOCK_OTP)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))

    const staff = await screen.findByLabelText('Mã trong Google Authenticator')
    expect(screen.getByRole('button', { name: 'Đăng nhập' })).toBeDisabled()
    await user.type(staff, '000000')
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByText(/Mã Authenticator không đúng/)).toBeInTheDocument()

    await user.clear(staff)
    await user.type(staff, MOCK_STAFF_CODE)
    await user.click(screen.getByRole('button', { name: 'Đăng nhập' }))
    expect(await screen.findByRole('heading', { name: 'Bảng điều khiển', level: 1 })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/admin')
    expect(await screen.findByText('Thành viên hoạt động')).toBeInTheDocument()
  })

  it('thành viên thường vào /admin thấy "Không tìm thấy trang"', async () => {
    renderApp('/admin', { member: true })
    expect(await screen.findByText('Không tìm thấy trang')).toBeInTheDocument()
  })

  it('link kích hoạt hiện mã QR và khóa nhập tay, mã đúng thì bật Authenticator', async () => {
    const { user } = renderApp(`/admin/activate/${MOCK_ACTIVATION_TOKEN}`)
    expect(await screen.findByRole('heading', { name: 'Kích hoạt đăng nhập quản trị' })).toBeInTheDocument()
    expect(screen.getByText(/JBSW Y3DP/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByAltText(/Mã QR/)).toBeInTheDocument())
    await user.type(screen.getByLabelText('Mã xác nhận'), '111111')
    await user.click(screen.getByRole('button', { name: 'Kích hoạt' }))
    expect(await screen.findByRole('alert')).toBeInTheDocument()
    await user.clear(screen.getByLabelText('Mã xác nhận'))
    await user.type(screen.getByLabelText('Mã xác nhận'), MOCK_STAFF_CODE)
    await user.click(screen.getByRole('button', { name: 'Kích hoạt' }))
    expect(await screen.findByRole('heading', { name: 'Đã bật Google Authenticator' })).toBeInTheDocument()
  })

  it('link kích hoạt hết hạn thì báo rõ', async () => {
    renderApp(`/admin/activate/${'b'.repeat(43)}`)
    expect(await screen.findByText('Link kích hoạt không còn hiệu lực')).toBeInTheDocument()
  })
})

describe('Quản trị tài khoản', () => {
  it('tạo thành viên và tạo quản trị viên (nhận link kích hoạt)', async () => {
    const { user } = renderAdmin('/admin/users')
    expect(await screen.findByRole('link', { name: 'Linh' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    let dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Email'), 'moi@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Tạo' }))
    expect(await within(dialog).findByText(/có thể đăng nhập bằng mã gửi qua email/)).toBeInTheDocument()
    expect(within(dialog).queryByText(/link kích hoạt/i)).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Xong' }))
    expect(await screen.findByText('moi@example.com')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Email'), 'admin2@example.com')
    await user.click(within(dialog).getByRole('radio', { name: /Quản trị viên/ }))
    await user.click(within(dialog).getByRole('button', { name: 'Tạo' }))
    expect(await within(dialog).findByText(/admin\/activate\//)).toBeInTheDocument()

    await user.click(within(dialog).getByRole('button', { name: 'Xong' }))
    await user.click(screen.getByRole('button', { name: 'Tạo tài khoản' }))
    dialog = await screen.findByRole('dialog')
    await user.type(within(dialog).getByLabelText('Email'), 'linh@example.com')
    await user.click(within(dialog).getByRole('button', { name: 'Tạo' }))
    expect(await within(dialog).findByText('Email đã có tài khoản')).toBeInTheDocument()
  })

  it('khóa tài khoản cần lý do; xem phiên đăng nhập và nhật ký', async () => {
    const { user } = renderAdmin('/admin/users/0000000a-0000-4000-8000-000000000002')
    expect(await screen.findByRole('heading', { name: 'Linh', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('Địa điểm đã lưu')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Khóa' }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Khóa' })
    expect(confirm).toBeDisabled()
    await user.type(within(dialog).getByLabelText(/Lý do/), 'Vi phạm điều khoản')
    await user.click(confirm)
    await waitFor(() => expect(adminDb.users[1].status).toBe('LOCKED'))
    expect(await screen.findByRole('button', { name: 'Mở khóa' })).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Phiên đăng nhập' }))
    expect(await screen.findByText('113.161.10.20')).toBeInTheDocument()
    expect(screen.getByText('Chrome · Windows')).toBeInTheDocument()

    await user.click(screen.getByRole('tab', { name: 'Nhật ký quản trị' }))
    expect(await screen.findByText('Khóa tài khoản')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Vi phạm điều khoản')).toBeInTheDocument()
  })

  it('trang nhật ký liệt kê thao tác quản trị', async () => {
    renderAdmin('/admin/audit')
    expect(await screen.findByRole('heading', { name: 'Nhật ký', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText('Spam báo sai')).toBeInTheDocument()
  })
})
