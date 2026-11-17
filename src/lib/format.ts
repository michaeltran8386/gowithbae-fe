import type { Schemas } from '../api/client.ts'

export const VN_TZ = 'Asia/Ho_Chi_Minh'

const vndFormatter = new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })

export function formatVnd(amount: number): string {
  return vndFormatter.format(amount)
}

/** Giá chuẩn hai người; null khi chưa biết (RULE-04) — UI hiển thị "Chưa có thông tin". */
export function priceForTwo(price: Schemas['Price']): string | null {
  if (price.status !== 'KNOWN' || price.standardForTwo == null) return null
  return formatVnd(price.standardForTwo)
}

const weekdayFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, weekday: 'long' })
const dateFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, day: '2-digit', month: '2-digit', year: 'numeric' })
const timeFormatter = new Intl.DateTimeFormat('vi-VN', { timeZone: VN_TZ, hour: '2-digit', minute: '2-digit' })

/** "Thứ Hai, 16/11/2026 lúc 19:00" (Intl vi-VN đặt giờ trước ngày, đọc không tự nhiên). */
export function formatDateTime(iso: string) {
  const d = new Date(iso)
  return `${weekdayFormatter.format(d)}, ${dateFormatter.format(d)} lúc ${timeFormatter.format(d)}`
}
export const formatDate = (iso: string) => dateFormatter.format(new Date(iso))
export const formatTime = (iso: string) => timeFormatter.format(new Date(iso))

/** Ngày dạng `YYYY-MM-DD` (không có giờ) → dd/mm/yyyy, không đổi múi giờ. */
export function formatPlainDate(date: string): string {
  const [y, m, d] = date.split('-')
  return `${d}/${m}/${y}`
}

const relative = new Intl.RelativeTimeFormat('vi-VN', { numeric: 'auto' })
export function formatRelative(iso: string, now = Date.now()): string {
  const diff = (new Date(iso).getTime() - now) / 1000
  const abs = Math.abs(diff)
  if (abs < 60) return relative.format(Math.round(diff), 'second')
  if (abs < 3600) return relative.format(Math.round(diff / 60), 'minute')
  if (abs < 86400) return relative.format(Math.round(diff / 3600), 'hour')
  if (abs < 86400 * 30) return relative.format(Math.round(diff / 86400), 'day')
  return formatDate(iso)
}

/** Phần ngày/giờ theo giờ Việt Nam của một thời điểm (cho form sửa). */
export function vnParts(iso: string): { date: string; time: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: VN_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
      .formatToParts(new Date(iso))
      .map((p) => [p.type, p.value]),
  )
  return { date: `${parts.year}-${parts.month}-${parts.day}`, time: `${parts.hour}:${parts.minute}` }
}

/** Ngày + giờ người dùng chọn (hiểu là giờ Việt Nam) → ISO-8601 offset +07:00 gửi API. */
export function toVnIso(date: string, time: string): string {
  return `${date}T${time}:00+07:00`
}

/** Thứ trong tuần theo giờ VN: 1 = Thứ Hai … 7 = Chủ Nhật (khớp contract OpeningHours). */
export function vnDayOfWeek(iso: string): number {
  const name = new Intl.DateTimeFormat('en-US', { timeZone: VN_TZ, weekday: 'short' }).format(new Date(iso))
  return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].indexOf(name) + 1
}

/** Khoảng cách luôn ghi "ước tính" và không quy đổi ra thời gian đi (FR-04). */
export function formatDistance(km: number): string {
  const text = km < 1 ? `${Math.round(km * 1000)} m` : `${km.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} km`
  return `${text} (ước tính)`
}

export const DAY_NAMES = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật']
