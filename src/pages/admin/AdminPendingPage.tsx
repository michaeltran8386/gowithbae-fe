import { EmptyState } from '../../components/ui/StateView.tsx'
import { ButtonLink } from '../../components/ui/Button.tsx'

/** Màn quản trị chưa xây xong (địa điểm, danh mục, nội dung, hỗ trợ — các bước tiếp theo của plan admin). */
export function AdminPendingPage() {
  return (
    <EmptyState title="Màn này đang được xây dựng" action={<ButtonLink to="/admin">Về bảng điều khiển</ButtonLink>}>
      Các màn địa điểm, danh mục, nội dung web và hỗ trợ sẽ có ở bước tiếp theo.
    </EmptyState>
  )
}
