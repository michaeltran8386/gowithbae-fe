# 06 — QA Report (PHASE 6)

**Ngày:** 16-11-2026 · **Vai trò:** Senior QA + Frontend Reviewer · **Skill:** `web-design-guidelines` (bộ Web Interface Guidelines tải 16-11), `vercel-react-best-practices`
**Bản kiểm tra:** `feat/f1-frontend` · **Dữ liệu:** minh họa qua MSW (`npm run dev:mock`, test dùng chung handler)

## 1. Lệnh đã chạy và kết quả

| Kiểm tra | Lệnh / cách | Kết quả |
|---|---|---|
| Type | `npx tsc -b` | **Pass**, 0 lỗi |
| Unit + luồng + a11y | `npm test` (Vitest 5, jsdom, MSW) | **57/57 pass**, 4 file. Chạy lặp 3 lần liên tiếp đều pass sau khi tăng `asyncUtilTimeout` lên 3 s (trước đó 1 lần chập chờn khi máy bận) |
| Lint | `npm run lint` (oxlint) | **0 lỗi**, 31 cảnh báo `react(only-export-components)` (chỉ ảnh hưởng fast refresh khi dev) |
| Build | `npm run build` | **Pass**. Bundle không chứa MSW/dữ liệu minh họa (grep `dist/assets`) |
| Accessibility tự động | axe-core 4.14 trên 14 màn (khách + thành viên) | **0 vi phạm** sau khi sửa (xem §3). `color-contrast` tắt trong jsdom; tương phản đã tính tay ở Phase 4 |
| Responsive | Script đo trong trình duyệt tích hợp: 22 màn × 360/768/1280 px (66 lượt) | **0 màn cuộn ngang** sau khi sửa `/plans/new` (366 → 360 px). Ảnh chụp 360 px: S-04, S-11, S-15; 1280 px: S-01 |

**Test thực sự đã chạy:** toàn bộ ở trên.
**Không chạy được:** backend thật (đa số endpoint 501), Safari/Edge thật, trình đọc màn hình thật, đo Core Web Vitals, e2e trên trình duyệt thật (pane trình duyệt tích hợp không nhận click khi bị ẩn; luồng click được phủ bằng Testing Library).
**Lỗi có từ trước:** `SearchPage` gốc gọi API theo từng phím (đã sửa ở Phase 5). Không có lỗi build/lint có sẵn.

## 2. Functional testing

| Nhóm | Đã kiểm tra | Bằng chứng |
|---|---|---|
| Navigation | 4 mục chính, bottom nav ẩn ở màn có action bar, 404, route cần đăng nhập → login + returnTo | F: route guard; X |
| Forms & validation | Lỗi dưới trường (tên hiển thị, mã OTP, ngày giờ, chủ đề/nội dung hỗ trợ, lý do báo sai), giữ dữ liệu khi lỗi | A, F |
| Filtering / sorting / pagination | AND/OR, 0 kết quả giữ điều kiện, bỏ từng chip, sắp xếp, phân trang qua URL | A: AC-001, 0 kết quả |
| Dialogs | Lưu vào danh sách, xóa danh sách, hủy kế hoạch, thu hồi link, báo sai, đổi email; Esc/đóng | A |
| Error handling | 404/410/409 SLOT_TAKEN/500 khi chốt; mã tra cứu | F: AC-004, AC-016 · A: AC-015, AC-020 |
| Auth UI | OTP sai/đúng, returnTo, chặn open redirect, intent=save | A |
| API integration | Mọi lời gọi qua client có kiểu; MSW theo contract; **phát hiện và sửa** lệch serialize `ids` của `/places/compare` | A: AC-006 |
| States | Loading (skeleton), empty, error + thử lại ở mọi màn có dữ liệu | Đọc code + X |

## 3. Lỗi phát hiện trong Phase 6 và đã sửa

| # | Lỗi | Mức | Phát hiện bởi | Sửa |
|---|---|---|---|---|
| Q-01 | `/places/compare` gửi `ids=a&ids=b`, contract yêu cầu `ids=a,b` (explode=false) → trang So sánh sẽ lỗi với backend đúng contract | **Cao** | Test AC-006 | `querySerializer` theo contract trong `useComparePlaces` |
| Q-02 | Hai `nav` cùng tên “Điều hướng chính” | Trung bình | axe `landmark-unique` | Thanh dưới đổi tên “Thanh điều hướng” |
| Q-03 | `dl` dải thông tin: `dt/dd` bị bọc thêm `div` | Trung bình | axe `definition-list` | Cấu trúc lại `Fact` |
| Q-04 | Tiêu đề thẻ `h3` ngay sau `h1` (Đã lưu, Bộ sưu tập, Bỏ phiếu); trang chủ có `h2` trước `h1` | Thấp | axe `heading-order` | Thêm `h2` (ẩn) và `h1` ẩn cho trang chủ |
| Q-05 | `/plans/new` tràn 6 px ở 360 px (ô ngày có độ rộng tối thiểu) | Trung bình | Sweep responsive | `min-w-0` cho ô ngày (cả bộ lọc ngày) |
| Q-06 | Vùng chạm nhỏ: logo, link “quay lại”, breadcrumb | Thấp | Sweep (hit area < 36 px) | `min-h-11` / `py-1` |
| Q-07 | Thông báo và “Về Khám phá” dùng `button` + `navigate()` → không mở tab mới được | Thấp | Rà guideline | Đổi sang `Link` |
| Q-08 | `div` có `onClick`/`onCopy` để theo dõi sao chép link | Thấp | Rà guideline | Callback `onShared` của `ShareLinkPanel` |
| Q-09 | Thiếu `theme-color`, `description` | Thấp | Rà guideline | Thêm vào `index.html` |
| Q-10 | Test chập chờn do timeout 1 s | Thấp | Chạy lặp | `asyncUtilTimeout: 3000` |

## 4. UX/UI findings còn lại (không chặn)

| # | Nhận xét | Đề xuất |
|---|---|---|
| U-01 | Bộ sưu tập/ảnh đều là khung giữ chỗ vì chưa có ảnh có quyền | Cần ảnh thật từ đội nội dung (RULE-28) |
| U-02 | Form kế hoạch/hỗ trợ chưa cảnh báo khi rời trang có dữ liệu chưa lưu (guideline) | Thêm `useBlocker` như S-09 |
| U-03 | Trang lỗi/không tìm thấy dạng `ErrorState` không có `h1` | Cho `ErrorState` nhận cấp heading như `EmptyState` |
| U-04 | Màn sửa kế hoạch chưa đổi được địa điểm | Bổ sung chọn nơi từ danh sách đã lưu |
| U-05 | Logo là chữ tạm | Logo vector chính thức (OQ-01) |

## 5. Performance findings (đo từ `vite build`, không phải benchmark thực địa)

| Hạng mục | Kết quả |
|---|---|
| Tách mã | Mỗi màn một chunk; màn lớn nhất `SearchPage` 14,9 kB (gzip 5,4 kB) |
| Tải ban đầu | `index` 240 kB (gzip 76 kB, React + Router) + chunk dùng chung 113 kB (gzip 38 kB, TanStack Query + icon) + CSS 37 kB (gzip 8 kB) |
| So với khung ban đầu | Tăng khoảng 22 kB gzip JS ban đầu do TanStack Query/Lucide; đổi lại cache, chống trùng request và tách 21 màn |
| Request | Không waterfall ở chi tiết địa điểm (place + danh sách đã lưu chạy song song); tìm kiếm chỉ gửi khi submit; danh mục cache 10 phút |
| Rendering | Không `memo` tùy tiện; bộ lọc nháp ở mobile không re-render danh sách |
| Chưa đo | LCP/CLS/INP thực tế, tốc độ trên mạng chậm |
| Nhỏ | `public/mockServiceWorker.js` vẫn được copy vào `dist` (không được đăng ký nếu không bật mock) |

## 6. Kết luận

F1 web khách **đạt ở mức frontend trên dữ liệu minh họa**: 0 FAIL, 57/57 test, 0 vi phạm axe, không cuộn ngang ở 3 độ rộng.
**Chưa production-ready:** còn BLOCKED FR-35 và phần server của FR-18/FR-11 (CCR-01/02/03), backend chưa implement, chưa test trình duyệt Safari/Edge, OTP/phiên/retention là PROP (OQ-06/17).
