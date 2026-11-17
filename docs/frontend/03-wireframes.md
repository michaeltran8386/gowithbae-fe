# 03 — Wireframe Planning (PHASE 3)

Mô tả bằng chữ và sơ đồ ASCII: **không phải** thiết kế đã render, chưa có hình thức thị giác (thuộc Phase 4). Mobile 360 px là chuẩn đầu tiên; desktop ≥1024 px. Vùng ⟦…⟧ là vùng nội dung.

## S-01 Khám phá

```
MOBILE                              DESKTOP
┌──────────────────────┐            ┌──────────────────────────────────────────────┐
│ Logo            🔔   │            │ Logo  Khám phá Đã lưu Buổi hẹn Tài khoản 🔔 👤│
├──────────────────────┤            ├──────────────────────────────────────────────┤
│ ⟦Thẻ nhắc Đi chưa?⟧  │  (nếu có)  │ ⟦Thẻ nhắc Đi chưa?⟧                            │
│ H1: Hẹn ở đâu hôm nay│            │ H1 + ⟦Ô tìm kiếm lớn⟧ [Khu vực▾][Ngân sách▾]    │
│ ⟦Ô tìm kiếm⟧         │            │ ⟦Chips hoạt động: Ăn uống · Cà phê · Gốm …⟧     │
│ [Khu vực▾][Ngân sách▾]│           │ ── Bộ sưu tập ──────────────────────────────  │
│ ⟦Chips hoạt động →⟧  │            │ ⟦Thẻ BST⟧ ⟦Thẻ BST⟧ ⟦Thẻ BST⟧ (lưới 3 cột)      │
│ ── Bộ sưu tập ──     │            │                                              │
│ ⟦Thẻ BST cuộn ngang⟧ │            │                                              │
├──────────────────────┤            └──────────────────────────────────────────────┘
│ ⌂  ♡  📅  👤 bottom nav│
└──────────────────────┘
```
Hierarchy: tìm kiếm > lối tắt (khu vực/ngân sách/hoạt động) > bộ sưu tập. CTA chính: Tìm. Chọn khu vực/ngân sách/hoạt động sẽ chuyển ngay sang S-03 với điều kiện đó (một chạm).

## S-03 Kết quả

```
MOBILE                                 DESKTOP
┌─────────────────────────┐            ┌──────────────┬───────────────────────────────┐
│ ← ⟦Ô tìm: "gốm"⟧        │            │ Bộ lọc       │ ⟦Ô tìm⟧                        │
│ [⚙ Bộ lọc (3)] [Sắp xếp▾]│           │ Khu vực      │ 24 địa điểm · [Sắp xếp▾] [≡|🗺]│
│ ⟦chip: Q1 ✕⟧⟦<200k ✕⟧…  │            │ Ngân sách    │ ⟦chip active ✕⟧ … Xóa tất cả   │
│ 24 địa điểm   [≡ | 🗺]   │            │ Ngày giờ     │ ┌──────┐┌──────┐┌──────┐       │
│ ┌─────────────────────┐ │            │ Hoạt động    │ │Thẻ   ││Thẻ   ││Thẻ   │       │
│ │ ảnh 16:9            │ │            │ (ít nhất một)│ └──────┘└──────┘└──────┘       │
│ │ Tên · Khu vực       │ │            │ Không khí    │ …                             │
│ │ 300.000₫ / 2 người  │ │            │ (phải đủ)    │ ⟦Phân trang⟧                   │
│ │ #nhãn #nhãn #nhãn   │ │            │ …            │                               │
│ │ [♡ Lưu] [⇄ So sánh] │ │            │              │                               │
│ └─────────────────────┘ │            └──────────────┴───────────────────────────────┘
│ ⟦Khay so sánh 2/3 →⟧    │
└─────────────────────────┘
Sheet bộ lọc (mobile): header “Bộ lọc” + ✕; các nhóm cuộn dọc; footer cố định [Xóa bộ lọc] [Áp dụng (n kết quả?)]
```
- Số kết quả trên nút Áp dụng: **không** làm vì sẽ phải gọi thêm API mỗi lần đổi lựa chọn; footer chỉ ghi “Áp dụng”.
- 0 kết quả: thay lưới bằng EmptyState “Không có địa điểm khớp tất cả điều kiện” + danh sách chip để bỏ từng điều kiện.
- Thẻ: toàn bộ thẻ là link tới chi tiết; nút Lưu/So sánh là nút riêng (không lồng link trong link).

## S-04 Chi tiết

```
MOBILE                                  DESKTOP (2 cột)
┌──────────────────────────┐            ┌───────────────────────────┬────────────────┐
│ ← (trên ảnh)        ⋯     │            │ ⟦Gallery lớn⟧              │ Tên            │
│ ⟦Gallery vuốt, 4:3⟧       │            │                           │ Khu vực · loại │
│ Tên chi nhánh             │            │ Trải nghiệm …             │ Đã đi 2 lần    │
│ Khu vực · Loại hình       │            │ Tiện ích …                │ 300.000₫/2 ng. │
│ Đã đi 2 lần (nếu có)      │            │ Giờ mở cửa (bảng tuần)    │ gồm: …         │
│ ── Giá ──                 │            │ Địa chỉ + mini map/link   │ [Lên kế hoạch] │
│ 300.000₫ / 2 người · gồm …│            │ Lưu ý                     │ [♡ Lưu][⇄ SS]  │
│ ── Trải nghiệm ──         │            │ Cập nhật: 10/11/2026      │ [☎][➤ Chỉ đường]│
│ ── Tiện ích ──            │            │ ⚑ Báo thông tin sai       │ (sticky)       │
│ ── Giờ & địa chỉ ──       │            └───────────────────────────┴────────────────┘
│ ── Lưu ý ──               │
│ Cập nhật: … · ⚑ Báo sai   │
├──────────────────────────┤
│ [♡] [⇄]  [ Lên kế hoạch ] │  ← action bar sticky (thay bottom nav)
└──────────────────────────┘
```
Thứ tự nội dung theo FR-05. CTA chính “Lên kế hoạch”; phụ: Lưu, So sánh; menu ⋯: Gọi, Chỉ đường, Chia sẻ, Báo sai. Trường null hiện “Chưa có thông tin” ngay tại vị trí của trường (không ẩn cả mục, để người dùng biết là thiếu dữ liệu).

## S-05 So sánh

Desktop: bảng, cột đầu là tiêu chí (sticky), mỗi nơi một cột, header cột gồm ảnh nhỏ, tên, [Bỏ] [Chọn nơi này].
Mobile: tiêu chí là hàng, mỗi hàng chia 2–3 ô ngang. 3 nơi ở 360 px: mỗi ô khoảng 100 px, tên rút gọn 2 dòng; **không** cuộn ngang toàn trang. Nếu quá chật, chuyển sang chế độ “so 2 nơi”, chọn cặp bằng tab trên cùng (quyết định cuối ở Phase 4 sau khi thử với dữ liệu thật).
Hàng tiêu chí: Giá 2 người · Khu vực/khoảng cách (ước tính) · Giờ mở cửa · Hoạt động · Không khí · Tiện ích · Nên đặt trước.

## S-06 Đăng nhập (MinimalLayout)

Logo · H1 “Đăng nhập GoWithBae” · mô tả ngắn lý do cần đăng nhập (theo intent: “Đăng nhập để lưu địa điểm”) · Bước 1: Email + [Gửi mã]. Bước 2: “Nhập mã đã gửi tới a***@…” · ô mã (`inputmode=numeric`, `autocomplete=one-time-code`) · [Xác nhận] · “Gửi lại mã (0:45)” · “Đổi email”.

## S-07/S-08 Đã lưu

S-07: H1 + [＋ Danh sách mới] · các hàng danh sách (tên, số nơi, ảnh ghép 3 nơi đầu, ⋯ đổi tên/xóa).
S-08: tên danh sách (⋯) · CTA nổi bật **“Mời người ấy cùng chọn”** (khóa khi <2 nơi khả dụng, có giải thích) · lưới PlaceCard với nút Bỏ khỏi danh sách · nơi ẩn: thẻ xám + nhãn.

## S-09 Tạo lời mời

Bước 1: danh sách nơi có checkbox, bộ đếm “Đã chọn 3/5” · [Tạo lời mời].
Bước 2 (cùng trang): ✓ “Đã tạo lời mời” · ⟦CopyField link⟧ [Sao chép] [Chia sẻ] · ⚠ cảnh báo quyền của người có link · “Link hết hạn lúc …” · [Xem phiên cùng chọn].

## S-10 Link mời (MinimalLayout)

```
┌──────────────────────────┐
│ Logo                     │
│ 💌 Minh mời bạn cùng chọn │
│ nơi hẹn hò (3 lựa chọn)  │
│ ⟦3 PlaceCard rút gọn⟧     │  ← khi có CCR-03
│ Tên của bạn ⟦_______⟧    │
│ [ Tham gia chọn ]        │
│ Không cần tạo tài khoản. │
└──────────────────────────┘
Trạng thái lỗi: biểu tượng + “Liên kết không còn hiệu lực” + “Hãy nhờ người mời gửi liên kết mới.”
```

## S-11 Bỏ phiếu / S-12 Kết quả

S-11: header phiên (“Cùng chọn với Lan” · trạng thái) · tiến độ “Đã trả lời 2/4” · danh sách VoteCard: ảnh, tên, giá, [👍 Thích] [Bỏ qua] (segmented, trạng thái rõ; “Chưa trả lời” là nhãn mờ) · nút cuối [Xem kết quả]. Chủ tạo: khu “Chia sẻ” thu gọn ở cuối trang.
S-12: “Cả hai cùng thích (n)” (thẻ nổi bật) → “Các lựa chọn khác” → chủ tạo: chạm “Chọn nơi này” trên một thẻ, form kế hoạch mở bên dưới thẻ (mobile: sheet) → [Chốt và tạo kế hoạch]. Người nhận: dòng giải thích ai chốt.

## S-13 Buổi hẹn

⟦Thẻ nhắc Đi chưa?⟧ · “Đang cùng chọn” (thẻ phiên: với ai, trạng thái, nút tiếp tục) · Tabs Sắp tới / Đã qua / Đã hủy · PlanCard (ảnh nhỏ, tên nơi, ngày giờ, trạng thái). Empty: minh họa nhẹ + “Chưa có buổi hẹn nào” + [Khám phá địa điểm].

## S-14/S-15 Kế hoạch

S-14: thẻ tóm tắt nơi · Ngày ⟦date⟧ Giờ ⟦time⟧ (ghi chú: giờ Việt Nam) · giờ mở cửa hôm đó (nếu biết) · Ghi chú ⟦textarea⟧ · ℹ “Kế hoạch này chưa giữ chỗ tại địa điểm” · [Lưu kế hoạch].
S-15: trạng thái + ngày giờ lớn · ⟦Thẻ nhắc Đi chưa?⟧ (khi đến hạn) · thẻ nơi (link chi tiết, “Đã đi X lần”) · ghi chú · ℹ chưa giữ chỗ · cảnh báo (giờ chưa rõ / nơi không còn hiển thị) · hàng hành động: [Chỉ đường] [Thêm vào lịch] · chủ: [Sửa] [Hủy kế hoạch] (danger, ở cuối).

Thẻ nhắc “Đi chưa?” (dùng chung):
```
┌────────────────────────────────────────┐
│ 📍 Bạn đã đến Gốm Xinh hôm nay chưa?    │
│ Hẹn lúc 19:00 · 16/11                   │
│ [ Đã đi ]          [ Bỏ qua lời nhắc ] │
└────────────────────────────────────────┘
```

## S-16 – S-20 Tài khoản

S-16: avatar + tên + email · [Sửa hồ sơ] · danh sách mục: Thông báo (badge) · Hỗ trợ · Đổi email · Đăng xuất · vùng nguy hiểm: Xóa tài khoản.
S-17: danh sách thông báo (chưa đọc đậm + chấm), thời gian tương đối.
S-18/19/20: danh sách ticket (mã, chủ đề, trạng thái) · form tạo · chi tiết dạng luồng tin nhắn (khách bên phải, nhân viên bên trái), ô trả lời ở đáy.

## Thay đổi responsive chung

| Thành phần | <768 px | ≥768 px |
|---|---|---|
| Điều hướng | Bottom nav | Header |
| Bộ lọc | Sheet đáy toàn màn | Cột trái 280 px |
| Lưới thẻ | 1 cột | 2 cột (768) / 3 cột (≥1024) |
| Action chi tiết | Bar sticky đáy | Cột phải sticky |
| Dialog | Sheet đáy | Dialog giữa màn |
| So sánh | Hàng tiêu chí, ô chia ngang | Bảng |
