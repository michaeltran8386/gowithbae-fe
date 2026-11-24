/**
 * Lối vào "Cùng chọn" dễ thấy: Khám phá, Buổi hẹn, Đã lưu, và trang tạo lời mời khi chưa chọn danh sách.
 * Dữ liệu mock: "Đã lưu" (mặc định), "Cuối tuần này" 4 nơi, "Dịp kỷ niệm" 1 nơi — CR-002: từ 1 nơi là rủ được.
 */
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render.tsx'

describe('Lối vào Cùng chọn', () => {
  it('Khám phá có thẻ giải thích cách rủ cùng chọn và dẫn tới trang tạo lời mời', async () => {
    renderApp('/')
    const card = await screen.findByRole('region', { name: 'Chưa biết đi đâu? Rủ mọi người cùng chọn' })
    expect(within(card).getByText(/gửi link cho bao nhiêu người cũng được/)).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: /Rủ cùng chọn/ })).toHaveAttribute('href', '/choice/new')
  })

  it('Buổi hẹn có nút rủ cùng chọn', async () => {
    renderApp('/plans', { member: true })
    expect(await screen.findByRole('link', { name: /Rủ người ấy cùng chọn/ })).toHaveAttribute('href', '/choice/new')
  })

  it('Giỏ hẹn: mọi danh sách có nơi đều rủ được; danh sách đang cùng chọn mở thẳng phiên đó', async () => {
    renderApp('/saved', { member: true })
    expect(await screen.findByRole('heading', { name: 'Giỏ hẹn', level: 1 })).toBeInTheDocument()
    const invite = await screen.findByRole('link', { name: 'Rủ cùng chọn từ Cuối tuần này' })
    expect(invite.getAttribute('href')).toMatch(/^\/choice\/new\?listId=/)
    expect(screen.getByRole('link', { name: 'Rủ cùng chọn từ Dịp kỷ niệm' })).toBeInTheDocument()
  })

  it('trang tạo lời mời chưa chọn danh sách thì cho chọn ngay hoặc tạo danh sách mới', async () => {
    const { user, router } = renderApp('/choice/new', { member: true })
    expect(await screen.findByRole('heading', { name: 'Rủ cùng chọn', level: 1 })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tạo danh sách mới' })).toBeInTheDocument()
    await user.click(await screen.findByRole('link', { name: /Cuối tuần này/ }))
    expect(router.state.location.search).toMatch(/listId=/)
    expect(await screen.findByRole('button', { name: 'Tạo link mời' })).toBeInTheDocument()
  })
})
