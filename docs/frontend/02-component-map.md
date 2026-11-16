# 02 — Component Map (PHASE 2)

Nguyên tắc (`vercel-composition-patterns`):
- **Không dùng boolean prop để đổi hành vi** (`architecture-avoid-boolean-props`). Ví dụ: không làm `<PlaceCard compact showSave showCompare />`; dùng compound `PlaceCard.*` và tự ghép phần cần.
- **Explicit variants** (`patterns-explicit-variants`): `VisitReminderInline` và `VisitReminderBanner` là hai component riêng, không phải `<VisitReminder variant=…>` với logic rẽ nhánh lớn.
- **Provider giữ state, UI không biết cách lưu** (`state-decouple-implementation`, `state-context-interface`): `AuthProvider`, `CompareProvider` expose `{ state, actions, meta }`.
- **children thay cho renderX** (`patterns-children-over-render-props`).
- **React 19:** không dùng `forwardRef` (ref là prop thường); đọc context bằng `use()` (`react19-no-forwardref`).
- **Không trừu tượng sớm** (DEVELOPMENT.md): một component chỉ đưa lên `components/` khi có chỗ dùng thứ hai. Cột “Vị trí” bên dưới là dự kiến; nếu thực tế chỉ một màn dùng thì giữ trong file page.

## 1. Cây tổng thể

```
<Providers>                       app/providers.tsx
  QueryClientProvider
  AuthProvider                    state: status,user,roles · actions: signIn,signOut · meta: isLoading
  CompareProvider                 state: ids (≤3) · actions: add,remove,clear · meta: isFull
  ToastProvider
  <RouterProvider>
    AppLayout                     header (logo, nav desktop, NotificationBell, AccountMenu) · bottom nav mobile · MockDataBanner (dev)
      <Outlet/> → pages S-01…S-21 (lazy)
      CompareTray                 nổi đáy màn khi có ≥1 id (trên bottom nav ở mobile)
    MinimalLayout                 logo + nội dung; dùng cho /login, /invite/:token
    AdminLayout (F2)              RequireRole → sidebar lọc theo vai trò
    RouteErrorBoundary            errorElement: 404 / lỗi chung có traceId
```

## 2. Shared UI (`components/ui/`)

| Component | API (rút gọn) | Ghi chú a11y / hành vi |
|---|---|---|
| `Button` | `variant: 'primary'\|'secondary'\|'ghost'\|'danger'`, `pending` | `pending` → `aria-busy`, disabled, giữ kích thước (NFR-08) |
| `IconButton` | `label` bắt buộc | `aria-label` |
| `Field` (compound) | `Field.Root/Label/Control/Hint/Error` | Tự nối `id`, `aria-describedby`, `aria-invalid`; Error có `role="alert"` |
| `TextInput`, `TextArea`, `Select`, `DateTimeInput`, `FileInput` | dùng trong `Field.Control` | `DateTimeInput` hiển thị và nhập theo giờ VN, xuất ISO có offset `+07:00` |
| `ChipGroup` (compound) | `ChipGroup.Root (mode: 'any'\|'all')`, `ChipGroup.Item` | Dùng cho bộ lọc nhãn; hiển thị quy tắc “ít nhất một” / “phải đủ” (SRC §3.3); role checkbox |
| `Dialog` (compound) | `Dialog.Root/Trigger/Content/Title/Footer` | Dùng `<dialog>` native: focus trap, Esc đóng, trả focus về trigger |
| `ConfirmDialog` | `title, description, confirmLabel, tone` | Cho thao tác không đảo ngược: xóa danh sách, hủy kế hoạch, thu hồi link, xóa tài khoản |
| `Sheet` | `side: 'bottom'\|'right'` | Bộ lọc mobile; footer cố định: Áp dụng / Xóa bộ lọc |
| `Tabs` | compound | Buổi hẹn: Sắp tới / Đã qua / Đã hủy; tab đang chọn lưu trên URL |
| `StateView` (explicit variants) | `LoadingState`, `EmptyState`, `ErrorState (problem, onRetry)` | ErrorState hiện `traceId` khi có (NFR-11) |
| `Skeleton` | — | Giữ chỗ cho thẻ/chi tiết, tránh CLS |
| `Toast` | `toast.success/error` | `role="status"`/`alert`; không dùng toast thay cho lỗi theo trường |
| `Pagination` | `page, totalPages` | Gắn với URL |
| `UnknownValue` | `children` | Render “Chưa có thông tin” thống nhất (RULE-04) |
| `MockDataBanner` | — | Chỉ khi `VITE_API_MOCK=1` (RULE-28) |
| `CopyField` | `value, label` | Sao chép link mời; báo “Đã sao chép” qua `aria-live` |

## 3. Domain components

### Place (`components/place/`)

| Component | Thành phần | Dùng ở |
|---|---|---|
| `PlaceCard` (compound) | `PlaceCard.Root(place)`, `.Media`, `.Title`, `.Meta` (khu vực, khoảng cách “ước tính”), `.Price`, `.Tags` (≤3), `.Actions` (children) | S-02, S-03, S-08, S-09, S-11, S-12, S-13 |
| `SaveButton` | mở `SaveToListDialog`; chưa đăng nhập → login + intent | PlaceCard.Actions, S-04 |
| `CompareToggle` | đọc/ghi `CompareProvider`; khi đầy → thông báo tối đa 3 | PlaceCard.Actions, S-04 |
| `PriceText` | `price: Schemas['Price']` → “300.000 ₫ / 2 người” hoặc `UnknownValue`; kèm “gồm …” nếu có | Mọi nơi hiện giá |
| `HoursText` / `HoursTable` | `OpeningHours` → hôm nay + bảng tuần + ngoại lệ; UNKNOWN → `UnknownValue`. **Không** tự suy “đang mở” | S-04, S-05 |
| `PlaceDetail` sections | `Gallery`, `PriceSection`, `ExperienceSection`, `AmenitySection`, `HoursAddressSection`, `NotesSection`, `VerifiedAt`. Thứ tự cố định theo FR-05 | S-04 |
| `PlaceActionBar` | Gọi, Chỉ đường, Lưu, So sánh, Lên kế hoạch, Báo sai; sticky đáy trên mobile | S-04 |
| `ReportPlaceDialog` | lý do (radio), mô tả, ảnh | S-04 |
| `VisitCount` | “Đã đi X lần”; ẩn khi null/0 (A-10) | S-04, S-15 — chờ CCR-01 |
| `FilterPanel` (compound) | `.Area`, `.Location`, `.Budget`, `.DateTime`, `.TagGroup(group)`, `.Actions`. Desktop đặt trong cột trái; mobile đặt trong `Sheet` (cùng children, khác container) | S-03 |
| `SortSelect`, `ViewToggle`, `ActiveFilterChips` | — | S-03 |
| `MapView` | interface `{ places, onSelect }`; F1 là placeholder có thông báo; lỗi → quay về danh sách | S-03 (D-06) |
| `CompareTray` | danh sách id, nút “So sánh (n/3)” | AppLayout |
| `CompareTable` / `CompareCards` | explicit variants desktop/mobile, cùng nguồn hàng tiêu chí | S-05 |

### Saved (`pages/saved/*`, chỉ đưa lên components khi dùng lại)

`SavedListRow`, `ListNameDialog` (tạo/đổi tên), `SaveToListDialog` (chọn hoặc tạo danh sách; PUT idempotent).

### Choice (`components/choice/`)

| Component | Mô tả |
|---|---|
| `PlacePicker` | chọn 2–5 nơi từ một danh sách; đếm và báo lỗi theo RULE-08 |
| `ShareLinkPanel` | `CopyField` + nút chia sẻ (Web Share API nếu có) + **cảnh báo bắt buộc** “Ai có liên kết hợp lệ đều xem được và có thể tham gia” + hạn link (`expiresAt`) |
| `InvitePreview` | tên người mời, số lựa chọn, (nơi, khi có CCR-03), trạng thái suất |
| `JoinForm` | tên hiển thị (1–50 ký tự theo contract) |
| `VoteCard` | `PlaceCard` + nhóm nút **Thích / Bỏ qua** (radio, `aria-pressed`); trạng thái “Chưa trả lời” hiển thị riêng, không mặc định chọn |
| `VoteProgress` | “Bạn đã trả lời x/n” |
| `MatchList` | các nơi `mutualLike`; trống → gợi ý |
| `FinalizeForm` | chọn nơi + `DateTimeInput` + ghi chú; chỉ hiện với `viewerRole=CREATOR` |
| `SharingManager` | link hiện tại (status/expires), Thu hồi (Confirm), Cấp link mới, Loại người nhận |
| `SessionStatusBadge` | WAITING / VOTING / FINALIZED, tên hiển thị chờ PO duyệt (SRS §7.3 ghi DER/PROP) |

### Plan (`components/plan/`)

| Component | Mô tả |
|---|---|
| `PlanForm` | dùng chung cho tạo/sửa (S-14, S-15 edit, FinalizeForm); hiển thị `warnings` (HOURS_UNKNOWN) và lỗi 409 giờ đóng |
| `NotReservedNotice` | câu cố định “Kế hoạch này chưa giữ chỗ tại địa điểm” |
| `PlanCard`, `PlanStatusBadge` | Đã lên lịch / Đã hủy / Đã qua giờ |
| `PlanActions` | Sửa, Hủy (Confirm), Chỉ đường, Thêm vào lịch (.ics), chỉ cho OWNER |
| `VisitReminderBanner` | thẻ inline không chặn (A-08) trên S-01/S-13: “Đi chưa?” + **Đã đi** + **Bỏ qua lời nhắc**. Không modal, không popup tiếp theo |
| `VisitReminderInline` | phiên bản trong S-15 |
| `ReadOnlyPlanView` | cho NN: không có nút sửa/hủy, không có số lần đã đi |

Cả hai component lời nhắc dùng chung hook `useVisitReminder(planId)` (state + actions). Component chỉ lo phần trình bày, đúng `state-lift-state`.

### Account / Support / Notifications

`LoginEmailStep`, `LoginCodeStep` (đếm ngược gửi lại theo `Retry-After`), `ProfileForm`, `ChangeEmailDialog`, `DeleteAccountDialog`, `NotificationBell` (badge `unreadCount`), `NotificationItem`, `TicketForm`, `TicketThread` (chỉ tin PUBLIC), `TicketStatusBadge`.

### Guards / infra

`RequireAuth`, `RequireRole` (F2), `RouteErrorBoundary`, `ScrollRestoration` (của React Router), `SkipToContent`.

## 4. Reuse vs giữ riêng

| Quyết định | Lý do |
|---|---|
| `PlaceCard` compound **dùng chung** | 7 màn dùng; khác nhau ở phần Actions, nên ghép bằng children |
| `PlanForm` **dùng chung** cho tạo/sửa/chốt | Cùng validation RULE-05/13 và cùng cách xử lý lỗi 409/warnings |
| `FilterPanel` **một bản**, đổi container desktop/mobile | Tránh lệch logic giữa hai giao diện |
| `CompareTable`/`CompareCards` **hai variant** | Cấu trúc DOM khác hẳn (bảng vs thẻ); chung một nguồn định nghĩa hàng tiêu chí |
| Component admin **riêng** trong `pages/admin/` | Mật độ thông tin và layout khác; chưa thấy chỗ dùng chung với web khách ngoài `ui/` |
| Form auth, ticket **giữ trong page** | Chỉ dùng một chỗ |

## 5. Ánh xạ component → requirement (rút gọn)

| Component | FR / RULE / AC |
|---|---|
| UnknownValue, PriceText, HoursText | RULE-04, AC-003, AC-006 |
| FilterPanel, ChipGroup | FR-03, RULE-02, AC-001 |
| CompareProvider, CompareTray | FR-06, RULE-06, AC-005 |
| SaveToListDialog | FR-09, RULE-07, AC-011 |
| ShareLinkPanel | FR-10, AC-013 |
| InvitePreview, JoinForm | FR-11, RULE-30, AC-015/016/055/056 |
| VoteCard, MatchList | FR-12, RULE-10, AC-017/018 |
| FinalizeForm | FR-13, RULE-11, AC-019/020 |
| SharingManager | FR-14, AC-021/022 |
| PlanForm, NotReservedNotice | FR-15, RULE-05/13, AC-023/024 |
| PlanActions, ReadOnlyPlanView | FR-16/17, RULE-14, AC-025/026 |
| VisitReminderBanner/Inline | FR-18, RULE-15, AC-027/028/057/058 |
| VisitCount | FR-35, RULE-29, AC-053/054 |
| ReportPlaceDialog | FR-19, AC-029/030 |
| TicketThread | FR-20, RULE-19, AC-031/032 |
| NotificationBell/Item | FR-21, AC-033/034 |
| RequireAuth, RouteErrorBoundary | FR-22, NFR-04 |
