import { useEffect, useState } from 'react'

/**
 * Thời điểm hiện tại, tự cập nhật định kỳ (mặc định 60 giây) và khi quay lại tab.
 * Dùng cho lời nhắc "Đi chưa?" xuất hiện đúng giờ hẹn khi web đang mở (AC-057, UF-14).
 */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const tick = () => setNow(Date.now())
    const id = setInterval(tick, intervalMs)
    const onVisible = () => document.visibilityState === 'visible' && tick()
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [intervalMs])
  return now
}
