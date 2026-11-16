import { useRef } from 'react'

/**
 * Idempotency-Key cho thao tác tạo (NFR-08): giữ nguyên khi thử lại cùng một lần gửi form,
 * đổi sang key mới khi người dùng sửa dữ liệu (`reset`).
 */
export function useIdempotencyKey() {
  const key = useRef<string | null>(null)
  return {
    get: () => (key.current ??= crypto.randomUUID()),
    reset: () => {
      key.current = null
    },
  }
}
