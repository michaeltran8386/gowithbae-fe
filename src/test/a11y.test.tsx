/**
 * Kiểm tra accessibility tự động bằng axe-core trên các màn chính (NFR-03, mục tiêu nội bộ WCAG 2.2 AA — A-07).
 * jsdom không tính được màu thật nên tắt `color-contrast` (tương phản đã tính riêng ở 04-design-system-proposal).
 * Đây là kiểm tra tự động, không thay cho kiểm tra thủ công bằng bàn phím/trình đọc màn hình.
 */
import axe from 'axe-core'
import { screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { db } from '../mocks/db.ts'
import { placeId } from '../mocks/data.ts'
import { renderApp } from './render.tsx'

async function violations() {
  const result = await axe.run(document.body, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
    resultTypes: ['violations'],
  })
  return result.violations.map((v) => `${v.impact} ${v.id}: ${v.nodes.map((n) => n.target.join(' ')).slice(0, 3).join(' | ')}`)
}

const PAGES: { path: string; member?: boolean; heading: RegExp }[] = [
  { path: '/', heading: /Khám phá nơi hẹn hò/ },
  { path: '/', member: true, heading: /Khám phá nơi hẹn hò/ },
  { path: '/search?budget=FROM_200K_TO_400K', heading: /Kết quả tìm kiếm/ },
  { path: `/places/${placeId(0)}`, heading: /Xưởng gốm Đất Lành/ },
  { path: `/compare?ids=${placeId(0)},${placeId(2)}`, heading: /So sánh địa điểm/ },
  { path: '/login', heading: /Đăng nhập GoWithBae/ },
  { path: '/saved', member: true, heading: /^Giỏ hẹn$/ },
  { path: `/saved/${'00000006-0000-4000-8000-000000000001'}`, member: true, heading: /Cuối tuần này/ },
  { path: '/invite/loi-moi-mau', heading: /mời bạn cùng chọn/ },
  { path: `/choice/${'00000007-0000-4000-8000-000000000001'}`, member: true, heading: /Cùng chọn với Lan/ },
  { path: '/plans', member: true, heading: /^Buổi hẹn$/ },
  { path: `/plans/${'00000009-0000-4000-8000-000000000001'}`, member: true, heading: /14|:/ },
  { path: '/account', member: true, heading: /^Tài khoản$/ },
  { path: '/account/support/new', member: true, heading: /Gửi yêu cầu hỗ trợ/ },
]

describe('axe: không có vi phạm accessibility tự động phát hiện được', () => {
  for (const page of PAGES) {
    it(`${page.member ? '[thành viên] ' : ''}${page.path}`, async () => {
      void db // dữ liệu minh họa mặc định
      renderApp(page.path, { member: page.member })
      await screen.findByRole('heading', { level: 1, name: page.heading })
      await new Promise((r) => setTimeout(r, 50)) // chờ các khối phụ tải xong
      expect(await violations()).toEqual([])
    })
  }
})
