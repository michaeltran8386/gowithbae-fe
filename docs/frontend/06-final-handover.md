# 06 — Final Handover (PHASE 6, APPROVAL GATE 3)

**Ngày:** 16-11-2026 · **Repo:** `gowithbae-fe` · **Nhánh:** `feat/f1-frontend` (chưa push) · **Phạm vi đã duyệt:** F1 web khách G1 (A-02)

## 1. Delivered features

21 màn web khách theo SRS v1.1 + CR-001, trên giao diện hướng B+:

| Nhóm | Màn |
|---|---|
| Khám phá | S-01 Khám phá (khu “Tiếp tục”, tìm, hoạt động, bộ sưu tập), S-02 Bộ sưu tập, S-03 Kết quả (bộ lọc trên URL, sheet mobile, sắp xếp, “Gần tôi”, phân trang), S-04 Chi tiết (báo sai), S-05 So sánh |
| Tài khoản | S-06 Đăng nhập OTP, S-16 Tài khoản (hồ sơ, đổi email, xóa, đăng xuất), S-17 Thông báo, S-18/19/20 Hỗ trợ |
| Lưu & cùng chọn | S-07/S-08 Đã lưu, S-09 Tạo lời mời, S-10 Link mời cho khách (không cần đăng nhập), S-11 Bỏ phiếu + chia sẻ, S-12 Kết quả + chốt |
| Buổi hẹn | S-13 Buổi hẹn, S-14 Tạo kế hoạch, S-15 Chi tiết (vé hẹn, chỉ đường, .ics, sửa/hủy), lời nhắc “Đi chưa?” |
| Nền tảng | Router lazy theo màn, xử lý lỗi Problem, Idempotency-Key, auth + intent, analytics, design token, bộ component UI, MSW dữ liệu minh họa, 57 test |

## 2. Requirement coverage (tóm tắt — chi tiết ở [06-requirement-coverage.md](06-requirement-coverage.md))

| | Số mục |
|---|---|
| PASS | 5 |
| PASS\* (FE xong, còn phần server/contract) | 17 |
| PASS\* / BLOCKED (FR-18: bỏ qua lời nhắc chưa lưu ở server) | 1 |
| BLOCKED (FR-35 số lần đã đi) | 1 |
| FAIL | 0 |
| N/A (F2 quản trị, chưa lên lịch) | 11 |

## 3. Test

57/57 pass (7 unit, 36 luồng/AC, 14 axe). Typecheck và build pass; lint 0 lỗi. Chi tiết và danh sách 10 lỗi đã sửa trong Phase 6: [06-qa-report.md](06-qa-report.md).

## 4. Known limitations

1. **Backend:** mới có `GET /places` (một phần). Toàn bộ trải nghiệm hiện chạy bằng `npm run dev:mock`.
2. **Contract thiếu so với SRS v1.1** (team backend sửa, D-05):
   - CCR-01 `myVisitCount` → FR-35 BLOCKED.
   - CCR-02 API lời nhắc/dismiss → “Bỏ qua lời nhắc” chỉ nhớ trên thiết bị (`shortcut: CCR-02` trong `src/hooks/plans.ts`).
   - CCR-03 danh sách nơi trong preview link mời.
   - CCR-04 sự kiện `date_reminder_dismissed`.
   - CCR-05 cập nhật nguồn SRS + danh sách `Problem.code`.
3. **PROP/OQ đang dùng mặc định có nhãn:** OTP email (OQ-06), ẩn phiếu người kia (OQ-07), chốt sau khi người nhận tham gia (OQ-08), lời nhắc chỉ cho chủ kế hoạch (OQ-10), .ics một lần (OQ-12), ranh giới giá (OQ-03).
4. **Chưa làm:** tải ảnh/tệp (OQ-21), đổi địa điểm trong màn sửa kế hoạch, bản đồ (OQ-05), quản trị F2.
5. **Chưa kiểm chứng:** Safari/Edge thật, trình đọc màn hình thật, hiệu năng thực địa, các AC thuộc server (AC-010, 015 đồng thời, 021/022, 033/034).
6. Token phiên ở localStorage (shortcut repo, OQ-06): đề xuất cookie HttpOnly.

## 5. Remaining work & remediation plan

| Ưu tiên | Việc | Ai | Điều kiện xong |
|---|---|---|---|
| P0 | Backend implement các endpoint F1 + CCR-01/02/03; FE chạy `npm run gen:api` → sửa lỗi kiểu → bỏ handler mock tương ứng | Backend → FE | `npm run dev` (không mock) chạy đủ luồng; test AC server |
| P0 | Nghiệm thu lại FR-18/FR-35/FR-11 với API thật | FE + QA | AC-053/054/057/058/055 pass trên backend |
| P1 | PO chốt OQ-03/04/06/07/08/10/12/21 | PO | Cập nhật mặc định PROP trong code |
| P1 | Test Safari iOS + Edge, trình đọc màn hình (VoiceOver/NVDA) | QA | Ghi phiên bản vào QA report (NFR-02/03) |
| P2 | U-02…U-04 (cảnh báo rời form, `h1` cho trang lỗi, đổi địa điểm kế hoạch) | FE | — |
| P2 | Playwright e2e khi có backend | FE | Chạy trong CI (OQ-22) |
| Sau | F2 quản trị theo `02-implementation-plan.md` M8 | FE | Sau OQ-15/18/19/20 |

## 6. Cách chạy cho người nhận bàn giao

```bash
cd gowithbae-fe
npm ci
npm run dev:mock   # http://localhost:5173 — mã đăng nhập thử 123456; /invite/loi-moi-mau
npm test
npm run build
```

Tài liệu: [docs/frontend/README.md](README.md) · hướng dẫn dev: [../DEVELOPMENT.md](../DEVELOPMENT.md) · stack: [../../TECHSTACK.md](../../TECHSTACK.md).

## 7. Đánh giá sẵn sàng

**Không production-ready.** Frontend F1 đạt nghiệm thu ở mức giao diện và hành vi trên dữ liệu minh họa. Còn blocker contract/backend (CCR-01/02/03) và chưa có xác minh trên backend thật cùng các trình duyệt mục tiêu.
