# 03 — Sitemap & Information Architecture (PHASE 3)

**Vai trò:** Senior UX Architect · **Phạm vi:** F1 web khách (đã duyệt A-02). Admin F2 chỉ phác cấu trúc.
Không có nghiên cứu người dùng; mọi quyết định dựa trên SRS và heuristic, **chưa được kiểm chứng usability**.

## 1. Nhóm chức năng theo mục tiêu người dùng

| Mục tiêu người dùng | Chức năng | Nơi đặt |
|---|---|---|
| “Tìm chỗ đi hẹn hò” | Khám phá, tìm, lọc, bộ sưu tập, chi tiết, so sánh | Tab **Khám phá** |
| “Giữ lại những nơi ưng ý” | Danh sách đã lưu, bắt đầu mời cùng chọn | Tab **Đã lưu** |
| “Thống nhất với người ấy và lên lịch” | Phiên cùng chọn đang mở, kế hoạch, lời nhắc “Đi chưa?” | Tab **Buổi hẹn** |
| “Quản lý tài khoản, cần giúp đỡ” | Hồ sơ, thông báo, hỗ trợ, đăng xuất | Tab **Tài khoản** (+ chuông ở header) |
| “Được mời chọn” (người nhận) | Link mời → bỏ phiếu → kết quả | Luồng riêng, không cần tab, `MinimalLayout` |

Thay đổi so với SRS §8: **phiên cùng chọn đặt ở tab Buổi hẹn**. SRS không chỉ định chỗ cho danh sách phiên. Phiên cùng chọn là bước ngay trước kế hoạch nên đặt cạnh kế hoạch, thay vì ở Đã lưu. Điều hướng chính vẫn đúng 4 mục của SRS.

## 2. Sitemap F1

```
/ Khám phá (S-01) ─────────────── [thẻ lời nhắc "Đi chưa?" nếu có]
├── /search Kết quả (S-03) ─── ?q &areaId &budget &tagIds &at &lat/lng &sort &page &view
│   └── /places/:id Chi tiết (S-04) ── [dialog Báo sai] [dialog Lưu vào danh sách]
├── /collections/:id Bộ sưu tập (S-02) → /places/:id
└── /compare?ids= So sánh (S-05) ← khay so sánh nổi (mọi trang khách)

/saved Đã lưu (S-07) 🔒
└── /saved/:listId Danh sách (S-08) 🔒
    └── /choice/new?listId Tạo lời mời (S-09) 🔒

/plans Buổi hẹn (S-13) 🔒 ── tabs: Sắp tới · Đã qua · Đã hủy ── mục "Đang cùng chọn"
├── /plans/new?placeId Tạo kế hoạch (S-14) 🔒
├── /plans/:id Chi tiết buổi hẹn (S-15) 🔒/🔗 ── [thẻ "Đi chưa?"]
│   └── /plans/:id/edit 🔒 (chủ)
└── /choice/:sessionId Bỏ phiếu (S-11) 🔒/🔗
    └── /choice/:sessionId/results Kết quả & chốt (S-12) 🔒/🔗

/account Tài khoản (S-16) 🔒
├── /account/notifications Thông báo (S-17) 🔒 ← chuông header
└── /account/support Hỗ trợ (S-18) 🔒
    ├── /account/support/new (S-19) 🔒
    └── /account/support/:ticketId (S-20) 🔒

Ngoài điều hướng chính (MinimalLayout):
/login?returnTo&intent Đăng nhập (S-06)
/invite/:token Link mời (S-10) 🔗 noindex → /choice/:sessionId

* 404 / lỗi chung (S-21)
```
🔒 cần tài khoản · 🔗 cho phép phiên người nhận (không cần tài khoản).

## 3. Điều hướng

| Cấp | Desktop (≥768 px) | Mobile (<768 px) |
|---|---|---|
| Primary | Header: logo, 4 mục, chuông thông báo, avatar/“Đăng nhập” | Bottom nav 4 mục (biểu tượng + chữ); header gọn: logo + chuông |
| Secondary | Tabs trong trang (Buổi hẹn); breadcrumb ngắn ở trang sâu (Danh sách › tên) | Nút Quay lại ở header trang sâu; tabs cuộn ngang |
| Contextual | Khay so sánh nổi đáy; action bar trong chi tiết | Khay so sánh nằm trên bottom nav; action bar sticky đáy, thay chỗ bottom nav ở S-04/S-15 |
| Luồng người nhận | Không có nav chính; chỉ logo + nút “Đăng nhập” nhỏ (không bắt buộc) | Như desktop |

## 4. Giảm bước thao tác

| Hành trình | Số bước tối thiểu |
|---|---|
| Tìm → chi tiết | Khám phá: gõ từ khóa/chạm hoạt động (1) → kết quả → chạm thẻ (2) |
| Lên kế hoạch không qua cùng chọn | Chi tiết → “Lên kế hoạch” → chọn giờ → Lưu (3) |
| Mời cùng chọn | Danh sách → “Mời cùng chọn” → bỏ chọn bớt (mặc định chọn hết nếu 2–5 nơi) → Tạo → Sao chép link (3–4) |
| Người nhận | Mở link → nhập tên → Tham gia → Thích/Bỏ qua từng nơi |
| Trả lời “Đi chưa?” | Mở web → 1 chạm trên thẻ nhắc |

## 5. Admin F2 (chỉ cấu trúc)

```
/admin Hàng chờ duyệt
├── Địa điểm: /admin/places, /new, /:id ── Nhập CSV: /admin/imports, /:batchId
├── Danh mục & khu vực: /admin/taxonomies
├── Bộ sưu tập: /admin/collections, /:id
├── Báo sai: /admin/place-reports, /:id ── Hỗ trợ: /admin/tickets, /:id
├── Báo cáo: /admin/reports
└── (SUPER_ADMIN) Tài khoản: /admin/users ── Nhật ký: /admin/audit
```
Sidebar lọc theo vai trò. Chi tiết làm khi OQ-15/18/19/20 được chốt.
