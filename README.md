# gowithbae-fe

Frontend GoWithBae G1: React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · openapi-fetch · TanStack Query.

**Luồng chức năng và hướng dẫn dùng (đọc đầu tiên):** [docs/FLOWS.md](docs/FLOWS.md)

**Yêu cầu sản phẩm:** [SRS hợp nhất G1](docs/SRS.md) — cùng nội dung với bản trong repo backend.

**Hướng dẫn làm việc:** [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) · **Tech stack:** [TECHSTACK.md](TECHSTACK.md) · **Phân tích, kiến trúc, UX/UI:** [docs/frontend/](docs/frontend/README.md)

## Chạy

```bash
npm install
npm run dev:mock   # dữ liệu minh họa (MSW), không cần backend — mã đăng nhập thử 123456
npm run dev        # gọi backend thật: /api được proxy tới http://localhost:8080
```

Chạy cả hệ thống bằng Docker (web ở http://localhost:8081): xem `gowithbae-be/docs/DEVELOPMENT.md` §9–10.

| Lệnh | Việc |
|---|---|
| `npm test` | Vitest + Testing Library, dữ liệu qua MSW |
| `npm run build` | Kiểm tra type + build production (không chứa dữ liệu minh họa) |
| `npm run lint` | oxlint |
| `npm run gen:api` | Sinh lại `src/api/schema.d.ts` từ `../gowithbae-be/api/openapi.yaml` |

## Tình trạng (16-11-2026)

**Tóm tắt:** web khách G1 (F1) đã xong phía frontend và nghiệm thu trên dữ liệu minh họa. **Chưa production-ready**: chờ backend implement API và bổ sung contract.

### Tiến độ theo giai đoạn

| Giai đoạn | Nội dung | Trạng thái |
|---|---|---|
| Phase 0–1 | Đọc nguồn, phân tích yêu cầu, câu hỏi làm rõ | ✅ Xong (Gate 1 đã duyệt) |
| Phase 2 | Kiến trúc frontend, kế hoạch triển khai | ✅ Xong |
| Phase 3–4 | UX (luồng, màn hình), design system, chọn hướng UI B+ | ✅ Xong (Gate 2 đã duyệt) |
| Phase 5 | Triển khai F1, dựa trên bản Stitch đã chỉnh lại | ✅ Xong |
| Phase 6 | QA, accessibility, responsive, đối chiếu yêu cầu | ✅ Xong, chờ Gate 3 |
| F2 Quản trị | Trang `/admin` cho chủ dự án (SUPER_ADMIN) | ✅ Xong trên nhánh `feature/admin-ui`, xem mục Trang quản trị |

### Phạm vi đã có

| Nhóm | Màn |
|---|---|
| Khám phá | S-01 Khám phá, S-02 Bộ sưu tập, S-03 Kết quả (bộ lọc, sắp xếp, “Gần tôi”), S-04 Chi tiết + báo sai, S-05 So sánh |
| Tài khoản | S-06 Đăng nhập OTP, S-16 Tài khoản, S-17 Thông báo, S-18/19/20 Hỗ trợ |
| Lưu & cùng chọn | S-07/08 Đã lưu, S-09 Tạo lời mời, S-10 Link mời cho khách (không cần đăng nhập), S-11 Bỏ phiếu, S-12 Kết quả + chốt |
| Buổi hẹn | S-13 Buổi hẹn, S-14 Tạo kế hoạch, S-15 Chi tiết (.ics, chỉ đường, sửa/hủy), lời nhắc “Đi chưa?” |

### Trang quản trị

Chỉ tài khoản `SUPER_ADMIN` vào được. Đăng nhập 2 bước: OTP email, sau đó mã Google Authenticator. Admin cài Authenticator qua link kích hoạt dùng 1 lần (`/admin/activate/:token`). Admin đầu tiên tạo bằng lệnh bootstrap của backend, xem `gowithbae-be/docs/DEVELOPMENT.md` §10.

| Nhóm | Màn |
|---|---|
| Tổng quan | `/admin`: số liệu, xuất CSV, việc cần xử lý |
| Người dùng | `/admin/users`, `/admin/users/:id`: tạo, khóa/mở, vai trò, phiên đăng nhập, hoạt động |
| Địa điểm | `/admin/places`, `/admin/places/:id`, `/admin/imports`: sửa, ảnh, duyệt, nhập CSV |
| Danh mục | `/admin/taxonomies`, `/admin/collections` |
| Nội dung web | `/admin/content`, `/admin/notifications` |
| Hỗ trợ | `/admin/place-reports`, `/admin/tickets` |
| Hệ thống | `/admin/audit` |

Phía người dùng thêm `/faq`, `/terms`, `/privacy`, `/contact`; tiêu đề trang chủ, banner và chân trang lấy từ “Nội dung web”.

Thử trên dữ liệu minh họa (`npm run dev:mock`): đăng nhập `admin@gowithbae.test`, mã OTP `123456`, mã Authenticator `654321`.

### Mobile

| Hạng mục | Trạng thái |
|---|---|
| Web responsive trên điện thoại (từ 360 px) | ✅ Đã làm: thiết kế mobile-first, thanh điều hướng dưới, bộ lọc dạng sheet, thanh hành động cố định, vùng chạm ≥ 44 px, input 16 px (Safari không zoom) |
| Kiểm tra tự động | ✅ 22 màn × 360 / 768 / 1280 px, không có cuộn ngang |
| Thử trên máy thật (Safari iOS, Chrome Android) | ⏳ Chưa làm, mới kiểm tra trên Chromium |
| App native iOS/Android | ❌ Ngoài phạm vi: thuộc G2 theo SRS §2.2 |

### Chất lượng

| Kiểm tra | Kết quả |
|---|---|
| Test | 57/57 pass (7 unit, 36 luồng theo AC, 14 axe) |
| Accessibility (axe-core) | 14 màn, 0 vi phạm |
| Typecheck / build / lint | Pass / pass / 0 lỗi |
| Đối chiếu yêu cầu F1 (24 mục) | PASS 5 · PASS\* 17 · PASS\*/BLOCKED 1 · BLOCKED 1 · FAIL 0 |

PASS\* nghĩa là frontend đã xong, còn phần kiểm tra quyền hoặc lưu trữ ở server chờ backend.

### Đang chờ

- **Backend:** mới có `GET /places` (một phần). Các màn còn lại chạy bằng `npm run dev:mock`.
- **Contract (team backend):**
  - CCR-01: số lần đã đi. Hiện FR-35 bị BLOCKED.
  - CCR-02: lưu “Bỏ qua lời nhắc” ở server. Hiện chỉ nhớ trên thiết bị đang dùng.
  - CCR-03: người nhận xem các nơi trước khi tham gia.
  - CCR-04, CCR-05: sự kiện `date_reminder_dismissed`, danh sách mã lỗi.
  - Chi tiết: [02-frontend-architecture.md](docs/frontend/02-frontend-architecture.md) §3.
- **PO:** chốt các mặc định đang dùng (OQ-03/06/07/08/10/12/21).
- **Chưa làm:** tải ảnh/tệp, bản đồ thật, đổi địa điểm trong màn sửa kế hoạch.

Báo cáo: [QA](docs/frontend/06-qa-report.md) · [Đối chiếu yêu cầu](docs/frontend/06-requirement-coverage.md) · [Bàn giao + kế hoạch tiếp](docs/frontend/06-final-handover.md) · [Nhật ký triển khai](docs/frontend/05-implementation-log.md)
