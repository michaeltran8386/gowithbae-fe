import { createBrowserRouter } from 'react-router'
import { AppLayout } from './layouts/AppLayout.tsx'
import { AdminLayout } from './layouts/AdminLayout.tsx'
import { Placeholder } from './pages/Placeholder.tsx'
import { SearchPage } from './pages/SearchPage.tsx'

// Mã màn hình theo srs/GoWithBae_UI_Review_v1 (C01–C08, A01) và §8 của GWB-REQ-G1.
export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <Placeholder code="C01" title="Khám phá" fr="FR-01" /> },
      { path: 'search', element: <SearchPage /> },
      { path: 'places/:placeId', element: <Placeholder code="C03" title="Chi tiết địa điểm" fr="FR-05" /> },
      { path: 'compare', element: <Placeholder code="C04" title="So sánh" fr="FR-06" /> },
      { path: 'saved', element: <Placeholder code="C05" title="Danh sách đã lưu" fr="FR-09, FR-10" /> },
      { path: 'invite/:inviteToken', element: <Placeholder code="C06" title="Tham gia cùng chọn" fr="FR-11" /> },
      { path: 'choice/:sessionId', element: <Placeholder code="C06" title="Bỏ phiếu cùng chọn" fr="FR-12" /> },
      { path: 'choice/:sessionId/results', element: <Placeholder code="C07" title="Hai người cùng thích" fr="FR-12, FR-13" /> },
      { path: 'plans', element: <Placeholder code="UI07" title="Buổi hẹn" fr="FR-15, FR-16" /> },
      { path: 'plans/:planId', element: <Placeholder code="C08" title="Chi tiết buổi hẹn" fr="FR-16..18" /> },
      { path: 'account', element: <Placeholder code="UI08" title="Tài khoản" fr="FR-07, FR-08, FR-20, FR-21" /> },
      { path: 'login', element: <Placeholder code="UI08" title="Đăng nhập" fr="FR-07" /> },
      { path: '*', element: <Placeholder code="404" title="Không tìm thấy trang" /> },
    ],
  },
  {
    path: 'admin',
    element: <AdminLayout />,
    children: [
      { index: true, element: <Placeholder code="A01" title="Hàng chờ duyệt" fr="FR-23, FR-24" /> },
      { path: 'places/:placeId', element: <Placeholder code="A01" title="Biên tập địa điểm" fr="FR-23" /> },
      { path: 'taxonomies', element: <Placeholder code="A02" title="Danh mục" fr="FR-25" /> },
      { path: 'collections', element: <Placeholder code="A03" title="Bộ sưu tập" fr="FR-26" /> },
      { path: 'users', element: <Placeholder code="A04" title="Tài khoản & vai trò" fr="FR-27" /> },
      { path: 'tickets', element: <Placeholder code="A05" title="Báo sai & hỗ trợ" fr="FR-28, FR-29" /> },
      { path: 'imports', element: <Placeholder code="A01" title="Nhập CSV" fr="FR-30" /> },
      { path: 'reports', element: <Placeholder code="A06" title="Báo cáo" fr="FR-33, FR-34" /> },
      { path: 'audit', element: <Placeholder code="A04" title="Nhật ký" fr="FR-31" /> },
    ],
  },
])
