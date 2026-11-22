/**
 * Khôi phục và xóa tài khoản trong trang quản trị (MSW). Quy tắc thật ở backend có AccountDeletionApiTest.
 */
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { session } from '../api/client.ts'
import { MOCK_ADMIN_TOKEN, adminDb } from '../mocks/admin.ts'
import { renderApp } from './render.tsx'

const PENDING = '0000000a-0000-4000-8000-000000000004' // roi-di@example.com, đang chờ xóa
const ACTIVE = '0000000a-0000-4000-8000-000000000002' // linh@example.com

function renderAdmin(path: string) {
  session.setAccessToken(MOCK_ADMIN_TOKEN)
  return renderApp(path)
}
const user = (id: string) => adminDb.users.find((u) => u.id === id)!

describe('Tài khoản đang chờ xóa', () => {
  it('hiện ngày tự xóa, ẩn Khóa/Vai trò, khôi phục cần lý do', async () => {
    const { user: ui } = renderAdmin(`/admin/users/${PENDING}`)
    expect(await screen.findByText(/Hệ thống sẽ tự xóa vào/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Vai trò' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Khóa' })).not.toBeInTheDocument()

    await ui.click(screen.getByRole('button', { name: 'Khôi phục' }))
    const dialog = await screen.findByRole('dialog')
    const confirm = within(dialog).getByRole('button', { name: 'Khôi phục' })
    expect(confirm).toBeDisabled()
    await ui.type(within(dialog).getByLabelText(/Lý do/), 'Người dùng nhờ giữ lại')
    await ui.click(confirm)
    expect(await screen.findByText('Đã khôi phục tài khoản')).toBeInTheDocument()
    expect(user(PENDING).status).toBe('ACTIVE')
    expect(await screen.findByRole('button', { name: 'Vai trò' })).toBeInTheDocument()
  })

  it('xóa ngay phải gõ đúng email và có lý do', async () => {
    const { user: ui } = renderAdmin(`/admin/users/${PENDING}`)
    await ui.click(await screen.findByRole('button', { name: 'Xóa ngay' }))
    const dialog = await screen.findByRole('dialog')
    const erase = within(dialog).getByRole('button', { name: 'Xóa vĩnh viễn' })
    await ui.type(within(dialog).getByLabelText(/Lý do/), 'Theo yêu cầu')
    await ui.type(within(dialog).getByLabelText('Gõ lại email để xác nhận'), 'sai@example.com')
    expect(erase).toBeDisabled()
    await ui.clear(within(dialog).getByLabelText('Gõ lại email để xác nhận'))
    await ui.type(within(dialog).getByLabelText('Gõ lại email để xác nhận'), 'ROI-DI@example.com')
    await ui.click(erase)

    expect(await screen.findByText(/Tài khoản đã bị xóa/)).toBeInTheDocument()
    expect(user(PENDING).status).toBe('DELETED')
    expect(screen.queryByRole('button', { name: 'Khôi phục' })).not.toBeInTheDocument()
    expect(screen.queryByRole('region', { name: 'Vùng nguy hiểm' })).not.toBeInTheDocument()
  })
})

describe('Xóa tài khoản đang hoạt động', () => {
  it('có ở Vùng nguy hiểm cuối trang và xóa được', async () => {
    const { user: ui } = renderAdmin(`/admin/users/${ACTIVE}`)
    await ui.click(await screen.findByRole('button', { name: 'Xóa tài khoản' }))
    const dialog = await screen.findByRole('dialog')
    await ui.type(within(dialog).getByLabelText('Gõ lại email để xác nhận'), 'linh@example.com')
    await ui.type(within(dialog).getByLabelText(/Lý do/), 'Tài khoản rác')
    await ui.click(within(dialog).getByRole('button', { name: 'Xóa vĩnh viễn' }))
    expect(await screen.findByText('Đã xóa tài khoản')).toBeInTheDocument()
    expect(user(ACTIVE).status).toBe('DELETED')
  })

  it('không có nút xóa trên chính tài khoản của mình', async () => {
    renderAdmin(`/admin/users/${adminDb.admin.id}`)
    expect(await screen.findByRole('button', { name: 'Vai trò' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa tài khoản' })).not.toBeInTheDocument()
  })
})
