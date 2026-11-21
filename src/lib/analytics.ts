/**
 * Sự kiện phân tích FR-32 qua POST /events.
 * Không gửi token, OTP, ghi chú, từ khóa thô hay tọa độ (RULE-25). Lỗi analytics không bao giờ ảnh hưởng UI.
 * Phiên phân tích kết thúc sau 30 phút không hoạt động — đề xuất nguồn (§10.3, PROP).
 */
import { api, session, type Schemas } from '../api/client.ts'
import { readStorage, writeStorage } from './storage.ts'

type EventName = Schemas['AnalyticsEvent']['name']

/** Whitelist thuộc tính theo từng sự kiện, khớp schema snake_case của EventsDelegate (BE). */
const ALLOWED_PROPS: Partial<Record<EventName, string[]>> = {
  search_submitted: ['search_id', 'area_id', 'category_id'],
  results_shown: ['search_id', 'results_count', 'area_id', 'category_id'],
  place_viewed: ['area_id', 'category_id'],
  place_saved: ['area_id', 'category_id'],
  comparison_opened: ['area_id', 'category_id'],
  invite_created: ['area_id', 'category_id'],
  vote_submitted: ['candidate_id', 'preference', 'area_id', 'category_id'],
  date_plan_created: ['area_id', 'category_id'],
  visit_self_reported: ['answer', 'area_id', 'category_id'],
}

const SESSION_KEY = 'gwb.analyticsSession'
const ANON_KEY = 'gwb.anonymousId'
const IDLE_MS = 30 * 60 * 1000

let queue: Schemas['AnalyticsEvent'][] = []
let timer: ReturnType<typeof setTimeout> | null = null

function analyticsSessionId() {
  const now = Date.now()
  const [id, last] = (readStorage(SESSION_KEY) ?? '').split('|')
  const sid = id && now - Number(last) < IDLE_MS ? id : crypto.randomUUID()
  writeStorage(SESSION_KEY, `${sid}|${now}`)
  return sid
}

function anonymousId() {
  let id = readStorage(ANON_KEY)
  if (!id) {
    id = crypto.randomUUID()
    writeStorage(ANON_KEY, id)
  }
  return id
}

export function track(name: EventName, options: { objectId?: string; properties?: Record<string, string | number> } = {}) {
  if (import.meta.env.MODE === 'test') return
  const allowed = ALLOWED_PROPS[name] ?? []
  const properties = Object.fromEntries(
    Object.entries(options.properties ?? {})
      .filter(([k]) => allowed.includes(k))
      .map(([k, v]) => [k, String(v)]),
  )
  queue.push({
    eventId: crypto.randomUUID(),
    name,
    occurredAt: new Date().toISOString(),
    sessionId: analyticsSessionId(),
    anonymousId: session.getAccessToken() ? undefined : anonymousId(),
    platform: window.matchMedia('(min-width: 768px)').matches ? 'WEB_DESKTOP' : 'WEB_MOBILE',
    objectId: options.objectId,
    properties,
  })
  timer ??= setTimeout(flush, 5000)
}

export function flush() {
  timer = null
  if (queue.length === 0) return
  const events = queue
  queue = []
  api.POST('/events', { body: { events } }).catch(() => {
    /* bỏ qua: không ảnh hưởng nghiệp vụ */
  })
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush()
  })
}
