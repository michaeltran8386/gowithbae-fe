import createClient from 'openapi-fetch'
import type { components, paths } from './schema'
import { readStorage, writeStorage } from '../lib/storage.ts'

/**
 * Client có kiểu, sinh từ gowithbae-be/api/openapi.yaml (`npm run gen:api`).
 * Không sửa tay schema.d.ts; sửa contract rồi sinh lại.
 */
// URL tuyệt đối theo origin hiện tại: chạy được cả trong trình duyệt lẫn test (Node fetch không nhận URL tương đối).
// `fetch` đọc lúc gọi (không giữ tham chiếu lúc tạo client) để công cụ chặn mạng như MSW gắn được về sau.
export const api = createClient<paths>({
  baseUrl: `${typeof location === 'undefined' ? '' : location.origin}/api/v1`,
  fetch: (request) => globalThis.fetch(request),
})

export type Schemas = components['schemas']

const TOKEN_KEY = 'gwb.accessToken'
const RECIPIENT_KEY = 'gwb.recipientSession'

let onUnauthorized: (() => void) | null = null

// shortcut: token để trong localStorage cho khung; cân nhắc lại khi chốt cơ chế phiên (OQ-06).
export const session = {
  getAccessToken: () => readStorage(TOKEN_KEY),
  setAccessToken: (t: string | null) => writeStorage(TOKEN_KEY, t),
  getRecipientSession: () => readStorage(RECIPIENT_KEY),
  setRecipientSession: (t: string | null) => writeStorage(RECIPIENT_KEY, t),
  /** AuthProvider đăng ký để xóa phiên + cache khi server trả 401 cho request có bearer. */
  setUnauthorizedHandler: (fn: (() => void) | null) => {
    onUnauthorized = fn
  },
}

api.use({
  onRequest({ request }) {
    const token = session.getAccessToken()
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    const recipient = session.getRecipientSession()
    if (recipient) request.headers.set('X-Recipient-Session', recipient)
    return request
  },
  onResponse({ request, response }) {
    if (response.status === 401 && request.headers.has('Authorization')) onUnauthorized?.()
    return response
  },
})
