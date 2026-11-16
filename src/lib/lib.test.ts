import { describe, expect, it } from 'vitest'
import { ApiError, fieldErrors, problemMessage, toApiError, unwrap } from '../api/problem.ts'
import { formatDistance, priceForTwo, toVnIso, vnParts } from './format.ts'
import { describeDay, hoursOn } from './hours.ts'

describe('format', () => {
  it('giá chưa biết trả null để UI hiện "Chưa có thông tin" (RULE-04)', () => {
    expect(priceForTwo({ status: 'UNKNOWN' })).toBeNull()
    expect(priceForTwo({ status: 'KNOWN', standardForTwo: null })).toBeNull()
    expect(priceForTwo({ status: 'KNOWN', standardForTwo: 0 })).toMatch(/0\s?₫/)
  })

  it('ngày giờ người dùng chọn hiểu là giờ Việt Nam (+07:00) và đọc lại đúng', () => {
    const iso = toVnIso('2026-11-20', '19:30')
    expect(iso).toBe('2026-11-20T19:30:00+07:00')
    expect(vnParts(iso)).toEqual({ date: '2026-11-20', time: '19:30' })
    expect(vnParts('2026-11-20T23:00:00Z')).toEqual({ date: '2026-11-21', time: '06:00' })
  })

  it('khoảng cách luôn ghi "ước tính", không quy ra thời gian (FR-04)', () => {
    expect(formatDistance(0.85)).toBe('850 m (ước tính)')
    expect(formatDistance(2.4)).toContain('km (ước tính)')
  })
})

describe('hours', () => {
  const hours = {
    status: 'KNOWN' as const,
    weekly: [{ dayOfWeek: 5, ranges: [{ opensAt: '09:00', closesAt: '21:00' }] }],
    exceptions: [{ date: '2026-11-27', closed: true, note: 'Nghỉ lễ' }],
  }
  it('giờ chưa xác minh không bao giờ coi là đang mở', () => {
    expect(hoursOn({ status: 'UNKNOWN' }, '2026-11-20T12:00:00+07:00')).toEqual({ kind: 'unknown' })
  })
  it('ngoại lệ ưu tiên lịch tuần (PROP RULE-05)', () => {
    expect(hoursOn(hours, '2026-11-20T12:00:00+07:00').kind).toBe('open') // Thứ Sáu
    expect(describeDay(hoursOn(hours, '2026-11-27T12:00:00+07:00'))).toBe('Nghỉ (Nghỉ lễ)') // Thứ Sáu, ngoại lệ
    expect(hoursOn(hours, '2026-11-21T12:00:00+07:00').kind).toBe('closed') // Thứ Bảy không có lịch
  })
})

describe('problem', () => {
  it('chuẩn hóa lỗi mạng và lỗi theo trường', async () => {
    await expect(unwrap(Promise.reject(new TypeError('fetch failed')))).rejects.toMatchObject({ status: 0 })
    const err = new ApiError({ title: 'Bad', status: 400, errors: [{ field: 'email', message: 'Email không hợp lệ' }] })
    expect(fieldErrors(err)).toEqual({ email: 'Email không hợp lệ' })
  })
  it('câu chữ theo mã nghiệp vụ / trạng thái (SRS §5.2)', () => {
    expect(problemMessage(new ApiError({ title: 'x', status: 409, code: 'RULE-06' }))).toBe('Bạn chỉ có thể so sánh tối đa 3 địa điểm')
    expect(problemMessage(new ApiError({ title: 'x', status: 410 }))).toBe('Liên kết không còn hiệu lực')
    const res = new Response(null, { status: 429, headers: { 'Retry-After': '120' } })
    expect(problemMessage(toApiError({ title: 'Too many', status: 429 }, res))).toContain('2 phút')
  })
})
