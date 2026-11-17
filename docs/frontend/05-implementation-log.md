# 05 — Implementation Log (PHASE 5)

**Ngày:** 16-11-2026 · **Nhánh:** `feat/f1-frontend` (tách từ `docs/frontend-phase-0-4`, gốc `dev`) · **Phạm vi:** F1 web khách (A-02)
**Gate 2:** người yêu cầu gửi bản Stitch và yêu cầu làm Phase 5. Hướng được áp dụng: B+ (Phase 4), Stitch làm tham chiếu visual sau khi audit ([05-stitch-audit.md](05-stitch-audit.md)). D-01 đến D-07 đã duyệt.
**Skill áp dụng:** `frontend-design` (visual), `vercel-composition-patterns` (compound component, variant tường minh, provider state/actions/meta, React 19 `use()`), `vercel-react-best-practices` (lazy route, tránh waterfall, không memo tùy tiện).

## 1. Milestone đã làm

| Milestone | Nội dung | Task |
|---|---|---|
| M0 Foundations | Deps D-02/03/04/07; cấu trúc `app/ hooks/ lib/ mocks/ test/`; router lazy theo màn + error/404; `api/problem.ts`; middleware 401; Idempotency-Key; `AuthProvider` + `RequireAuth` + `returnTo`/intent; khay so sánh; `format`/`hours`; analytics `track()` theo lô + whitelist; MSW (dev + test) với dữ liệu minh họa đúng kiểu contract; Vitest | T-001…T-009 |
| M1 Shell & UI | Token B+ trong `index.css` (thay token tạm không có nguồn); AppLayout (nav 4 mục, chuông + badge, skip link, dải dữ liệu minh họa, bottom nav ẩn ở màn có action bar); MinimalLayout; AdminLayout có chặn vai trò (UX); Button (5 variant), IconButton, Field compound, Dialog/ConfirmDialog native, StateView (Loading/Empty/Error có mã tra cứu), Badge, Toast, Heart, Logo | T-101…T-105 |
| M2 Discovery | S-01 (khu “Tiếp tục” + tìm + hoạt động + bộ sưu tập), S-02, S-03 (bộ lọc chung desktop/mobile, bản nháp ở mobile, URL state, sắp xếp, “Gần tôi” làm tròn ~1 km, chip điều kiện, phân trang, khung bản đồ), S-04 (thứ tự FR-05, dải 3 thông tin, bảng giờ, action bar, báo sai), S-05 (bảng desktop / thẻ mobile chung nguồn hàng) | T-201…T-206 |
| M3 Account & Saved | S-06 OTP 2 bước + đếm ngược + chống open redirect; S-16 hồ sơ, đổi email 2 bước, xóa tài khoản (gõ xác nhận), đăng xuất xóa cache; SaveButton + SaveToListDialog (gợi ý cùng chọn UX-15); S-07/S-08 (hoàn tác khi bỏ nơi, cảnh báo nơi ẩn) | T-301…T-304 |
| M4 Choice | S-09 chọn 2–5 nơi + link một lần + cảnh báo khi rời trang; S-10 link mời không cần đăng nhập (noindex); S-11 bỏ phiếu lạc quan + quản lý chia sẻ; S-12 kết quả + chốt (chỉ chủ tạo, chọn nơi bất kỳ) | T-401…T-405 |
| M5 Plans | PlanForm dùng chung (giờ VN, cảnh báo giờ chưa rõ, lỗi giờ đóng tại ô); S-13 tab trên URL + phiên đang chọn; S-14; S-15 đầu trang dạng vé, người nhận chỉ xem, chỉ đường, tải .ics qua client có xác thực, hủy có xác nhận; sửa kế hoạch; lời nhắc “Đi chưa?” dạng vé inline | T-501…T-505 |
| M6 Support & Notif | S-17 thông báo (chưa đọc, mở đối tượng kiểm tra quyền lại); S-18/19/20 hỗ trợ (chỉ tin công khai, ticket đóng → gửi yêu cầu mới) | T-601, T-602 |

## 2. Requirement đã đáp ứng (mức frontend, trên dữ liệu minh họa)

FR-01…FR-17, FR-19…FR-22 có màn hình và tương tác. FR-18 có lời nhắc đúng hành vi CR-001; “Bỏ qua lời nhắc” tạm lưu trên thiết bị (xem §4). FR-32 phát sự kiện tại điểm thành công.
Câu chữ bắt buộc SRS: “Kế hoạch này chưa giữ chỗ tại địa điểm”, “Bạn chỉ có thể so sánh tối đa 3 địa điểm”, “Hãy chọn từ 2 đến 5 địa điểm”, “Liên kết không còn hiệu lực”, “Địa điểm đóng cửa vào thời gian bạn chọn”, “Chưa có thông tin”. Không hiển thị sao/đánh giá; khoảng cách luôn ghi “ước tính”.

## 3. Kiểm tra đã chạy (16-11-2026)

| Lệnh | Kết quả |
|---|---|
| `npx tsc -b` | Pass, 0 lỗi |
| `npm test` (Vitest 5) | **18/18 pass**: 7 unit (format, hours, problem) + 11 luồng theo AC: AC-057/058 (bỏ qua lời nhắc, tải lại không hiện, không popup, không đổi visitAnswer/lịch), Đã đi, AC-027/028, AC-055 (khách tham gia bằng tên, không bị đưa sang đăng nhập), AC-016, AC-017, AC-003, AC-004, AC-005, AC-024, bảo vệ route |
| `npm run lint` (oxlint) | 0 lỗi, 31 cảnh báo `react(only-export-components)` (chỉ ảnh hưởng fast refresh khi dev; do compound component và hook đặt chung file) |
| `npm run build` | Pass. Mỗi màn một chunk; chunk lớn nhất ban đầu: `index` 240 kB (gzip 76 kB), `StateView` (chung: TanStack Query + icon) 113 kB (gzip 38 kB). Bundle **không chứa** MSW/dữ liệu minh họa (đã grep `dist/`) |
| Trình duyệt (dev:mock) | Đã xem S-01 desktop 1280; S-04, S-11, S-15 ở 360 px: `scrollWidth = 360` (không cuộn ngang). Đã sửa sau khi xem: nút “Lên kế hoạch” xuống dòng, dải thông tin chiếm chiều cao, định dạng ngày giờ, thông báo lỗi tải trang báo nhầm “mất kết nối” |

**Chưa chạy:** test với backend thật (backend còn 501), Playwright/e2e, đo hiệu năng, audit tương phản bằng công cụ, test Safari/Edge thật, thao tác click trong trình duyệt tích hợp (pane không render khi ở nền; luồng click đã được test tự động phủ).

## 4. Blocker và giới hạn còn lại

| Vấn đề | Ảnh hưởng | Xử lý tạm | Ai gỡ |
|---|---|---|---|
| CCR-01: contract chưa có số lần đã đi | “Đã đi X lần” (FR-35) chưa hiển thị | Comment đánh dấu tại S-04/S-15; S-15 hiện “Bạn đã xác nhận đã đi buổi hẹn này” từ `visitAnswer` | Backend |
| CCR-02: chưa có API lời nhắc/dismiss | “Bỏ qua lời nhắc” chỉ nhớ trên thiết bị hiện tại (localStorage, `shortcut: CCR-02` trong `hooks/plans.ts`) | Đúng hành vi trên cùng thiết bị; không gửi `NO` | Backend |
| CCR-03: preview link mời không có danh sách nơi | Người nhận chỉ thấy người mời + số lựa chọn trước khi tham gia | Hiển thị đủ sau khi tham gia | Backend |
| Phiên người nhận | Contract không trả `sessionId` ở preview → không tự vào thẳng phiên nếu đã tham gia trước đó trên cùng máy | Mở lại bằng URL phiên `/choice/:id` | Backend (tùy chọn) |
| OQ-07/08/10 | Phiếu người kia ẩn; chốt chỉ sau khi người nhận tham gia; lời nhắc chỉ cho chủ kế hoạch | Mặc định có nhãn PROP trong code/mock | PO |
| OQ-21 | Chưa có tải ảnh (avatar, ảnh báo sai, tệp hỗ trợ) | Chưa làm | PO + backend |
| Đổi địa điểm của kế hoạch | Màn sửa chỉ đổi giờ/ghi chú | Lên kế hoạch lại ở nơi mới | Có thể làm khi cần |
| Bản đồ | `view=map` là khung chờ | Danh sách đầy đủ | OQ-05 |
| `public/mockServiceWorker.js` | Được copy vào `dist` (không đăng ký nếu không bật mock; vô hại) | Có thể tách thư mục public riêng cho mock | FE (nhỏ) |
| Token ở localStorage | Rủi ro nếu dính XSS | Không dùng `dangerouslySetInnerHTML`; đề xuất cookie HttpOnly khi chốt OQ-06 | Backend + PO |

## 5. Bước tiếp theo

Phase 6 (QA): audit đầy đủ theo `web-design-guidelines`, kiểm tra tương phản bằng công cụ, responsive 768/1024, bàn phím từng màn, bổ sung test cho các AC còn lại, và chạy với backend thật khi các endpoint được implement.
