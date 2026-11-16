# 04 — Design System Proposal (PHASE 4)

Áp dụng cho **hướng được đề xuất B+** (B + vé hẹn + trái tim cam). Nếu chọn A hoặc C, phần token màu lõi giữ nguyên; khác nhau ở bảng §11.
Triển khai bằng Tailwind 4 `@theme` trong `src/index.css`, thay token tạm hiện tại (tại T-101). Tên token theo vai trò (semantic), không theo tên màu, để đổi thương hiệu không phải sửa component.

## 1. Color tokens

### Nguồn (primitive, đo từ logo trong file nguồn)

| Primitive | Hex | Dùng được cho |
|---|---|---|
| `sky-50` | #EAF7FD | Nền phụ, nút phụ |
| `sky-100` | #BCE9FA | Quầng sáng logo; nền nhấn nhẹ, vé hẹn (viền) |
| `sky-500` | #00B0F8 | **Chỉ trang trí/đồ họa lớn** (logo, minh họa, chấm trạng thái). Không làm chữ hay nền nút có chữ trắng (2,45:1) |
| `sky-700` | #0070B8 | Hành động chính, link (5,24:1 trên trắng) |
| `sky-800` | #00659F | Hover/pressed của `sky-700`; chữ trên `sky-50` (6,2:1) |
| `peach-50` | #FFF1EA | Nền vé hẹn |
| `peach-400` | #FA9A6E | **Chỉ biểu tượng** (trái tim Thích, “Đã đi”) có kèm chữ |
| `peach-700` | #B4532A | Chữ nhấn cam, trạng thái “cần chú ý” (4,99:1) |
| `ink-900` | #14324A | Chữ chính (13,25:1) |
| `ink-600` | #4A6275 | Chữ phụ (6,37:1) |
| `line` | #D6E6EF | Viền/đường kẻ (trang trí, không mang thông tin một mình) |
| `page` | #F4F8FA | Nền trang |
| `danger-700` | #B42318 | Lỗi, hành động nguy hiểm (6,5:1) |
| `success-700` | #1E7B4A | Thành công (5,3:1) |

### Semantic (dùng trong component)

| Token | Giá trị | Ghi chú |
|---|---|---|
| `--color-bg` / `--color-surface` | page / #FFFFFF | Nền trang / khối |
| `--color-text` / `--color-text-muted` | ink-900 / ink-600 | |
| `--color-action` / `--color-action-hover` / `--color-on-action` | sky-700 / sky-800 / #FFFFFF | Nút chính, link |
| `--color-action-soft` / `--color-on-action-soft` | sky-50 / sky-800 | Nút phụ |
| `--color-attention` | peach-700 | “Bạn chưa trả lời”, “Chưa có thông tin giờ” |
| `--color-heart` | peach-400 | Biểu tượng tim |
| `--color-ticket-bg` / `--color-ticket-edge` | peach-50 / #F2C6B0 | Vé hẹn |
| `--color-border` | line | |
| `--color-focus` | sky-700 | Vòng focus 2 px + offset 2 px |
| `--color-danger` / `--color-success` | danger-700 / success-700 | |

Quy tắc: thông tin không được truyền **chỉ bằng màu**. Trạng thái luôn có chữ hoặc biểu tượng đi kèm (vd. “Chưa trả lời”, “Cả hai cùng thích”). Không làm dark mode ở G1 (A-13).

## 2. Typography

| Vai trò | Font | Cỡ / line-height (mobile → ≥768) | Độ đậm |
|---|---|---|---|
| Display (H1 trang) | Be Vietnam Pro | 24/30 → 30/36 | 700 |
| H2 khối | Be Vietnam Pro | 20/26 → 22/28 | 700 |
| H3 thẻ/mục | Be Vietnam Pro | 17/24 | 600 |
| Body | Be Vietnam Pro | 15/24 | 400 |
| Body nhỏ / meta | Be Vietnam Pro | 13/20 | 400–500 |
| Caption tối thiểu | Be Vietnam Pro | 12/16 | 500 |
| Số tiền, số đếm | Be Vietnam Pro `tabular-nums` | theo ngữ cảnh | 700 |

- Thang tỉ lệ khoảng 1,2 (12–13–15–17–20–24–30). Input dùng tối thiểu **16 px** để Safari iOS không tự zoom.
- Viết hoa kiểu câu (sentence case). Không viết HOA toàn bộ cho nhãn; không đặt nhãn “eyebrow” trên mọi tiêu đề.
- Dòng tối đa khoảng 70 ký tự cho đoạn mô tả. Tiêu đề dùng `text-wrap: balance`.
- Chữ: dùng `…` (không dùng `...`), dấu ngoặc kép cong “ ”, khoảng trắng không ngắt trước đơn vị (`300.000 ₫`).
- Font tải từ Google Fonts subset `vietnamese,latin`, `display=swap`, 4 độ đậm 400/500/600/700 (đã có trong `index.html`).

## 3. Spacing, grid, breakpoints

- **Spacing:** thang 4 px (Tailwind mặc định): 4, 8, 12, 16, 20, 24, 32, 40, 48. Lề trang mobile 16 px; khoảng cách khối 12–16 px.
- **Breakpoints:** dùng mặc định Tailwind: `sm 640`, `md 768` (đổi nav & bộ lọc), `lg 1024` (2 cột chi tiết, lưới 3), `xl 1280`. Thiết kế gốc ở **360**.
- **Container:** `max-w-6xl` (1152 px), giữ như repo.
- **Grid:** mobile 1 cột; `md` 2 cột thẻ; `lg` kết quả = cột lọc 280 px + lưới 3; chi tiết = 7/5 cột.
- **Safe area:** bottom nav và action bar đáy cộng thêm `env(safe-area-inset-bottom)`.

## 4. Radius & elevation

| Token | Giá trị | Dùng cho |
|---|---|---|
| `--radius-control` | 10 px | Nút, input, segmented |
| `--radius-block` | 14 px | Thẻ địa điểm, khối nội dung, dialog |
| `--radius-pill` | 999 px | Chip lọc, badge |
| `--radius-ticket` | 16 px + răng cưa 10 px | Vé hẹn |
| `--shadow-raised` | `0 1px 2px rgb(20 50 74 / .06), 0 4px 12px rgb(20 50 74 / .06)` | **Chỉ** action bar đáy, sheet, dialog, khay so sánh: những thứ nổi lên trên nội dung |

Thẻ thường **không có bóng**; dùng nền trắng trên nền `page` để tách lớp. Mỗi cấp bậc một kiểu bo, không dùng một bo cho mọi thứ.

## 5. Icons

- Đề xuất **Lucide** (`lucide-react`, ISC). Nét 1,75 px, cỡ 20/24 px, tree-shake theo icon. *(D-07, cần duyệt cùng Gate 2.)* Phương án thay thế: tự vẽ sprite SVG khoảng 25 icon.
- Trái tim thương hiệu là SVG riêng (tô `--color-heart`), không lấy từ bộ icon.
- Icon trang trí thêm `aria-hidden="true"`; nút chỉ có icon phải có `aria-label`.
- Không dùng emoji làm icon chức năng.
- Xóa sprite mẫu của Vite (`public/icons.svg`) khi triển khai.

## 6. Buttons

Explicit variants (theo `patterns-explicit-variants`):

| Variant | Nền / chữ | Dùng cho |
|---|---|---|
| `PrimaryButton` | action / on-action | Một CTA chính mỗi vùng: Lên kế hoạch, Tham gia chọn, Lưu kế hoạch, Đã đi |
| `SecondaryButton` | action-soft / on-action-soft | Bỏ qua lời nhắc, Hủy trong dialog, Xem kết quả |
| `GhostButton` | trong suốt / action | Hành động phụ trong danh sách |
| `DangerButton` | danger / trắng | Xóa danh sách, Hủy kế hoạch, Thu hồi link, Xóa tài khoản |
| `IconButton` | surface + border | Lưu (tim), So sánh, Đóng |

Trạng thái: hover (đậm hơn một bậc), active (`scale(.98)`), `focus-visible` (vòng focus), `disabled` (opacity .5, kèm lý do bên cạnh), `pending` (spinner + `aria-busy`, giữ nguyên độ rộng). Chiều cao 44 px (mobile), 40 px (desktop dày đặc). Nhãn là động từ cụ thể: “Lưu kế hoạch”, không “Xác nhận”.

## 7. Inputs & form states

| State | Hiển thị |
|---|---|
| Default | Nền trắng, viền `#7F98A8` (3,02:1 trên trắng, đạt ngưỡng 3:1 cho thành phần UI; đã đo) |
| Hover | Viền ink-600 |
| Focus | Viền action + vòng focus |
| Invalid | Viền danger + biểu tượng + thông báo dưới ô (`role="alert"`), `aria-invalid` |
| Disabled | Nền page, chữ muted |
| Read-only | Không viền, chữ thường |

Mỗi ô có `<label>` hiển thị (không chỉ dùng placeholder). Placeholder kết thúc bằng `…` và là ví dụ (“vd. Quận 3…”). Email: `type=email`, `autocomplete=email`, `spellcheck=false`. Mã OTP: `inputmode=numeric`, `autocomplete=one-time-code`. Không chặn dán.

## 8. Feedback

| Component | Khi nào |
|---|---|
| Inline field error | Lỗi validation (400) |
| Toast (`aria-live=polite`, 4 s, có nút Hoàn tác khi đảo được) | Lưu/bỏ lưu, sao chép link, cập nhật thành công |
| Banner trong trang | Trạng thái kéo dài: phiên đã chốt, mất quyền, mất mạng, dữ liệu minh họa |
| EmptyState | Minh họa nhẹ (nét mảnh xanh trời, không ảnh stock) + 1 câu + 1 CTA |
| ErrorState | Câu giải thích + mã tra cứu + Thử lại |
| Skeleton | Khối `sky-50` có ánh sáng chạy (tắt khi reduced-motion) |
| ConfirmDialog | Thao tác không đảo ngược |

## 9. Navigation patterns

- Bottom nav 4 mục: icon 24 px + nhãn 12 px; mục đang chọn có màu action, icon đặc và `aria-current="page"`.
- Header desktop: logo trái, nav giữa/phải, chuông có badge số (đọc là “3 thông báo chưa đọc”).
- Trang sâu (mobile): nút Quay lại + tiêu đề rút gọn.
- Action bar đáy thay chỗ bottom nav ở S-04/S-11/S-12/S-15.
- Skip link “Bỏ qua đến nội dung chính” là phần tử đầu tiên khi Tab.

## 10. Data display

| Component | Quy tắc |
|---|---|
| PlaceCard | Ảnh 16:10 bo trên; tên tối đa 2 dòng; giá tabular đậm + “/ 2 người”; tối đa 3 nhãn; nút tim góc phải |
| Fact strip (chi tiết) | 3 ô: Giá 2 người · Giờ hôm nay · Khu vực; thiếu dữ liệu thì ghi “Chưa rõ” màu attention + chữ, không để trống |
| Vé hẹn | Ngày giờ lớn (tabular), tên nơi, đường đục lỗ, phần hành động bên dưới; mask răng cưa có fallback bo góc thường nếu trình duyệt không hỗ trợ `mask` |
| Bảng so sánh | `<table>` với `<th scope="row">`; số liệu căn phải, tabular |
| Badge trạng thái | Pill: Đã lên lịch (action-soft), Đã hủy (page + muted), Đã qua giờ (page), Chưa trả lời (peach-50 + attention) |
| Tiến độ cùng chọn | Thanh 6 px + chữ “Bạn 2/3 · Lan 2/3” |

## 11. Khác biệt nếu chọn A hoặc C

| Hạng mục | A | C |
|---|---|---|
| Nền | Trắng toàn trang | Dải trời gradient ở trang chủ/đầu phiên |
| Bo | 8 px mọi nơi | Pill nút, 18 px thẻ |
| Font | 1 font, 2 độ đậm | + Baloo 2 cho H1/H2 |
| Vote | Nút chữ | Nút tim |
| Thẻ địa điểm | Hàng ngang | Bưu thiếp 2 cột |

## 12. Accessibility considerations

- Mục tiêu nội bộ **WCAG 2.2 AA** (A-07): chữ ≥4,5:1, chữ lớn và thành phần UI ≥3:1. Bảng màu §1 đã được tính tương phản.
- Vùng chạm ≥44×44 px; khoảng cách giữa các mục chạm ≥8 px.
- `:focus-visible` cho mọi phần tử tương tác; sticky header/action bar không che phần tử đang focus (`scroll-padding`).
- `prefers-reduced-motion`: tắt shimmer, hiệu ứng tim, chuyển trang; chỉ animate `transform`/`opacity`; không dùng `transition: all`.
- Không khóa zoom (`user-scalable` giữ mặc định). `touch-action: manipulation` trên nút. `overscroll-behavior: contain` trong sheet/dialog.
- Heading theo thứ tự; mỗi trang một `<h1>`; landmark `header/nav/main`.
- Ngày giờ/tiền dùng `Intl` (`vi-VN`, `Asia/Ho_Chi_Minh`); tên thương hiệu `translate="no"`.
