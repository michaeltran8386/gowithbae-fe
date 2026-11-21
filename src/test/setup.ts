import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterAll, afterEach, beforeAll } from 'vitest'
import { server } from '../mocks/server.ts'
import { resetDb } from '../mocks/db.ts'
import { resetAdminDb } from '../mocks/admin.ts'
import { resetCatalogDb } from '../mocks/adminCatalog.ts'
import { resetSupportDb } from '../mocks/adminSupport.ts'

// Mock có độ trễ 250–300 ms; khi máy bận, 1 giây mặc định gây test chập chờn.
configure({ asyncUtilTimeout: 5000 }) // cả bộ chạy song song trên máy chậm: route lazy đầu tiên có thể mất >3 giây

beforeAll(() => server.listen({ onUnhandledFrame: 'error' }))
afterEach(() => {
  cleanup()
  server.resetHandlers()
  resetDb()
  resetAdminDb()
  resetCatalogDb()
  resetSupportDb()
  localStorage.clear()
})
afterAll(() => server.close())

// jsdom chưa có đủ API <dialog> và matchMedia
if (!HTMLDialogElement.prototype.showModal) {
  HTMLDialogElement.prototype.showModal = function () {
    this.setAttribute('open', '')
  }
  HTMLDialogElement.prototype.close = function () {
    this.removeAttribute('open')
  }
}
window.matchMedia ??= ((query: string) => ({
  matches: false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
})) as typeof window.matchMedia
