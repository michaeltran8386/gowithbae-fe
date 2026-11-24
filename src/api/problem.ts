import type { Schemas } from './client.ts'

export type Problem = Schemas['Problem']

/** Lỗi API đã chuẩn hóa về dạng Problem (RFC 9457). `status: 0` = không kết nối được. */
export class ApiError extends Error {
  readonly problem: Problem
  readonly retryAfter: number | null

  constructor(problem: Problem, retryAfter: number | null = null) {
    super(problem.detail ?? problem.title)
    this.name = 'ApiError'
    this.problem = problem
    this.retryAfter = retryAfter
  }

  get status() {
    return this.problem.status
  }
}

const NETWORK_PROBLEM: Problem = { title: 'Không kết nối được máy chủ', status: 0 }

function isProblem(value: unknown): value is Problem {
  return typeof value === 'object' && value !== null && 'status' in value && 'title' in value
}

export function toApiError(error: unknown, response?: Response): ApiError {
  if (error instanceof ApiError) return error
  const retryHeader = response?.headers.get('Retry-After')
  const retryAfter = retryHeader && /^\d+$/.test(retryHeader) ? Number(retryHeader) : null
  if (isProblem(error)) return new ApiError(error, retryAfter)
  if (response) return new ApiError({ title: response.statusText || 'Lỗi máy chủ', status: response.status }, retryAfter)
  return new ApiError(NETWORK_PROBLEM)
}

type FetchResult<T> = { data?: T; error?: unknown; response: Response }

/** Đợi kết quả openapi-fetch: trả `data` hoặc ném ApiError. Lỗi mạng (fetch reject) cũng thành ApiError. */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  let result: FetchResult<T>
  try {
    result = await request
  } catch {
    throw new ApiError(NETWORK_PROBLEM)
  }
  if (result.error !== undefined || !result.response.ok) throw toApiError(result.error, result.response)
  return result.data as T
}

/** Câu chữ theo SRS §5.2 cho mã nghiệp vụ biết trước; mã lạ dùng `detail` của server. */
const CODE_MESSAGES: Record<string, string> = {
  EMAIL_TAKEN: 'Email đã có tài khoản',
  SLOT_TAKEN: 'Lời mời này đã có người tham gia. Hãy liên hệ người mời để nhận liên kết mới.',
  'RULE-06': 'Bạn chỉ có thể so sánh tối đa 3 địa điểm',
  'RULE-08': 'Hãy chọn từ 2 đến 5 địa điểm',
  'RULE-05': 'Địa điểm đóng cửa vào thời gian bạn chọn',
  'RULE-11': 'Phiên này đã được chốt, không thể đổi lựa chọn',
  // CR-002
  GOOGLE_TOKEN_INVALID: 'Không xác minh được tài khoản Google, vui lòng thử lại',
  GOOGLE_EMAIL_UNVERIFIED: 'Email Google của bạn chưa được xác minh',
  GOOGLE_ACCOUNT_CONFLICT: 'Email này đã gắn với một tài khoản Google khác. Hãy liên hệ hỗ trợ.',
  DEFAULT_LIST_LOCKED: 'Không thể đổi tên hoặc xóa danh sách “Đã lưu”',
  LIST_HAS_ACTIVE_SESSION: 'Danh sách này đang có phiên cùng chọn. Mở phiên đó để chia sẻ tiếp.',
}

export function problemMessage(err: unknown): string {
  const e = err instanceof ApiError ? err : toApiError(err)
  const p = e.problem
  if (p.code && CODE_MESSAGES[p.code]) return CODE_MESSAGES[p.code]
  switch (p.status) {
    case 0:
      return 'Không kết nối được máy chủ. Kiểm tra mạng rồi thử lại.'
    case 401:
      return 'Phiên đăng nhập đã hết hạn. Hãy đăng nhập lại.'
    case 403:
    case 404:
      return 'Không tìm thấy nội dung này.'
    case 410:
      return 'Liên kết không còn hiệu lực'
    case 429:
      return e.retryAfter
        ? `Bạn thao tác quá nhanh. Thử lại sau ${Math.ceil(e.retryAfter / 60)} phút.`
        : 'Bạn thao tác quá nhanh. Thử lại sau ít phút.'
    case 501:
      return 'Tính năng này máy chủ chưa hỗ trợ.'
    default:
      return p.detail ?? 'Đã có lỗi xảy ra. Thử lại sau.'
  }
}

/**
 * Bản cho trang quản trị: 403/404 hiện lý do server gửi (vd. "Không được tự duyệt địa điểm do chính mình tạo")
 * thay vì câu chung "Không tìm thấy" — câu chung chỉ hợp với web người dùng, nơi không nên lộ sự tồn tại.
 */
export function adminProblemMessage(err: unknown): string {
  const e = err instanceof ApiError ? err : toApiError(err)
  if ((e.problem.status === 403 || e.problem.status === 404) && e.problem.detail) return e.problem.detail
  return problemMessage(e)
}

/** Lỗi 400 theo trường → map field → message để gắn dưới ô nhập. */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError) || !err.problem.errors) return {}
  return Object.fromEntries(err.problem.errors.map((e) => [e.field, e.message]))
}

export function isStatus(err: unknown, ...statuses: number[]) {
  return err instanceof ApiError && statuses.includes(err.status)
}
