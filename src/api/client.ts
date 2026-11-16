import createClient from 'openapi-fetch'
import type { components, paths } from './schema'

/**
 * Client có kiểu, sinh từ gowithbae-be/api/openapi.yaml (`npm run gen:api`).
 * Không sửa tay schema.d.ts; sửa contract rồi sinh lại.
 */
export const api = createClient<paths>({ baseUrl: '/api/v1' })

export type Schemas = components['schemas']

const TOKEN_KEY = 'gwb.accessToken'
const RECIPIENT_KEY = 'gwb.recipientSession'

// shortcut: token để trong localStorage cho khung; cân nhắc lại khi chốt cơ chế phiên (OQ-06).
export const session = {
  setAccessToken: (t: string | null) => store(TOKEN_KEY, t),
  setRecipientSession: (t: string | null) => store(RECIPIENT_KEY, t),
}

function store(key: string, value: string | null) {
  try {
    if (value) localStorage.setItem(key, value)
    else localStorage.removeItem(key)
  } catch {
    /* private mode: bỏ qua */
  }
}

function read(key: string) {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

api.use({
  onRequest({ request }) {
    const token = read(TOKEN_KEY)
    if (token) request.headers.set('Authorization', `Bearer ${token}`)
    const recipient = read(RECIPIENT_KEY)
    if (recipient) request.headers.set('X-Recipient-Session', recipient)
    return request
  },
})
