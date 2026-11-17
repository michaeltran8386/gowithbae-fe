# 06 — Requirement Coverage (PHASE 6)

**Ngày:** 16-11-2026 · **Bản kiểm tra:** nhánh `feat/f1-frontend` · **Môi trường:** dữ liệu minh họa (MSW). Backend thật mới có `GET /places`, nên **mọi PASS dưới đây là PASS phía frontend**. Phần kiểm tra quyền, đồng thời và lưu trữ ở server phải nghiệm thu lại khi backend xong.

Phân loại:
- **PASS:** có màn hình, tương tác, đúng luồng và có bằng chứng kiểm thử đã chạy.
- **PASS\*:** PASS phía FE, còn phần phụ thuộc server/contract (ghi rõ).
- **BLOCKED:** không làm được đúng do thiếu contract/quyết định. **Không** tính là PASS.
- **N/A:** ngoài phạm vi đợt này theo quyết định đã duyệt (A-02: F2 quản trị làm sau), hoặc không có UI.
- **FAIL:** đã làm nhưng sai. *(Không có ở lần kiểm tra này.)*

Mã test: **F** = `src/test/flows.test.tsx`, **A** = `src/test/acceptance.test.tsx`, **X** = `src/test/a11y.test.tsx` (axe), **L** = `src/lib/lib.test.ts`, **B** = kiểm tra trong trình duyệt (dev:mock).

## 1. Functional requirements

| Req | Screen | Component | Interaction | Business flow | Role/permission (FE) | Test | Kết quả | Ghi chú |
|---|---|---|---|---|---|---|---|---|
| FR-01 Khám phá | S-01, S-02 | ✔ | ✔ | ✔ | Công khai | A: AC-041/042 · X · B | **PASS** | Ảnh bộ sưu tập: không có ảnh có quyền → khung giữ chỗ |
| FR-02 Tìm kiếm | S-03 | ✔ | ✔ submit, không gửi theo ký tự | ✔ | Công khai | A: AC-001 · X | **PASS\*** | Mức khớp/tìm rỗng chờ OQ-04 (server) |
| FR-03 Bộ lọc | S-03 | ✔ | ✔ URL state, sheet bản nháp | ✔ AND/OR hiển thị cạnh nhóm | Công khai | A: AC-001, 0 kết quả giữ điều kiện | **PASS\*** | Backend thật trả 501 cho nhãn/giờ/vị trí; ranh giới giá PROP OQ-03 |
| FR-04 Sắp xếp & bản đồ | S-03 | ✔ | ✔ | ✔ “Gần tôi” làm tròn ~1 km, từ chối vị trí | Công khai | A: AC-002 | **PASS\*** | Bản đồ là khung chờ (D-06, OQ-05); danh sách đầy đủ |
| FR-05 Chi tiết | S-04 | ✔ | ✔ | ✔ thứ tự FR-05 | Công khai; hành động cá nhân → login | F: AC-003, AC-004 · X · B 360 px | **PASS** | Không sao/đánh giá; null = “Chưa có thông tin” |
| FR-06 So sánh | S-05 | ✔ | ✔ khay ≤3, localStorage | ✔ | Công khai | F: AC-005 · A: AC-006 · X | **PASS** | Đã sửa lỗi serialize `ids` theo contract (explode=false) |
| FR-07 Đăng nhập | S-06 | ✔ | ✔ 2 bước, đếm ngược | ✔ returnTo + intent, chặn open redirect | — | A: AC-007/008, open redirect · F: route guard · X | **PASS\*** | Phương thức OTP là PROP (OQ-06) |
| FR-08 Hồ sơ | S-16 | ✔ | ✔ | ✔ | Chính chủ | A: AC-009 · X | **PASS\*** | AC-010 (thu hồi phiên/link khi xóa) là server; ảnh đại diện chờ OQ-21 |
| FR-09 Đã lưu | S-07, S-08 | ✔ | ✔ | ✔ | Chính chủ | A: AC-011, AC-012, AC-056 · X | **PASS** | |
| FR-10 Tạo lời mời | S-09 | ✔ | ✔ | ✔ link một lần, cảnh báo rời trang | Thành viên | A: AC-013/014 | **PASS** | Hạn 7 ngày là PROP |
| FR-11 Tham gia (CR-001) | S-10 | ✔ | ✔ | ✔ không cần đăng nhập, phiên khách | Khách | F: AC-055, AC-016 · A: AC-015 (suất đã có người) · X | **PASS\*** | Xem các nơi **trước** khi tham gia chờ CCR-03; tranh suất đồng thời thật phải test ở server |
| FR-12 Bỏ phiếu | S-11 | ✔ | ✔ lạc quan + hoàn tác | ✔ Chưa trả lời ≠ Bỏ qua | Chủ tạo / người nhận | F: AC-017 · A: AC-018 · X | **PASS\*** | Ẩn phiếu người kia: mặc định OQ-07 |
| FR-13 Chốt | S-12 | ✔ | ✔ | ✔ chỉ chủ tạo, chọn bất kỳ | Chủ tạo | A: AC-019, AC-020 | **PASS\*** | Điều kiện chốt PROP OQ-08 |
| FR-14 Chia sẻ | S-11 | ✔ | ✔ xác nhận | ✔ | Chủ tạo | A: thu hồi (AC-021 phía FE) | **PASS\*** | AC-021/022 (chặn phiên cũ, người ngoài) là server |
| FR-15 Tạo kế hoạch | S-14 | ✔ | ✔ | ✔ giờ đóng chặn, giờ chưa rõ cảnh báo | Thành viên | F: AC-024 · A: AC-023 | **PASS** | |
| FR-16 Quản lý kế hoạch | S-13, S-15 | ✔ | ✔ | ✔ | Chủ sửa/hủy; người nhận chỉ xem | A: AC-025 (FE), hủy | **PASS\*** | Đổi địa điểm trong màn sửa: chưa làm (lên kế hoạch lại); AC-026 → N/A ở UI |
| FR-17 Tiện ích | S-15 | ✔ | ✔ | ✔ .ics qua client có xác thực | Chủ / người nhận | A: FR-17 | **PASS\*** | Cơ chế .ics là PROP (OQ-12) |
| FR-18 Lời nhắc “Đi chưa?” (CR-001) | S-01, S-13, S-15 | ✔ | ✔ | ✔ 2 nút, không popup, không ghi “Không” | Chủ kế hoạch (OQ-10 mặc định) | F: AC-057/058, AC-027/028, Đã đi · X | **PASS\* / BLOCKED (server)** | Bỏ qua chỉ nhớ trên **thiết bị hiện tại** cho đến khi có API (CCR-02) |
| FR-19 Báo sai | S-04 dialog | ✔ | ✔ | ✔ | Khách | A: AC-029/030 | **PASS\*** | Ảnh đính kèm chờ OQ-21; chống lạm dụng ở server |
| FR-20 Hỗ trợ | S-18…S-20 | ✔ | ✔ | ✔ | Chính chủ | A: AC-031, AC-032 · X | **PASS\*** | Trả lời ticket đã đóng chờ OQ-13; tệp chờ OQ-21 |
| FR-21 Thông báo | S-17, chuông | ✔ | ✔ link thật | ✔ | Thành viên | A: FR-21 | **PASS\*** | AC-033 (link cũ bị thu hồi) là server; AC-034 server |
| FR-22 Quyền riêng tư | Mọi màn | ✔ | — | ✔ 404 không lộ tồn tại, xóa cache khi đăng xuất/401, noindex link mời | — | F: AC-004, AC-016 · A: AC-032 | **PASS\*** | Kiểm soát thật ở server (NFR-04) |
| FR-23…FR-31 Quản trị | — | — | — | — | — | — | **N/A** | F2, chưa lên lịch (A-02; chờ OQ-15/18/19/20). Route `/admin` hiện màn “chưa xây dựng”, chặn người không có vai trò nhân sự |
| FR-32 Sự kiện | — (không UI) | `lib/analytics.ts` | — | ✔ phát tại điểm thành công, whitelist | — | Đọc code | **PASS\*** | Chưa kiểm chứng tiếp nhận ở server (OQ-20); `date_reminder_dismissed` chờ CCR-04 |
| FR-33, FR-34 Báo cáo/CSV | — | — | — | — | — | — | **N/A** | F2 |
| FR-35 Số lần đã đi (CR-001) | S-04, S-15 | — | — | — | — | — | **BLOCKED** | Contract chưa có trường (CCR-01). S-15 hiện “Bạn đã xác nhận đã đi buổi hẹn này” từ `visitAnswer` |

**Tổng F1 (FR-01…FR-22, FR-32, FR-35 = 24 mục):** PASS 5 · PASS\* 17 · PASS\*/BLOCKED 1 (FR-18) · BLOCKED 1 (FR-35) · FAIL 0. F2 (FR-23…31, 33, 34 = 11 mục): N/A.

## 2. CR-001 (đã CONF)

| Quyết định | Kết quả | Bằng chứng |
|---|---|---|
| DEC-01 Số lần đã đi | **BLOCKED** | CCR-01 |
| DEC-02 Bỏ qua lời nhắc chỉ đóng, không popup | **PASS\*** (thiết bị hiện tại) | F: AC-057/058 |
| DEC-03 Xem link không đăng nhập | **PASS\*** (xem trước danh sách nơi chờ CCR-03) | F: AC-055, AC-016 · A: AC-015, AC-056 |

## 3. Non-functional (phần FE)

| NFR | Kết quả | Bằng chứng |
|---|---|---|
| NFR-01 Hiệu năng tìm kiếm | **N/A (FE)** | Do server; FE tránh waterfall, chỉ gửi khi submit |
| NFR-02 Responsive 360 → desktop | **PASS** | Sweep 22 màn × 360/768/1280: không cuộn ngang sau khi sửa `/plans/new`; ảnh chụp 360 px S-04/S-11/S-15 |
| NFR-02 Trình duyệt | **BLOCKED** | Mới kiểm tra Chromium (trình duyệt tích hợp + jsdom); Safari/Edge thật chưa chạy |
| NFR-03 Truy cập | **PASS\*** | axe 14 màn: 0 vi phạm (đã sửa landmark trùng, `dl` sai cấu trúc, thứ tự heading); tương phản đã tính (04); chưa kiểm tra trình đọc màn hình thật |
| NFR-04 Quyền server | **N/A (FE)** | FE không dựa vào ẩn nút; cần test server |
| NFR-05 Không lộ token | **PASS\*** | Không đưa token/OTP vào analytics/URL; token ở localStorage là shortcut (OQ-06) |
| NFR-06 Rate limit | **PASS\*** | 429 + Retry-After hiển thị (L); tham số ở server |
| NFR-07 Vị trí | **PASS** | Chỉ lấy khi bấm, một lần, làm tròn (A: AC-002) |
| NFR-08 Không tạo trùng | **PASS\*** | Nút khóa khi gửi; Idempotency-Key cho tạo phiên/kế hoạch/chốt; PUT lưu idempotent (A: AC-011). Test đồng thời thật cần server |
| NFR-11 Mã truy vết lỗi | **PASS** | ErrorState hiện `traceId` |
| NFR-12 Dữ liệu minh họa có nhãn | **PASS** | Dải “Dữ liệu minh họa”; build không chứa MSW (grep `dist/`) |
| NFR-09, NFR-10 | **N/A** | Báo cáo (F2), sao lưu (hạ tầng) |

## 4. AC cấp UC trong phạm vi F1 (UC-001…UC-017, UC-027)

| Kết quả | AC |
|---|---|
| Có test tự động và pass (35) | AC-001, 002, 003, 004, 005, 006, 007, 008, 009, 011, 012, 013, 014, 015\*, 016, 017, 018, 019, 020, 021\*, 023, 024, 025\*, 027, 028, 029, 030\*, 031, 032, 041, 042, 055, 056, 057, 058 *(\* = chỉ phần FE)* |
| Cần server để nghiệm thu | AC-010, AC-022, AC-033, AC-034, tranh suất đồng thời thật của AC-015 |
| N/A ở UI | AC-026 (màn sửa chưa cho đổi địa điểm) |
| BLOCKED | AC-053, AC-054 (CCR-01) |
| F2 (N/A đợt này) | AC-035…AC-052 |
