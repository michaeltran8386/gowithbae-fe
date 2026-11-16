# 04 — Screen-level UI Specifications (PHASE 4)

Theo hướng **B+**. Bố cục chi tiết xem [03-wireframes.md](03-wireframes.md); component xem [02-component-map.md](02-component-map.md); token xem [04-design-system-proposal.md](04-design-system-proposal.md). Bảng dưới chỉ ghi phần visual và hành vi riêng của từng màn.
Chung cho mọi màn: một `<h1>`; skip link; Loading = Skeleton đúng hình; Error = ErrorState có mã tra cứu; 360 px không cuộn ngang; focus visible.

## S-01 Khám phá — FR-01, FR-18 (+ UX-15)

| Mục | Spec |
|---|---|
| Layout | Header (logo + chuông) · khu **Tiếp tục** (chỉ hiện khi đã đăng nhập và có việc dở): vé “Đi chưa?” → thẻ phiên đang cùng chọn (tiến độ) → buổi hẹn sắp tới gần nhất · H1 “Tìm nơi hẹn hò” · ô tìm · bộ lọc nhanh cuộn ngang (khu vực, ngân sách, hoạt động phổ biến) · Bộ sưu tập (desktop: lưới 3; mobile: cuộn ngang, thẻ rộng 80%) |
| Hierarchy | Việc dở > tìm kiếm > bộ sưu tập. Khách chưa đăng nhập: bắt đầu từ H1 |
| Components | VisitReminderTicket, ChoiceSessionCard, PlanCard (compact), SearchField, QuickFilterBar, CollectionCard |
| States | Không có bộ sưu tập: ẩn mục, giữ tìm kiếm. Khu Tiếp tục: mỗi thẻ loading/lỗi riêng, lỗi một thẻ không làm hỏng trang |
| Responsive | ≥768: khu Tiếp tục thành hàng 3 cột; ô tìm rộng 640 px |
| A11y | Khu Tiếp tục là `<section aria-labelledby>`; vé lời nhắc có tiêu đề là câu hỏi; hai nút có nhãn đầy đủ |

## S-03 Kết quả — FR-02–04

| Mục | Spec |
|---|---|
| Layout | Mobile: ô tìm + [Bộ lọc (n)] + [Sắp xếp] · chip điều kiện đang áp (có ✕) · “24 địa điểm” · danh sách 1 cột · phân trang. Desktop: cột lọc 280 px sticky + lưới 3 |
| Components | FilterPanel (Sheet ở mobile), ChipGroup, SortSelect, ViewToggle, PlaceCard, Pagination, CompareTray |
| Hierarchy | Số kết quả và chip điều kiện ngay trên lưới; quy tắc “ít nhất một / phải đủ” in nhỏ cạnh tên nhóm lọc |
| States | 0 kết quả: EmptyState + chip để bỏ từng điều kiện; từ chối vị trí: nhắc nhập khu vực; `view=map` chưa có nhà cung cấp: khung “Bản đồ chưa sẵn sàng” + nút về danh sách |
| A11y | Kết quả trong `aria-live=polite` (“24 địa điểm”); nhóm lọc là `fieldset/legend`; sheet có focus trap, Esc đóng (khi đóng không lưu bản nháp, có hỏi nếu đã thay đổi) |
| Req | AC-001, AC-002, RULE-02/04 |

## S-04 Chi tiết địa điểm — FR-05, 06, 09, 15, 19, 35

| Mục | Spec |
|---|---|
| Layout | Gallery 4:3 (mobile, vuốt + nút ‹ › cho bàn phím) · tên H1 + loại hình · “♥ Đã đi X lần” (peach) · **fact strip 3 ô** · Trải nghiệm · Tiện ích · Giờ & địa chỉ (bảng tuần, hôm nay in đậm) · Lưu ý · “Cập nhật dd/mm/yyyy” · link Báo thông tin sai. Desktop 7/5: cột phải sticky gồm tên, giá, CTA |
| Action bar | [♡ Lưu] [⇄ So sánh] [Lên kế hoạch] (primary, chiếm phần còn lại); menu ⋯: Gọi, Chỉ đường, Chia sẻ |
| States | Mỗi trường null: “Chưa có thông tin” màu muted tại đúng vị trí; ảnh rỗng: khung xanh nhạt có tên nơi; 404: trang không tìm thấy |
| A11y | Gallery `aria-roledescription="carousel"`, ảnh có `alt` từ caption hoặc “Ảnh <tên nơi> n/N”; bảng giờ là `<table>` |
| Req | FR-05 thứ tự, AC-003/004/029, UX-15 toast gợi ý cùng chọn |

## S-05 So sánh — FR-06

| Mục | Spec |
|---|---|
| Layout | Desktop: bảng, cột tiêu chí sticky, header cột (ảnh, tên, Bỏ, Chọn nơi này). Mobile: mỗi tiêu chí một khối, bên trong chia 2–3 ô; tên viết tắt 2 dòng |
| States | 1 nơi: EmptyState “Thêm ít nhất 1 nơi nữa”; khay đầy: thông báo tối đa 3 |
| A11y | `<table>` + `scope`; số tiền tabular, căn phải |
| Req | AC-005/006 |

## S-06 Đăng nhập — FR-07

| Mục | Spec |
|---|---|
| Layout | MinimalLayout, cột giữa 400 px: logo, H1, câu lý do theo intent, form 1 bước/màn |
| States | Đếm ngược gửi lại (`aria-live` chỉ đọc khi về 0); lỗi mã tại ô; 429 banner thời gian chờ |
| A11y | autofocus ô mã (desktop); `one-time-code`; không chặn dán |

## S-07/08 Đã lưu — FR-09, FR-10

| Mục | Spec |
|---|---|
| Layout | S-07: H1 + [＋ Danh sách mới] · hàng danh sách (ảnh ghép 3, tên, số nơi, ⋯). S-08: tên + ⋯ · nút **Mời người ấy cùng chọn** (primary, full width trên mobile) · lưới PlaceCard có nút “Bỏ khỏi danh sách” |
| States | Danh sách trống: “Lưu địa điểm từ trang Khám phá”. <2 nơi khả dụng: nút mời khóa + lý do. Nơi ẩn: thẻ opacity .6 + badge “Không còn hiển thị” |
| Req | AC-011/012 |

## S-09 Tạo lời mời — FR-10

| Mục | Spec |
|---|---|
| Layout | Danh sách checkbox (PlaceCard compact) + bộ đếm “3/5” sticky đáy cùng nút Tạo lời mời → sau khi tạo: khối thành công (✓), CopyField, nút Sao chép / Chia sẻ, **khối cảnh báo** (viền attention, biểu tượng ⚠, câu đầy đủ), hạn link |
| A11y | Bộ đếm `aria-live`; cảnh báo không chỉ bằng màu |
| Req | AC-013/014, UX-11 |

## S-10 Link mời — FR-11 (CR-001)

| Mục | Spec |
|---|---|
| Layout | MinimalLayout; thẻ giữa: “<Tên> mời bạn cùng chọn nơi hẹn hò” · số lựa chọn · (CCR-03) danh sách thẻ rút gọn · ô “Tên của bạn” · [Tham gia chọn] · dòng “Không cần tạo tài khoản.” |
| States | 410 / SLOT_TAKEN: thẻ thông báo + hướng dẫn, không có form |
| Meta | `noindex`; `referrer` hạn chế |
| Req | AC-015/016/055/056 |

## S-11 Bỏ phiếu — FR-12, FR-14

| Mục | Spec |
|---|---|
| Layout | Header “Cùng chọn với <tên>” + badge trạng thái · tiến độ hai người · VoteCard (ảnh 64 px, tên, giá, trạng thái: “Cả hai cùng thích” (sky-800) / “Bạn chưa trả lời” (attention)) + segmented **Thích (♥) / Bỏ qua** · action bar “Xem nơi cả hai cùng thích (n)”. Chủ tạo: khối Chia sẻ thu gọn cuối trang |
| Segmented | Thích đang chọn: nền action + tim trắng; Bỏ qua đang chọn: nền ink + chữ trắng; chưa chọn: viền |
| States | WAITING: banner “Chờ <tên> tham gia” + CopyField nếu link còn; FINALIZED/mất quyền: banner + khóa |
| A11y | Mỗi VoteCard là `radiogroup` có tên là tên nơi; phím mũi tên đổi lựa chọn |
| Req | AC-017/018/021/022 |

## S-12 Kết quả & chốt — FR-12, FR-13

| Mục | Spec |
|---|---|
| Layout | “Cả hai cùng thích (n)” (thẻ nổi bật, viền sky-100) · “Các lựa chọn khác” · chủ tạo: nút “Chọn nơi này” trên thẻ → PlanForm (sheet mobile / inline desktop) → [Chốt và tạo kế hoạch] |
| States | Không trùng: EmptyState + 2 lựa chọn; người nhận: dòng giải thích, không có nút |
| Req | AC-019/020 |

## S-13 Buổi hẹn — FR-15, 16, 18

| Mục | Spec |
|---|---|
| Layout | Vé “Đi chưa?” (nếu có) · “Đang cùng chọn” (thẻ phiên) · Tabs Sắp tới / Đã qua / Đã hủy (trên URL) · PlanCard: ngày giờ tabular lớn bên trái (dạng cuống vé), tên nơi, badge trạng thái |
| States | Tab trống: EmptyState theo tab |

## S-14/S-15 Kế hoạch — FR-15–18, FR-35

| Mục | Spec |
|---|---|
| S-14 layout | Thẻ nơi compact · DateTimeInput (nhãn “Ngày giờ (giờ Việt Nam)”) · giờ mở cửa ngày đã chọn (hoặc “Chưa có thông tin giờ mở cửa”) · Ghi chú · NotReservedNotice · [Lưu kế hoạch] |
| S-15 layout | **Đầu trang dạng vé:** ngày giờ lớn, tên nơi, badge trạng thái, đường đục lỗ · vé “Đi chưa?” (khi đến hạn) · thẻ nơi (“♥ Đã đi X lần”) · ghi chú · NotReservedNotice (luôn hiện) · cảnh báo · hàng [Chỉ đường] [Thêm vào lịch] · chủ: [Sửa] · [Hủy kế hoạch] (danger, cuối trang) |
| Vé “Đi chưa?” | Nền peach-50, tim peach-400, câu hỏi H3, giờ hẹn, [Đã đi] (primary) + [Bỏ qua lời nhắc] (secondary). Sau khi bấm Đã đi: tim đầy (animation 300 ms, tắt khi reduced-motion) rồi thẻ thu lại; toast “Đã ghi nhận. Bạn đã đi <nơi> X lần” |
| States | Cancelled: vé màu xám, không nhắc; NN: ReadOnly, không có số lần |
| Req | AC-023–028, AC-053/054/057/058 |

## S-16–S-20 Tài khoản, thông báo, hỗ trợ — FR-08, 20, 21

| Mục | Spec |
|---|---|
| S-16 | Thẻ hồ sơ (avatar 64 px, tên, email) · danh sách mục (Thông báo + badge, Hỗ trợ, Đổi email, Đăng xuất) · vùng “Xóa tài khoản” tách riêng, nút danger |
| S-17 | Hàng thông báo: chấm sky-500 + chữ đậm khi chưa đọc (kèm `aria-label` “chưa đọc”), thời gian tương đối |
| S-18–20 | Ticket: mã, chủ đề, badge trạng thái; luồng tin nhắn (khách phải, nền sky-50; nhân viên trái, nền trắng viền); ô trả lời sticky đáy; CLOSED: thay ô trả lời bằng “Yêu cầu đã đóng” + [Gửi yêu cầu mới] |

## S-21 Lỗi / 404

Minh họa nét mảnh (trái tim xanh trời nhỏ), H1 “Không tìm thấy trang” hoặc “Không tìm thấy địa điểm”, [Về Khám phá]. Lỗi không mong đợi: thêm mã tra cứu.

## Admin (F2)

Chưa spec. Dùng cùng token; mật độ cao hơn (control 36 px, bảng 13 px). Làm khi lên lịch F2.
