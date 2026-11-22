import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'
import type { paths } from '../api/schema'

/** Hook cho trang quản trị. Quyền thật kiểm tra ở server (SUPER_ADMIN); ẩn/hiện ở FE chỉ là UX. */

export type Role = Schemas['Role']
export type UserStatus = Schemas['UserStatus']
export type ReportQuery = NonNullable<paths['/admin/reports/summary']['get']['parameters']['query']>
export type AuditQuery = NonNullable<paths['/admin/audit-logs']['get']['parameters']['query']>

// ───────── Kích hoạt TOTP (công khai, bằng token) ─────────

export function useMfaActivation(token: string) {
  return useQuery({
    queryKey: ['mfa-activation', token],
    queryFn: () => unwrap(api.GET('/auth/mfa-activation/{token}', { params: { path: { token } } })),
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  })
}

export function useCompleteMfaActivation(token: string) {
  return useMutation({
    mutationFn: (code: string) =>
      unwrap(api.POST('/auth/mfa-activation/{token}', { params: { path: { token } }, body: { code } })),
  })
}

// ───────── Tổng quan ─────────

export function useReportSummary(query: ReportQuery) {
  return useQuery({
    queryKey: ['admin', 'report-summary', query],
    queryFn: () => unwrap(api.GET('/admin/reports/summary', { params: { query } })),
    placeholderData: keepPreviousData,
  })
}

/** Tải CSV báo cáo cùng bộ lọc; trình duyệt lưu thành file. */
export async function downloadReportCsv(query: ReportQuery) {
  const csv = await unwrap(api.GET('/admin/reports/export.csv', { params: { query }, parseAs: 'text' }))
  const url = URL.createObjectURL(new Blob([csv as string], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = `gowithbae-bao-cao-${query.from ?? 'tu-dau'}-${query.to ?? 'hom-nay'}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

export function usePendingPlaces() {
  return useQuery({
    queryKey: ['admin', 'places', 'pending-preview'],
    queryFn: () => unwrap(api.GET('/admin/places', { params: { query: { status: 'PENDING', page: 0, size: 5 } } })),
  })
}

export function useNewPlaceReports() {
  return useQuery({
    queryKey: ['admin', 'place-reports', 'new-preview'],
    queryFn: () => unwrap(api.GET('/admin/place-reports', { params: { query: { status: 'NEW', page: 0, size: 5 } } })),
  })
}

export function useNewTickets() {
  return useQuery({
    queryKey: ['admin', 'tickets', 'new-preview'],
    queryFn: () => unwrap(api.GET('/admin/support-tickets', { params: { query: { status: 'NEW', page: 0, size: 5 } } })),
  })
}

// ───────── Người dùng ─────────

export function useAdminUsers(query: { q?: string; status?: UserStatus; page: number }, options: { enabled?: boolean } = {}) {
  return useQuery({
    enabled: options.enabled ?? true,
    queryKey: ['admin', 'users', query],
    queryFn: () =>
      unwrap(
        api.GET('/admin/users', {
          params: { query: { q: query.q || undefined, status: query.status, page: query.page, size: 20 } },
        }),
      ),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUser(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId],
    queryFn: () => unwrap(api.GET('/admin/users/{userId}', { params: { path: { userId } } })),
  })
}

export function useAdminUserSessions(userId: string, page: number) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'sessions', page],
    queryFn: () =>
      unwrap(api.GET('/admin/users/{userId}/sessions', { params: { path: { userId }, query: { page, size: 20 } } })),
    placeholderData: keepPreviousData,
  })
}

export function useAdminUserActivity(userId: string) {
  return useQuery({
    queryKey: ['admin', 'users', userId, 'activity'],
    queryFn: () => unwrap(api.GET('/admin/users/{userId}/activity', { params: { path: { userId } } })),
  })
}

export function useAdminUserMutations(userId?: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'users'] })
  const path = { userId: userId ?? '' }
  return {
    create: useMutation({
      mutationFn: (body: Schemas['AdminCreateUserRequest']) => unwrap(api.POST('/admin/users', { body })),
      onSuccess: refresh,
    }),
    lock: useMutation({
      mutationFn: (reason: string) => unwrap(api.POST('/admin/users/{userId}/lock', { params: { path }, body: { reason } })),
      onSuccess: refresh,
    }),
    unlock: useMutation({
      mutationFn: (reason: string) =>
        unwrap(api.POST('/admin/users/{userId}/unlock', { params: { path }, body: { reason } })),
      onSuccess: refresh,
    }),
    setRoles: useMutation({
      mutationFn: (body: { roles: Role[]; reason: string }) =>
        unwrap(api.PUT('/admin/users/{userId}/roles', { params: { path }, body })),
      onSuccess: refresh,
    }),
    revokeSessions: useMutation({
      mutationFn: () => unwrap(api.POST('/admin/users/{userId}/sessions/revoke', { params: { path } })),
      onSuccess: refresh,
    }),
    issueActivation: useMutation({
      mutationFn: () => unwrap(api.POST('/admin/users/{userId}/mfa-activation', { params: { path } })),
    }),
    /** Hủy yêu cầu xóa (chờ xóa → đang hoạt động). */
    restore: useMutation({
      mutationFn: (reason: string) =>
        unwrap(api.POST('/admin/users/{userId}/restore', { params: { path }, body: { reason } })),
      onSuccess: refresh,
    }),
    /** Xóa tài khoản bằng ẩn danh hóa, không hoàn tác. */
    erase: useMutation({
      mutationFn: (body: { reason: string; confirmEmail: string }) =>
        unwrap(api.POST('/admin/users/{userId}/erase', { params: { path }, body })),
      onSuccess: refresh,
    }),
  }
}

// ───────── Nhật ký ─────────

export function useAuditLogs(query: AuditQuery) {
  return useQuery({
    queryKey: ['admin', 'audit', query],
    queryFn: () => unwrap(api.GET('/admin/audit-logs', { params: { query } })),
    placeholderData: keepPreviousData,
  })
}

/** Nhãn tiếng Việt cho vai trò; giao diện tập trung vào Thành viên / Quản trị viên. */
export const ROLE_LABELS: Record<Role, string> = {
  MEMBER: 'Thành viên',
  SUPER_ADMIN: 'Quản trị viên',
  EDITOR: 'Biên tập',
  REVIEWER: 'Duyệt nội dung',
  SUPPORT: 'Hỗ trợ',
}

export const STATUS_LABELS: Record<UserStatus, string> = {
  ACTIVE: 'Đang hoạt động',
  LOCKED: 'Đã khóa',
  DELETION_REQUESTED: 'Yêu cầu xóa',
  DELETED: 'Đã xóa',
}
