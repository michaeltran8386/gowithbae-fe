/**
 * CR-002 Giỏ hẹn: tim lưu vào "Đã lưu", nút + thêm vào danh sách đang chọn (tự tạo "Danh sách 1"),
 * icon list nổi bên phải khi lướt, tab Đã lưu thay bằng icon giỏ.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { db } from '../mocks/db.ts'
import { placeId } from '../mocks/data.ts'
import { renderApp } from './render.tsx'

const defaultList = () => db.savedLists.find((l) => l.isDefault)!

describe('Giỏ hẹn (CR-002)', () => {
  it('tim lưu 1 chạm vào "Đã lưu", bấm lần nữa thì bỏ lưu', async () => {
    const { user } = renderApp('/search', { member: true })
    const heart = (await screen.findAllByRole('button', { name: 'Lưu Cà phê Mái Hiên' }))[0]
    await waitFor(() => expect(heart).toBeEnabled())
    await user.click(heart)
    await waitFor(() => expect(defaultList().items.some((i) => i.placeId === placeId(1))).toBe(true))
    const saved = (await screen.findAllByRole('button', { name: 'Bỏ lưu Cà phê Mái Hiên' }))[0]
    expect(saved).toHaveAttribute('aria-pressed', 'true')
    await user.click(saved)
    await waitFor(() => expect(defaultList().items.some((i) => i.placeId === placeId(1))).toBe(false))
  })

  it('nút + khi chưa có danh sách thường thì tự tạo "Danh sách 1" và thêm nơi vào đó', async () => {
    db.savedLists = db.savedLists.filter((l) => l.isDefault)
    const { user } = renderApp('/search', { member: true })
    const add = (await screen.findAllByRole('button', { name: 'Thêm Cà phê Mái Hiên vào danh sách' }))[0]
    expect(await screen.findByRole('button', { name: 'Danh sách: chưa có danh sách' })).toBeInTheDocument() // icon list đã hiện
    await user.click(add)
    await waitFor(() => expect(db.savedLists.find((l) => l.name === 'Danh sách 1')?.items.map((i) => i.placeId)).toEqual([placeId(1)]))
    expect(await screen.findByText(/Đã thêm “Cà phê Mái Hiên” vào “Danh sách 1”/)).toBeInTheDocument()
    // Lần + tiếp theo đi vào cùng danh sách, không tạo thêm.
    await user.click((await screen.findAllByRole('button', { name: 'Thêm Xưởng gốm Đất Lành vào danh sách' }))[0])
    await waitFor(() => expect(db.savedLists.find((l) => l.name === 'Danh sách 1')?.items).toHaveLength(2))
    expect(db.savedLists.filter((l) => l.name.startsWith('Danh sách'))).toHaveLength(1)
  })

  it('icon list cho đổi danh sách mà nút + thêm vào', async () => {
    const { user } = renderApp('/search', { member: true })
    await user.click(await screen.findByRole('button', { name: /Danh sách đang chọn: Cuối tuần này/ }))
    const panel = await screen.findByRole('dialog', { name: 'Chọn danh sách cho nút +' })
    await user.click(within(panel).getByRole('button', { name: /Dịp kỷ niệm/ }))
    await user.click((await screen.findAllByRole('button', { name: 'Thêm Cà phê Mái Hiên vào danh sách' }))[0])
    await waitFor(() => expect(db.savedLists.find((l) => l.name === 'Dịp kỷ niệm')?.items.some((i) => i.placeId === placeId(1))).toBe(true))
  })

  it('thanh điều hướng không còn tab Đã lưu; icon giỏ ở header dẫn tới Giỏ hẹn', async () => {
    renderApp('/', { member: true })
    const cart = await screen.findByRole('link', { name: /^Giỏ hẹn/ })
    expect(cart).toHaveAttribute('href', '/saved')
    expect(screen.queryByRole('link', { name: 'Đã lưu' })).not.toBeInTheDocument()
  })

  it('danh sách "Đã lưu" không đổi tên hoặc xóa được', async () => {
    renderApp(`/saved/${defaultList().id}`, { member: true })
    await screen.findByRole('heading', { level: 1, name: 'Đã lưu' })
    expect(screen.queryByRole('button', { name: 'Đổi tên' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Xóa' })).not.toBeInTheDocument()
  })

  it('nút trái tim ở góc phải header hiển thị số lượng yêu thích và mở hộp Danh sách yêu thích', async () => {
    const { user } = renderApp('/', { member: true })
    const favBtn = await screen.findByRole('button', { name: /^Danh sách yêu thích/ })
    expect(favBtn).toBeInTheDocument()
    await user.click(favBtn)
    const dialog = await screen.findByRole('dialog', { name: 'Danh sách yêu thích' })
    expect(within(dialog).getByRole('heading', { name: 'Danh sách yêu thích' })).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: /Xem toàn bộ yêu thích/ })).toHaveAttribute('href', `/saved/${defaultList().id}`)
  })
})
