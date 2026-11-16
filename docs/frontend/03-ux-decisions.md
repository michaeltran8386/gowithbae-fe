# 03 — UX Decisions (PHASE 3)

## 1. Quyết định UX chính

| ID | Quyết định | Lý do / nguồn | Phương án bị loại |
|---|---|---|---|
| UX-01 | Giữ 4 mục điều hướng SRS; phiên cùng chọn đặt trong **Buổi hẹn** | SRS §8; cùng chọn là bước ngay trước lập kế hoạch | Thêm tab thứ 5 “Cùng chọn” (lệch SRS, chật ở 360 px) |
| UX-02 | Luồng người nhận dùng `MinimalLayout`, không nav chính, không yêu cầu đăng nhập | CR-001 DEC-03; giảm nhiễu cho người lần đầu đến | Dùng AppLayout (người nhận thấy tab Đã lưu/Buổi hẹn mà không dùng được) |
| UX-03 | Lời nhắc “Đi chưa?” là **thẻ inline**, không modal; hai nút Đã đi / Bỏ qua lời nhắc | CR-001 DEC-02 “không cần popup khác”; không chặn tác vụ đang làm | Modal (ép người dùng phải xử lý, dễ bị coi là popup); toast (dễ mất) |
| UX-04 | Bỏ phiếu dạng **danh sách** với nút Thích/Bỏ qua, không vuốt kiểu thẻ | Cần xem tổng thể, sửa phiếu (FR-12), dùng được bàn phím (NFR-03); 2–5 nơi đủ ngắn | Vuốt từng thẻ (khó sửa phiếu, cử chỉ không thay được nút) |
| UX-05 | “Chưa trả lời” là trạng thái hiển thị riêng; chạm lại nút đang chọn không xóa phiếu | RULE-10: không có phiếu ≠ Bỏ qua; tránh xóa phiếu do chạm nhầm | Toggle bỏ chọn (sinh trạng thái không mong muốn) |
| UX-06 | Đăng nhập giữ **intent**: quay lại đúng trang và mở dialog đang dở, không tự thực hiện thao tác | SRS §8 [PROP], A-11; tránh lưu/tạo ngoài ý muốn | Tự lưu sau đăng nhập |
| UX-07 | Bộ lọc mobile chỉnh trên **bản nháp**, chỉ áp khi bấm Áp dụng | SRS UI02; tránh gọi API và tạo lượt tìm theo từng chạm (FR-32) | Áp ngay từng lựa chọn |
| UX-08 | Tìm kiếm gửi khi Enter/nút Tìm; ô tìm trên S-03 tự gửi sau khi ngừng gõ 400 ms, nhưng **chỉ ghi `search_submitted` khi submit** | FR-32 “không đếm từng ký tự” | Gửi mỗi phím (đang có ở code hiện tại) |
| UX-09 | Thiếu dữ liệu hiển thị “Chưa có thông tin” **tại đúng chỗ** của trường, không ẩn mục | RULE-04, AC-003/006 | Ẩn mục trống (người dùng tưởng là không có) |
| UX-10 | Thao tác không đảo ngược dùng ConfirmDialog nêu rõ hậu quả; thao tác đảo được (bỏ lưu) dùng toast Hoàn tác | Error prevention; giảm dialog thừa | Confirm cho mọi thao tác |
| UX-11 | Link mời chỉ hiện một lần → cảnh báo khi rời trang chưa sao chép; mất link thì “Cấp link mới” | Contract: `inviteToken` chỉ trả một lần | Lưu token ở client (rủi ro lộ) |
| UX-12 | “Đã đi X lần” ẩn khi 0; không hiển thị cho người nhận | A-10, FR-35 | Hiện “0 lần” (gây cảm giác thúc ép) |
| UX-13 | Mỗi giờ hiển thị kèm ngữ cảnh “giờ Việt Nam” ở form kế hoạch và tệp lịch | FR-17; người dùng có thể ở múi giờ khác | — |
| UX-14 | Khay so sánh nổi, giữ qua reload (localStorage), tối đa 3 | FR-06, A-09 | Chỉ so sánh trong một trang |
| UX-15 | Sau khi lưu ở S-04, toast kèm gợi ý “Lưu thêm nơi để mời người ấy cùng chọn” (chỉ khi danh sách <2 nơi) | Discoverability của FR-10; đã được duyệt 16-11 | Onboarding nhiều bước |

## 2. Interaction model theo màn

| Screen | Primary CTA | Secondary | Feedback | Confirmation | Keyboard | Mobile |
|---|---|---|---|---|---|---|
| S-01 | Tìm | Chip hoạt động, bộ sưu tập | Skeleton | — | Enter gửi tìm; chip là button | Chip cuộn ngang, vùng chạm ≥44 px |
| S-03 | Mở chi tiết | Lưu, So sánh, Lọc, Sắp xếp | Số kết quả cập nhật trong `aria-live=polite` | — | Tab qua thẻ; bộ lọc là fieldset/checkbox | Sheet lọc; chip điều kiện có ✕ |
| S-04 | Lên kế hoạch | Lưu, So sánh, Gọi, Chỉ đường, Báo sai | Toast lưu + Hoàn tác | — | Gallery điều khiển bằng mũi tên | Action bar sticky; gọi bằng `tel:` |
| S-05 | Chọn nơi này | Bỏ, Thêm nơi | — | — | Bảng có `<th scope>` | Hàng tiêu chí |
| S-06 | Gửi mã / Xác nhận | Gửi lại, Đổi email | Đếm ngược | — | Autofocus ô mã; `one-time-code` | Bàn phím số |
| S-07/08 | Mời cùng chọn | Tạo/đổi tên/xóa, Bỏ nơi | Toast | Xóa danh sách | Menu ⋯ là `menu button` | — |
| S-09 | Tạo lời mời → Sao chép | Chia sẻ | “Đã sao chép” `aria-live` | Rời trang khi chưa sao chép | — | Web Share API |
| S-10 | Tham gia chọn | — | Lỗi ngay dưới ô tên | — | Enter gửi | Không có nav |
| S-11 | Thích / Bỏ qua | Xem kết quả, Chia sẻ (chủ) | Optimistic + hoàn tác khi lỗi | Thu hồi, loại người nhận | Nhóm radio, phím mũi tên | Nút cao ≥44 px |
| S-12 | Chốt và tạo kế hoạch (chủ) | Chọn nơi | Pending trên nút | — (form đã là bước xác nhận) | — | Form trong sheet |
| S-13 | Mở kế hoạch | Tabs, tiếp tục phiên | — | — | Tabs ARIA | — |
| S-14 | Lưu kế hoạch | — | Cảnh báo giờ | — | Input date/time native | Picker native |
| S-15 | (khi đến hạn) Đã đi | Chỉ đường, Lịch, Sửa, Hủy | Thẻ nhắc biến mất, số lần cập nhật | Hủy kế hoạch | — | — |
| S-16–20 | Lưu / Gửi | — | Toast | Xóa tài khoản (2 bước) | — | — |

## 3. Edge & UI states

| State | Cách xử lý chung | Màn đặc biệt |
|---|---|---|
| Initial | Trang có nội dung mặc định, không trắng | S-03 không có `q` → hiện tất cả nơi theo sắp xếp mặc định |
| Loading | Skeleton đúng hình dạng; giữ layout | Mutation: nút `pending`, không khóa toàn trang |
| Empty | Minh họa nhẹ + câu giải thích + 1 CTA | S-03 0 kết quả: giữ điều kiện (FR-03) |
| Success | Toast ngắn hoặc chuyển trang; không chặn | S-09: trạng thái thành công ngay trên trang |
| Error | ErrorState: câu dễ hiểu + mã tra cứu + Thử lại | Lỗi analytics: không hiển thị |
| Validation | Lỗi dưới trường, `aria-invalid`, focus vào trường lỗi đầu tiên; giữ dữ liệu | 400 `errors[]` từ server gắn đúng trường |
| Unauthorized | 401 → login + returnTo; 404/410 → trang không tìm thấy hoặc link hết hiệu lực | Người nhận mất quyền: banner trong trang, khóa nút |
| Disabled | Nút khóa luôn có lý do bên cạnh (vd. “Cần ít nhất 2 nơi”) | Khay so sánh đầy |
| Partial data | Trường null → “Chưa có thông tin”; ảnh lỗi → khung giữ chỗ có tên | Nơi `available=false` trong phiên |
| Slow network | Skeleton sau 150 ms (tránh nháy); sau 10 s hiện “Mạng chậm, đang thử…” | Mutation không timeout giả; nếu kết quả chưa rõ thì đọc lại trạng thái |
| Long content | Tên địa điểm tối đa 2 dòng ở thẻ (`line-clamp`), đầy đủ ở chi tiết; ghi chú/tin nhắn xuống dòng an toàn | Bảng so sánh mobile |
| Mobile viewport | Kiểm tra 360 px: không cuộn ngang, nút ≥44 px | Action bar không che nội dung (thêm padding đáy) |
| Offline | Banner “Mất kết nối” (sự kiện `online`/`offline`); không cache offline | — |

## 4. Heuristic review (tự đánh giá, chưa test người dùng)

| Heuristic | Đánh giá | Rủi ro còn lại | Giảm thiểu |
|---|---|---|---|
| Clarity | Câu chữ bắt buộc theo SRS; “Bỏ qua” (phiếu) và “Bỏ qua lời nhắc” khác nhãn và khác vị trí | Người dùng vẫn có thể nhầm 2 nghĩa “Bỏ qua” | Phase 4: khác biểu tượng/màu; nhãn đầy đủ “Bỏ qua lời nhắc” |
| Consistency | Một PlaceCard, một PlanForm, một kiểu lỗi | Desktop/mobile so sánh khác cấu trúc | Cùng nguồn hàng tiêu chí |
| Feedback | Mọi mutation có pending + kết quả; optimistic vote có hoàn tác | Lời nhắc “đến giờ” phụ thuộc làm mới định kỳ | Làm mới khi focus tab + 60 s |
| Error prevention | Confirm cho thao tác không đảo; khóa nút khi số nơi sai; Idempotency-Key | Mất link mời | Cảnh báo rời trang + cấp link mới |
| Cognitive load | Bộ lọc nhiều nhóm (10 nhóm, §5.1) | Sheet lọc dài trên mobile | Nhóm thu gọn, nhóm phổ biến (khu vực, ngân sách, hoạt động) mở sẵn |
| Discoverability | CTA “Mời người ấy cùng chọn” chỉ có ở danh sách đã lưu | Người dùng không biết tính năng cùng chọn | Gợi ý nhẹ trên S-04 sau khi lưu (“Lưu thêm để mời người ấy cùng chọn”). Cần PO đồng ý |
| Navigation efficiency | Lên kế hoạch trực tiếp từ chi tiết trong 3 bước | — | — |
| Accessibility | Semantic HTML, nhóm radio, dialog native, focus | Bản đồ khó tiếp cận | Danh sách luôn là chế độ mặc định và đầy đủ (bản đồ không bắt buộc) |

## 5. Còn mở (ảnh hưởng UX, không chặn Phase 4)

- OQ-07: hiển thị phiếu riêng của người kia (mặc định: không).
- OQ-08: khi nào nút Chốt được bật (mặc định: sau khi người nhận tham gia).
- OQ-10: ai thấy lời nhắc (mặc định: chủ kế hoạch).
- CCR-01/02/03: chờ backend cập nhật contract.
- ~~Gợi ý cùng chọn trên S-04~~: **đã được người yêu cầu đồng ý 16-11-2026** (UX-15). Đây là gợi ý UI, không đổi nghiệp vụ.
