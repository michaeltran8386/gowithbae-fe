# 04 — Design Decisions (PHASE 4)

**Trạng thái:** chờ **APPROVAL GATE 2**. Chưa viết code Frontend.

## 1. Quyết định đề xuất

| ID | Quyết định | Lý do | Tác động nếu đổi |
|---|---|---|---|
| DD-01 | Chọn hướng **B+**: B (tối ưu hành trình) + vé hẹn và trái tim cam từ C | Điểm review cao nhất (32/35) và giữ được cảm xúc thương hiệu ở đúng tính năng CR-001 (04-ui-options §4.6) | A: bỏ khu “Tiếp tục”, đơn giản hóa thẻ. C: thêm Baloo 2, dải trời, vote dạng tim |
| DD-02 | Bảng màu lấy từ logo bằng đo pixel: `#00B0F8`, `#BCE9FA`, `#FA9A6E`; sắc đậm `#0070B8`, `#B4532A` cho chữ/nút | Bám §2.4 và đạt tương phản AA (đã tính) | Khi có logo vector/mã màu chính thức (OQ-01) chỉ cần đổi primitive |
| DD-03 | Bỏ token tạm `#004885` của repo | Không có nguồn duyệt (mock Stitch không tồn tại), lệch “xanh da trời” | — |
| DD-04 | Một font **Be Vietnam Pro** | Thiết kế cho tiếng Việt, đã có trong repo; tiết kiệm tải | Chọn C thì thêm Baloo 2 cho H1/H2 |
| DD-05 | Semantic token (`action`, `attention`, `heart`…) thay vì tên màu | Đổi thương hiệu không phải sửa component | — |
| DD-06 | Thẻ không có bóng; bóng chỉ dành cho lớp nổi (action bar, sheet, dialog, khay) | Tránh mẫu “SaaS card kit”; bóng mang nghĩa cấp lớp | — |
| DD-07 | Icon Lucide (`lucide-react`) | Nhẹ, tree-shake, đủ icon; trái tim thương hiệu là SVG riêng | Từ chối thì tự làm sprite khoảng 25 icon (+1–2 ngày) |
| DD-08 | Cá tính chỉ ở 2 điểm: vé hẹn (lời nhắc + đầu chi tiết buổi hẹn) và trái tim (Thích, Đã đi) | Theo nguyên tắc “spend your boldness in one place”; vé gắn với CR-001 | — |
| DD-09 | Một chuyển động duy nhất do người dùng kích hoạt: tim đầy khi Thích / Đã đi; tắt khi `prefers-reduced-motion` | Phản hồi rõ thao tác quan trọng; tránh hiệu ứng rải rác | — |
| DD-10 | Sentence case cho tiêu đề và nút; không nhãn HOA | Tự nhiên với tiếng Việt; guideline Title Case không áp dụng cho tiếng Việt | — |
| DD-11 | Input 16 px, vùng chạm 44 px, viền input `#7F98A8` (3,02:1) | iOS không zoom; WCAG 2.2 AA (A-07) | — |

## 2. Kiểm tra tuân thủ `web-design-guidelines` (mức thiết kế)

Đã đối chiếu bộ Web Interface Guidelines (tải ngày 16-11-2026) với thiết kế. Review code thực tế sẽ làm ở Phase 6.

| Nhóm | Áp dụng trong thiết kế |
|---|---|
| Accessibility | Nút chỉ có icon có `aria-label`; landmark, skip link, heading theo cấp; toast `aria-live` |
| Focus | Vòng focus 2 px `--color-focus`; sticky bar không che phần tử đang focus |
| Forms | Label hiển thị, `autocomplete`/`inputmode` đúng, không chặn dán, lỗi inline và focus lỗi đầu tiên, cảnh báo rời trang (link mời, form dở) |
| Animation | Chỉ `transform`/`opacity`; reduced-motion |
| Typography | `…`, ngoặc kép cong, `tabular-nums` cho giá/số đếm, `text-wrap: balance` |
| Content | Tên dài `line-clamp`, flex child `min-w-0`, EmptyState cho mọi danh sách |
| Images | `width/height` hoặc `aspect-ratio`, lazy dưới màn đầu, ảnh đầu trang chi tiết `fetchpriority=high` |
| Navigation & state | Bộ lọc, tab, trang trên URL; link thật để mở tab mới được; thao tác phá hủy có xác nhận hoặc Hoàn tác |
| Touch | `touch-action: manipulation`, `overscroll-behavior: contain` trong sheet, không khóa zoom, safe-area |
| Locale | `Intl.NumberFormat` / `Intl.DateTimeFormat` `vi-VN`; `translate="no"` cho “GoWithBae” |

## 3. Rủi ro thiết kế còn lại

| Rủi ro | Giảm thiểu |
|---|---|
| Logo chỉ có PNG 159 px, màu đo gần đúng | Xin bản vector + mã màu (OQ-01); token primitive đổi một chỗ |
| Mask răng cưa của vé trên Safari cũ | Fallback bo góc thường qua `@supports (mask: …)` |
| Khu “Tiếp tục” phụ thuộc lời nhắc chưa có API (CCR-02) | Khối lời nhắc ẩn đến khi có contract; các khối khác vẫn chạy |
| Bảng so sánh 3 cột ở 360 px chật | Thử với dữ liệu thật ở Phase 5; phương án dự phòng “so 2 nơi” (03-wireframes) |
| Chưa test người dùng | Prototype F1 trên MSW dùng để PO/người dùng thử bấm (SRS §14.2) |

## 4. Câu hỏi tại Gate 2

1. Chọn hướng nào: **B+ (đề xuất)**, A, B, hay C? Có chỉnh gì không?
2. Duyệt **D-07 Lucide** (thêm `lucide-react`)?
3. Có bản logo vector/mã màu chính thức không (OQ-01)? Nếu chưa, dùng màu đo từ PNG như trên.
