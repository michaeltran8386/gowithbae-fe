import type { Schemas } from '../api/client.ts'
import { vnDayOfWeek, vnParts } from './format.ts'

type Hours = Schemas['OpeningHours']
type Range = Schemas['TimeRange']

export type DayHours = { kind: 'unknown' } | { kind: 'closed'; note?: string } | { kind: 'open'; ranges: Range[]; note?: string }

/**
 * Giờ của một ngày theo giờ Việt Nam. Ngoại lệ ưu tiên lịch tuần (PROP, SRS RULE-05).
 * Không bao giờ suy ra "đang mở" khi giờ chưa xác minh (RULE-04).
 */
export function hoursOn(hours: Hours, iso: string): DayHours {
  if (hours.status !== 'KNOWN') return { kind: 'unknown' }
  const { date } = vnParts(iso)
  const exception = hours.exceptions?.find((e) => e.date === date)
  if (exception) {
    if (exception.closed) return { kind: 'closed', note: exception.note }
    return exception.ranges?.length ? { kind: 'open', ranges: exception.ranges, note: exception.note } : { kind: 'unknown' }
  }
  const day = hours.weekly?.find((d) => d.dayOfWeek === vnDayOfWeek(iso))
  if (!day || day.ranges.length === 0) return { kind: 'closed' }
  return { kind: 'open', ranges: day.ranges }
}

export const formatRanges = (ranges: Range[]) => ranges.map((r) => `${r.opensAt}–${r.closesAt}`).join(', ')

export function describeDay(day: DayHours): string {
  if (day.kind === 'unknown') return 'Chưa có thông tin giờ mở cửa'
  if (day.kind === 'closed') return day.note ? `Nghỉ (${day.note})` : 'Nghỉ'
  return formatRanges(day.ranges)
}
