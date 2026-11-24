import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { db } from '../mocks/db.ts'
import { renderApp } from './render.tsx'

describe('Chuông thông báo (popover)', () => {
  it('bấm chuông mở hộp xem nhanh tại chỗ, lọc theo tab và đóng bằng Escape', async () => {
    const { user, router } = renderApp('/', { member: true })
    const bell = await screen.findByRole('button', { name: /Thông báo/ })
    await user.click(bell)

    const dialog = await screen.findByRole('dialog', { name: 'Thông báo gần đây' })
    expect(router.state.location.pathname).toBe('/')
    expect(within(dialog).getByText(/Hỗ trợ đã trả lời/)).toBeInTheDocument()
    expect(within(dialog).getByText(/Buổi hẹn tại Sân thượng Hoàng Hôn/)).toBeInTheDocument()

    // Lọc tab "Chưa đọc": ẩn mục đã đọc
    await user.click(within(dialog).getByRole('tab', { name: 'Chưa đọc' }))
    expect(within(dialog).getByText(/Hỗ trợ đã trả lời/)).toBeInTheDocument()
    expect(within(dialog).queryByText(/Buổi hẹn tại Sân thượng Hoàng Hôn/)).not.toBeInTheDocument()

    // Lọc tab "Buổi hẹn": hiện thông báo buổi hẹn
    await user.click(within(dialog).getByRole('tab', { name: 'Buổi hẹn' }))
    expect(within(dialog).getByText(/Buổi hẹn tại Sân thượng Hoàng Hôn/)).toBeInTheDocument()
    expect(within(dialog).queryByText(/Hỗ trợ đã trả lời/)).not.toBeInTheDocument()

    await user.keyboard('{Escape}')
    await waitFor(() => expect(screen.queryByRole('dialog', { name: 'Thông báo gần đây' })).not.toBeInTheDocument())
  })

  it('bấm vào thông báo hoặc khung xem chi tiết sẽ đánh dấu đã đọc và chuyển tới trang Thông báo', async () => {
    const { user, router } = renderApp('/', { member: true })
    await user.click(await screen.findByRole('button', { name: /Thông báo/ }))
    const dialog = await screen.findByRole('dialog', { name: 'Thông báo gần đây' })

    await user.click(within(dialog).getByRole('link', { name: /Hỗ trợ đã trả lời/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/account/notifications'))
    await waitFor(() => expect(db.notifications[0].readAt).not.toBeNull())
    expect(screen.queryByRole('dialog', { name: 'Thông báo gần đây' })).not.toBeInTheDocument()
  })

  it('khi chưa có thông báo vẫn bấm vào khung để mở trang Thông báo', async () => {
    db.notifications.length = 0
    const { user, router } = renderApp('/', { member: true })
    await user.click(await screen.findByRole('button', { name: 'Thông báo' }))
    const dialog = await screen.findByRole('dialog', { name: 'Thông báo gần đây' })

    await user.click(within(dialog).getByRole('link', { name: /Chưa có thông báo/ }))
    await waitFor(() => expect(router.state.location.pathname).toBe('/account/notifications'))
  })
})
