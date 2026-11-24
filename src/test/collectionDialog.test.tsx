/**
 * Popup bộ sưu tập: bấm một bộ sưu tập ở Khám phá mở cửa sổ giữa màn hình (không chuyển trang),
 * có tim và "+" trên từng nơi; đóng bằng nút Đóng hoặc nút Quay lại.
 */
import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { collections, places } from '../mocks/data.ts'
import { db } from '../mocks/db.ts'
import { renderApp } from './render.tsx'

const first = collections[0]
const visiblePlaces = first.placeIds.map((id) => places.find((p) => p.id === id)!).filter((p) => !p.hidden)

describe('Popup bộ sưu tập', () => {
  it('bấm bộ sưu tập mở popup tại chỗ, hiện các nơi, đóng thì về lại Khám phá', async () => {
    const { user, router } = renderApp('/')
    await user.click(await screen.findByRole('button', { name: first.title }))
    const dialog = await screen.findByRole('dialog', { name: first.title })
    expect(router.state.location.pathname).toBe('/')
    expect(router.state.location.search).toContain(`collection=${first.id}`)
    for (const p of visiblePlaces) expect(await within(dialog).findByRole('link', { name: p.name })).toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: 'Đóng' }))
    await waitFor(() => expect(screen.queryByRole('dialog', { name: first.title })).not.toBeInTheDocument())
    expect(router.state.location.search).not.toContain('collection=')
  })

  it('thành viên bấm + trong popup thêm vào danh sách đang chọn; thanh đáy cho đổi danh sách', async () => {
    const { user } = renderApp(`/?collection=${first.id}`, { member: true })
    const dialog = await screen.findByRole('dialog', { name: first.title })
    const picker = await within(dialog).findByRole('combobox', { name: /Nút \+ thêm vào/ })
    const target = db.savedLists.find((l) => l.name === 'Dịp kỷ niệm')!
    await user.selectOptions(picker, target.id)
    const place = visiblePlaces.find((p) => !target.items.some((i) => i.placeId === p.id))!
    await user.click(within(dialog).getByRole('button', { name: `Thêm ${place.name} vào danh sách` }))
    await waitFor(() => expect(target.items.some((i) => i.placeId === place.id)).toBe(true))
    expect(within(dialog).getByRole('button', { name: `Lưu ${place.name}` })).toBeInTheDocument() // có tim
  })
})
