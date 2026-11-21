/** Trạng thái trong bộ nhớ cho mock (DỮ LIỆU MINH HỌA). `resetDb()` dùng giữa các test. */
import type { Schemas } from '../api/client.ts'
import { collections, me, places, placeId, toCard, uidFactory } from './data.ts'

type SavedList = { id: string; name: string; createdAt: string; items: { placeId: string; addedAt: string }[] }
type Session = {
  id: string
  creatorIsMe: boolean
  creatorName: string
  recipientName: string | null
  candidateIds: string[]
  votes: Record<'creator' | 'recipient', Record<string, Schemas['VotePreference']>>
  status: Schemas['ChoiceSessionStatus']
  grant: { id: string; token: string; status: 'VALID' | 'EXPIRED' | 'REVOKED'; expiresAt: string } | null
  datePlanId: string | null
  createdAt: string
  finalizedAt: string | null
}
type Plan = {
  id: string
  placeId: string
  scheduledAt: string
  note: string | null
  status: Schemas['DatePlanStatus']
  choiceSessionId: string | null
  visitAnswer: 'YES' | 'NO' | null
  reminderStatus?: Schemas['DateReminderStatus']
  reminderDismissedAt?: string | null
  createdAt: string
  updatedAt: string
}
type Ticket = Schemas['SupportTicketDetail']

let seq = 1000
export const newId = (prefix = '0000000f') => uidFactory(prefix, ++seq)

const hoursFromNow = (h: number) => new Date(Date.now() + h * 3600_000).toISOString()
const daysFromNow = (d: number) => hoursFromNow(d * 24)

function createDb() {
  const meCopy: Schemas['User'] = { ...me }
  const savedLists: SavedList[] = [
    {
      id: uidFactory('00000006', 1),
      name: 'Cuối tuần này',
      createdAt: daysFromNow(-6),
      items: [0, 1, 2, 7].map((i) => ({ placeId: placeId(i), addedAt: daysFromNow(-5) })),
    },
    { id: uidFactory('00000006', 2), name: 'Dịp kỷ niệm', createdAt: daysFromNow(-20), items: [{ placeId: placeId(5), addedAt: daysFromNow(-19) }] },
  ]
  const sessions: Session[] = [
    {
      id: uidFactory('00000007', 1),
      creatorIsMe: true,
      creatorName: meCopy.displayName,
      recipientName: 'Lan',
      candidateIds: [placeId(1), placeId(0), placeId(2)],
      votes: { creator: { [placeId(1)]: 'LIKE', [placeId(0)]: 'LIKE' }, recipient: { [placeId(1)]: 'LIKE', [placeId(0)]: 'SKIP' } },
      status: 'VOTING',
      grant: { id: uidFactory('00000008', 1), token: 'loi-moi-cua-toi', status: 'VALID', expiresAt: daysFromNow(5) },
      datePlanId: null,
      createdAt: daysFromNow(-1),
      finalizedAt: null,
    },
    {
      id: uidFactory('00000007', 2),
      creatorIsMe: false,
      creatorName: 'Hà',
      recipientName: null,
      candidateIds: [placeId(3), placeId(5), placeId(4)],
      votes: { creator: { [placeId(3)]: 'LIKE' }, recipient: {} },
      status: 'WAITING',
      grant: { id: uidFactory('00000008', 2), token: 'loi-moi-mau', status: 'VALID', expiresAt: daysFromNow(6) },
      datePlanId: null,
      createdAt: daysFromNow(-1),
      finalizedAt: null,
    },
    {
      id: uidFactory('00000007', 3),
      creatorIsMe: false,
      creatorName: 'Tú',
      recipientName: null,
      candidateIds: [placeId(1), placeId(4)],
      votes: { creator: {}, recipient: {} },
      status: 'WAITING',
      grant: { id: uidFactory('00000008', 3), token: 'loi-moi-da-thu-hoi', status: 'REVOKED', expiresAt: daysFromNow(3) },
      datePlanId: null,
      createdAt: daysFromNow(-2),
      finalizedAt: null,
    },
  ]
  const plans: Plan[] = [
    {
      // Đã đến giờ hẹn, chưa trả lời → hiện lời nhắc "Đi chưa?" (FR-18)
      id: uidFactory('00000009', 1),
      placeId: placeId(0),
      scheduledAt: hoursFromNow(-2),
      note: 'Mang áo khoác mỏng.',
      status: 'SCHEDULED',
      choiceSessionId: null,
      visitAnswer: null,
      createdAt: daysFromNow(-4),
      updatedAt: daysFromNow(-4),
    },
    {
      id: uidFactory('00000009', 2),
      placeId: placeId(3),
      scheduledAt: daysFromNow(3),
      note: null,
      status: 'SCHEDULED',
      choiceSessionId: null,
      visitAnswer: null,
      createdAt: daysFromNow(-1),
      updatedAt: daysFromNow(-1),
    },
    {
      id: uidFactory('00000009', 3),
      placeId: placeId(2),
      scheduledAt: daysFromNow(-10),
      note: null,
      status: 'CANCELLED',
      choiceSessionId: null,
      visitAnswer: null,
      createdAt: daysFromNow(-15),
      updatedAt: daysFromNow(-11),
    },
    {
      id: uidFactory('00000009', 4),
      placeId: placeId(1),
      scheduledAt: daysFromNow(-14),
      note: null,
      status: 'PAST',
      choiceSessionId: null,
      visitAnswer: 'YES',
      createdAt: daysFromNow(-20),
      updatedAt: daysFromNow(-14),
    },
  ]
  const tickets: Ticket[] = [
    {
      id: uidFactory('0000000a', 1),
      category: 'PLACE_INFO',
      subject: 'Giờ mở cửa ở Sân thượng Hoàng Hôn',
      status: 'WAITING_CUSTOMER',
      assigneeName: 'Hỗ trợ GoWithBae',
      createdAt: daysFromNow(-3),
      updatedAt: daysFromNow(-1),
      messages: [
        { id: newId(), authorName: meCopy.displayName, fromStaff: false, visibility: 'PUBLIC', body: 'Mình thấy quán chưa có giờ mở cửa, nhờ cập nhật giúp.', createdAt: daysFromNow(-3) },
        { id: newId(), authorName: 'Hỗ trợ GoWithBae', fromStaff: true, visibility: 'PUBLIC', body: 'Cảm ơn bạn. Bạn đến quán vào khoảng giờ nào để chúng tôi đối chiếu?', createdAt: daysFromNow(-1) },
      ],
    },
  ]
  const notifications: Schemas['Notification'][] = [
    {
      id: uidFactory('0000000b', 1),
      type: 'SUPPORT_REPLIED',
      objectType: 'SUPPORT_TICKET',
      objectId: tickets[0].id,
      summary: 'Hỗ trợ đã trả lời yêu cầu “Giờ mở cửa ở Sân thượng Hoàng Hôn”.',
      readAt: null,
      createdAt: daysFromNow(-1),
    },
    {
      id: uidFactory('0000000b', 2),
      type: 'DATE_PLAN_CANCELLED',
      objectType: 'DATE_PLAN',
      objectId: plans[2].id,
      summary: 'Buổi hẹn tại Sân thượng Hoàng Hôn đã được hủy.',
      readAt: daysFromNow(-10),
      createdAt: daysFromNow(-11),
    },
  ]
  return { me: meCopy, savedLists, sessions, plans, tickets, notifications, reports: 0, loggedIn: false }
}

export let db = createDb()
export function resetDb() {
  db = createDb()
}

export const findPlace = (id: string) => places.find((p) => p.id === id)
export const isVisible = (id: string) => {
  const p = findPlace(id)
  return !!p && !p.hidden
}

export function listSummary(l: SavedList): Schemas['SavedListSummary'] {
  return { id: l.id, name: l.name, placeCount: l.items.length, createdAt: l.createdAt }
}

export function listDetail(l: SavedList): Schemas['SavedListDetail'] {
  return {
    ...listSummary(l),
    items: l.items.map((it) => ({ place: toCard(findPlace(it.placeId)!), available: isVisible(it.placeId), addedAt: it.addedAt })),
  }
}

export function sessionView(s: Session, viewer: 'CREATOR' | 'RECIPIENT'): Schemas['ChoiceSession'] {
  const mine = viewer === 'CREATOR' ? s.votes.creator : s.votes.recipient
  return {
    id: s.id,
    status: s.status,
    viewerRole: viewer,
    creatorName: s.creatorName,
    recipientName: s.recipientName,
    candidates: s.candidateIds.map((pid) => ({
      id: pid,
      place: toCard(findPlace(pid)!),
      available: isVisible(pid),
      myVote: mine[pid] ?? null,
      partnerVote: null, // OQ-07: mặc định không lộ phiếu riêng của người kia
      mutualLike: s.votes.creator[pid] === 'LIKE' && s.votes.recipient[pid] === 'LIKE',
    })),
    activeShareGrant:
      viewer === 'CREATOR' && s.grant ? { id: s.grant.id, expiresAt: s.grant.expiresAt, status: s.grant.status } : undefined,
    datePlanId: s.datePlanId,
    createdAt: s.createdAt,
    finalizedAt: s.finalizedAt,
  }
}

export function planView(p: Plan, viewer: 'OWNER' | 'RECIPIENT'): Schemas['DatePlan'] {
  const place = findPlace(p.placeId)!
  const warnings = place.hours.status === 'UNKNOWN' ? [{ code: 'HOURS_UNKNOWN', message: 'Chưa có thông tin giờ mở cửa' }] : []
  return {
    id: p.id,
    place: toCard(place),
    placeAvailable: !place.hidden,
    scheduledAt: p.scheduledAt,
    note: p.note,
    status: p.status,
    viewerRole: viewer,
    reservationHeld: false,
    choiceSessionId: p.choiceSessionId,
    visitAnswer: p.visitAnswer,
    warnings,
    createdAt: p.createdAt,
    updatedAt: p.updatedAt,
  }
}

export const collectionSummary = (c: (typeof collections)[number]): Schemas['CollectionSummary'] => ({
  id: c.id,
  title: c.title,
  coverUrl: c.coverUrl,
})

export type { Plan, Session, SavedList }
