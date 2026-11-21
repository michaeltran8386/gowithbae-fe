/**
 * Lối vào "Cùng chọn" dễ thấy: Khám phá, Buổi hẹn, Đã lưu, và trang tạo lời mời khi chưa chọn danh sách.
 * Dữ liệu mock: "Cuối tuần này" có 4 nơi (mời được), "Dịp kỷ niệm" có 1 nơi (chưa đủ).
 */
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './render.tsx'

describe('Lối vào Cùng chọn', () => {
  it('Khám phá có thẻ giải thích cần lưu ít nhất 2 nơi và dẫn tới trang tạo lời mời', async () => {
    renderApp('/')
    const card = await screen.findByRole('region', { name: 'Chưa biết đi đâu? Rủ người ấy cùng chọn' })
    expect(within(card).getByText(/Lưu ít nhất 2 nơi vào một danh sách/)).toBeInTheDocument()
    expect(within(card).getByRole('link', { name: /Rủ người ấy cùng chọn/ })).toHaveAttribute('href', '/choice/new')
  })

  it('Buổi hẹn có nút rủ cùng chọn', async () => {
    renderApp('/plans', { member: true })
    expect(await screen.findByRole('link', { name: /Rủ người ấy cùng chọn/ })).toHaveAttribute('href', '/choice/new')
  })

  it('Đã lưu chỉ hiện nút mời trên danh sách đủ 2 nơi', async () => {
    renderApp('/saved', { member: true })
    const invite = await screen.findByRole('link', { name: 'Mời cùng chọn từ Cuối tuần này' })
    expect(invite.getAttribute('href')).toMatch(/^\/choice\/new\?listId=/)
    expect(screen.queryByRole('link', { name: 'Mời cùng chọn từ Dịp kỷ niệm' })).not.toBeInTheDocument()
  })

  it('trang tạo lời mời chưa chọn danh sách thì cho chọn ngay, danh sách thiếu nơi nói rõ còn thiếu bao nhiêu', async () => {
    const { user, router } = renderApp('/choice/new', { member: true })
    expect(await screen.findByRole('heading', { name: 'Mời người ấy cùng chọn', level: 1 })).toBeInTheDocument()
    expect(await screen.findByText(/cần thêm 1 nơi để mời/)).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: /Cuối tuần này/ }))
    expect(router.state.location.search).toMatch(/listId=/)
    expect(await screen.findByRole('button', { name: 'Tạo lời mời' })).toBeInTheDocument()
  })
})
