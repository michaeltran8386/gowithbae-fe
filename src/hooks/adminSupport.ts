import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api, type Schemas } from '../api/client.ts'
import { unwrap } from '../api/problem.ts'

/** Hook quản trị nội dung web, thông báo, báo sai (phần C) và yêu cầu hỗ trợ (phần C). */

// ───────── Nội dung trang ─────────

export type SiteContent = Schemas['SiteContent']

/** Nội dung công khai: hero, banner, FAQ, điều khoản, quyền riêng tư, liên hệ, footer. Cache 10 phút. */
export function useSiteContent() {
  return useQuery({
    queryKey: ['site-content'],
    queryFn: () => unwrap(api.GET('/site-content')),
    staleTime: 10 * 60_000,
  })
}

export function useAdminSiteContent() {
  return useQuery({ queryKey: ['admin', 'site-content'], queryFn: () => unwrap(api.GET('/admin/site-content')) })
}

export function useSaveSiteContent() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SiteContent) => unwrap(api.PUT('/admin/site-content', { body })),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'site-content'], data)
      qc.invalidateQueries({ queryKey: ['site-content'] })
    },
  })
}

// ───────── Thông báo ─────────

export function useSentNotifications(page: number) {
  return useQuery({
    queryKey: ['admin', 'notifications', page],
    queryFn: () => unwrap(api.GET('/admin/notifications/sent', { params: { query: { page, size: 20 } } })),
    placeholderData: keepPreviousData,
  })
}

export function useSendNotification() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: Schemas['AdminNotificationRequest']) => unwrap(api.POST('/admin/notifications', { body })),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'notifications'] }),
  })
}

// ───────── Báo sai địa điểm ─────────

export type ReportStatus = Schemas['PlaceReportStatus']

export const REPORT_STATUS_LABELS: Record<ReportStatus, string> = {
  NEW: 'Mới',
  CHECKING: 'Đang kiểm tra',
  RESOLVED: 'Đã sửa',
  INSUFFICIENT: 'Không đủ căn cứ',
}

export const REPORT_REASON_LABELS: Record<Schemas['PlaceReportReason'], string> = {
  WRONG_PRICE: 'Sai giá',
  WRONG_HOURS: 'Sai giờ mở cửa',
  WRONG_ADDRESS: 'Sai địa chỉ',
  CLOSED: 'Đã đóng cửa',
  WRONG_IMAGE: 'Ảnh không đúng',
  OTHER: 'Khác',
}

/** Bước chuyển hợp lệ theo PlaceReportService (backend). Đóng (RESOLVED/INSUFFICIENT) bắt buộc ghi chú. */
export const REPORT_NEXT: Record<ReportStatus, ReportStatus[]> = {
  NEW: ['CHECKING', 'RESOLVED', 'INSUFFICIENT'],
  CHECKING: ['RESOLVED', 'INSUFFICIENT'],
  RESOLVED: ['CHECKING'],
  INSUFFICIENT: ['CHECKING'],
}

export function useAdminPlaceReports(q: { status?: ReportStatus; page: number }) {
  return useQuery({
    queryKey: ['admin', 'place-reports', q],
    queryFn: () => unwrap(api.GET('/admin/place-reports', { params: { query: { status: q.status, page: q.page, size: 20 } } })),
    placeholderData: keepPreviousData,
  })
}

export function useAdminPlaceReport(reportId: string) {
  return useQuery({
    queryKey: ['admin', 'place-reports', 'detail', reportId],
    queryFn: () => unwrap(api.GET('/admin/place-reports/{reportId}', { params: { path: { reportId } } })),
  })
}

export function useTransitionPlaceReport() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (input: { id: string; status: ReportStatus; note?: string; assigneeId?: string }) =>
      unwrap(
        api.POST('/admin/place-reports/{reportId}/transitions', {
          params: { path: { reportId: input.id } },
          body: { status: input.status, note: input.note, assigneeId: input.assigneeId },
        }),
      ),
    onSuccess: (data) => {
      qc.setQueryData(['admin', 'place-reports', 'detail', data.id], data)
      qc.invalidateQueries({ queryKey: ['admin', 'place-reports'] })
    },
  })
}

// ───────── Yêu cầu hỗ trợ ─────────

export type TicketStatus = Schemas['TicketStatus']

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'Mới',
  IN_PROGRESS: 'Đang xử lý',
  WAITING_CUSTOMER: 'Chờ khách phản hồi',
  CLOSED: 'Đã đóng',
}

export const TICKET_CATEGORY_LABELS: Record<string, string> = {
  ACCOUNT: 'Tài khoản',
  PLACE_INFO: 'Thông tin địa điểm',
  DATE_PLAN: 'Kế hoạch hẹn',
  OTHER: 'Khác',
}

export function useAdminTickets(q: { status?: TicketStatus; page: number }) {
  return useQuery({
    queryKey: ['admin', 'tickets', q],
    queryFn: () => unwrap(api.GET('/admin/support-tickets', { params: { query: { status: q.status, page: q.page, size: 20 } } })),
    placeholderData: keepPreviousData,
  })
}

export function useAdminTicket(ticketId: string) {
  return useQuery({
    queryKey: ['admin', 'tickets', 'detail', ticketId],
    queryFn: () => unwrap(api.GET('/admin/support-tickets/{ticketId}', { params: { path: { ticketId } } })),
  })
}

export function useTicketMutations(ticketId: string) {
  const qc = useQueryClient()
  const refresh = () => qc.invalidateQueries({ queryKey: ['admin', 'tickets'] })
  return {
    reply: useMutation({
      mutationFn: (body: { body: string; visibility: Schemas['MessageVisibility'] }) =>
        unwrap(api.POST('/admin/support-tickets/{ticketId}/messages', { params: { path: { ticketId } }, body })),
      onSuccess: refresh,
    }),
    transition: useMutation({
      mutationFn: (status: TicketStatus) =>
        unwrap(api.POST('/admin/support-tickets/{ticketId}/transitions', { params: { path: { ticketId } }, body: { status } })),
      onSuccess: (data) => {
        qc.setQueryData(['admin', 'tickets', 'detail', ticketId], data)
        refresh()
      },
    }),
  }
}
