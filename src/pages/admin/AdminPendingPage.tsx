import { EmptyState } from '../../components/ui/StateView.tsx'

/** Quản trị F2 chưa lên lịch: chờ OQ-15 (phiên bản nội dung), OQ-18 (phân quyền), OQ-19 (CSV), OQ-20 (báo cáo). */
export function AdminPendingPage() {
  return (
    <>
      <h1 className="mb-4 text-2xl font-bold">Quản trị</h1>
      <EmptyState title="Phần quản trị chưa được xây dựng">
        Đợt này làm web khách hàng. Màn quản trị sẽ làm sau khi chốt phân quyền và quy trình duyệt nội dung.
      </EmptyState>
    </>
  )
}
