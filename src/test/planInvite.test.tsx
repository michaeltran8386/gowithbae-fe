/**
 * Mời người ấy xem kế hoạch tạo tay: chủ tạo link, người nhận (không tài khoản) xem và trả lời, chủ thấy câu trả lời.
 */
import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { db } from '../mocks/db.ts'
import { inviteDb } from '../mocks/planInvites.ts'
import { renderApp } from './render.tsx'

const upcoming = () => db.plans.find((p) => p.status === 'SCHEDULED' && new Date(p.scheduledAt).getTime() > Date.now() && !p.choiceSessionId)!

function seedInvite(over: Partial<(typeof inviteDb.invites)[number]> = {}) {
  const invite = { token: 'tok'.padEnd(43, 'x'), planId: upcoming().id, createdAt: new Date().toISOString(), revoked: false, response: null, guestName: null, respondedAt: null, ...over }
  inviteDb.invites.push(invite)
  return invite
}

describe('Mời người ấy xem kế hoạch', () => {
  it('chủ tạo link mời trên trang chi tiết kế hoạch; link chỉ hiện một lần', async () => {
    const { user } = renderApp(`/plans/${upcoming().id}`, { member: true })
    const panel = await screen.findByRole('region', { name: 'Mời người ấy' })
    expect(await within(panel).findByText(/không cần tài khoản/)).toBeInTheDocument()
    await user.click(within(panel).getByRole('button', { name: 'Tạo link mời' }))
    const link = await within(panel).findByRole('textbox', { name: 'Liên kết mời' })
    expect((link as HTMLInputElement).value).toMatch(/\/plan-invite\/\w+/)
    expect(within(panel).getByText(/Link chỉ hiện một lần/)).toBeInTheDocument()
  })

  it('chủ thấy câu trả lời của người ấy', async () => {
    seedInvite({ response: 'GOING', guestName: 'Hà', respondedAt: new Date().toISOString() })
    renderApp(`/plans/${upcoming().id}`, { member: true })
    const panel = await screen.findByRole('region', { name: 'Mời người ấy' })
    expect(await within(panel).findByText(/Hà sẽ đi/)).toBeInTheDocument()
  })

  it('người nhận không cần đăng nhập: xem giờ và địa điểm, không thấy ghi chú, trả lời kèm tên', async () => {
    const invite = seedInvite()
    const plan = upcoming()
    const { user } = renderApp(`/plan-invite/${invite.token}`)
    expect(await screen.findByText(/mời bạn đi hẹn/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/tại /)
    if (plan.note) expect(screen.queryByText(plan.note)).not.toBeInTheDocument()

    await user.type(screen.getByLabelText(/Tên của bạn/), 'Hà')
    await user.click(screen.getByRole('button', { name: 'Mình sẽ đi' }))
    expect(await screen.findByText(/Bạn đã trả lời: Mình sẽ đi/)).toBeInTheDocument()
    expect(invite.response).toBe('GOING')
    expect(invite.guestName).toBe('Hà')
    expect(inviteDb.notifications).toBe(1)
  })

  it('link đã thu hồi hoặc không tồn tại thì báo rõ', async () => {
    const invite = seedInvite({ revoked: true })
    renderApp(`/plan-invite/${invite.token}`)
    expect(await screen.findByRole('heading', { name: 'Link mời không còn hiệu lực' })).toBeInTheDocument()
  })
})
