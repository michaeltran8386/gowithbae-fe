# 02 — Screen Inventory (PHASE 2)

Mã **Mock** theo `src/router.tsx` (C01–C08 = mock Stitch, A01–A06 = SRS). Mã **UI** theo SRS §8. **Route** giữ route đang có; route mới đánh dấu ➕, route đổi đánh dấu ✎.
UI states chung cho mọi màn có dữ liệu: **Loading · Empty · Error+Retry** (SRS §8). Cột “States” chỉ ghi các trạng thái đặc thù.
Actor: K khách · TV thành viên · NN người nhận link · NS nhân sự.

## 1. Web khách (F1)

| ID | Tên | Route | Mock/UI | Actor | Req | Mục tiêu | Dữ liệu (operation) | Tương tác chính | Quyền | States đặc thù | Phụ thuộc |
|---|---|---|---|---|---|---|---|---|---|---|---|
| S-01 | Khám phá | `/` | C01/UI01 | K, TV | FR-01, FR-18 | Bắt đầu tìm nhanh | `listCollections`, `listTaxonomies` (ACTIVITY), `listAreas`; TV: lời nhắc đến hạn (CCR-02) | Ô tìm, chọn khu vực/ngân sách/hoạt động → S-03; mở bộ sưu tập → S-02; thẻ lời nhắc Đã đi/Bỏ qua lời nhắc | Công khai; lời nhắc chỉ TV | Không có bộ sưu tập đang hiển thị; lời nhắc | CCR-02, OQ-01 |
| S-02 | Bộ sưu tập ➕ | `/collections/:collectionId` | C01/UI01 | K, TV | FR-01, FR-26 | Xem nơi trong bộ sưu tập | `getCollection` | Thẻ địa điểm, Lưu, So sánh | Công khai | Hết lịch hiển thị → 404; nơi ẩn không xuất hiện (AC-042) | — |
| S-03 | Kết quả | `/search?q&areaId&budget&tagIds&at&lat&lng&radiusKm&sort&page&view` | C02/UI02 | K, TV | FR-02–04, FR-06 | Lọc, sắp xếp, chọn nơi | `searchPlaces`, `listTaxonomies`, `listAreas` | Tìm (submit/debounce), bộ lọc (desktop: cột; mobile: sheet + Áp dụng/Xóa bộ lọc), sắp xếp, danh sách/bản đồ, phân trang, thêm so sánh, Lưu | Công khai; Lưu cần đăng nhập | 0 kết quả giữ điều kiện, gợi ý bỏ bớt; từ chối vị trí → nhập khu vực; bản đồ lỗi → danh sách (AC-002); 501 bộ lọc chưa có (dev) | OQ-03/04/05, D-06 |
| S-04 | Chi tiết địa điểm | `/places/:placeId` | C03/UI03 | K, TV | FR-05, FR-06, FR-09, FR-15, FR-19, FR-35 | Quyết định nơi | `getPlace`; TV: `listSavedLists`; `myVisitCount` (CCR-01) | Gọi, chỉ đường, Lưu (chọn danh sách), So sánh, Lên kế hoạch → S-14, Báo sai (dialog) | Công khai; hành động cá nhân cần đăng nhập | Trường null = “Chưa có thông tin”; nơi ẩn/không tồn tại → 404 (AC-004); “Đã đi X lần” chỉ TV, ẩn khi 0 | CCR-01, OQ-11 |
| S-05 | So sánh | `/compare?ids=a,b,c` | C04/UI04 | K, TV | FR-06 | So sánh 2–3 nơi | `comparePlaces` | Bỏ một nơi, thêm nơi (về S-03), chọn → S-14 | Công khai | 1 nơi: gợi ý thêm; thêm nơi thứ 4: “Bạn chỉ có thể so sánh tối đa 3 địa điểm” (AC-005); thiếu trường ≠ “Không có” (AC-006); mobile: thẻ theo tiêu chí | Khay so sánh (localStorage) |
| S-06 | Đăng nhập | `/login?returnTo&intent` | UI08 | K | FR-07 | Lấy phiên | `requestOtp`, `verifyOtp` | Email → mã → quay lại `returnTo` + intent | Công khai | 429 (Retry-After, đếm ngược gửi lại); mã sai/hết hạn/đã dùng (AC-008) | OQ-06 |
| S-07 | Đã lưu | `/saved` | C05/UI05 | TV | FR-09 | Quản lý danh sách | `listSavedLists`, `createSavedList` | Tạo, đổi tên, xóa (xác nhận); mở danh sách | Đăng nhập | Chưa có danh sách | — |
| S-08 | Chi tiết danh sách ➕ | `/saved/:listId` | C05/UI05 | TV | FR-09, FR-10 | Xem/bỏ nơi; bắt đầu mời cùng chọn | `getSavedList`, `removePlaceFromList`, `renameSavedList`, `deleteSavedList` | Bỏ nơi; “Mời người ấy cùng chọn” → S-09 | Chủ sở hữu | Nơi ẩn: tên + cảnh báo, không chọn được; danh sách trống | OQ-11 |
| S-09 | Tạo lời mời ➕ | `/choice/new?listId` | C05→C06 | TV | FR-10 | Tạo phiên + link | `createChoiceSession` (Idempotency-Key) | Chọn 2–5 nơi → tạo → panel link (sao chép/chia sẻ) + cảnh báo ai có link đều xem được | Đăng nhập | <2 hoặc >5: “Hãy chọn từ 2 đến 5 địa điểm” (AC-014); `inviteToken` chỉ trả một lần, cảnh báo trước khi rời trang | OQ-07/11 |
| S-10 | Link mời | `/invite/:inviteToken` | C06/UI06 | NN (K hoặc TV) | FR-11 | Xem và tham gia không cần tài khoản | `previewShareGrant`, `joinShareGrant`; xem nơi trước khi join (CCR-03) | Xem; nhập tên → Tham gia → S-11 | **Không cần đăng nhập** (CR-001) | 410: “Liên kết không còn hiệu lực”; 409 `SLOT_TAKEN`: suất đã có người, liên hệ người mời; đã có phiên người nhận → vào thẳng S-11 | CCR-03, OQ-07/09 |
| S-11 | Bỏ phiếu cùng chọn | `/choice/:sessionId` | C06/UI06 | TV (chủ tạo), NN | FR-12, FR-14 | Thích/Bỏ qua từng nơi | `getChoiceSession`, `castVote`; chủ tạo: `createShareGrant`, `revokeShareGrant`, `removeRecipient` | Thích/Bỏ qua (sửa được), xem kết quả → S-12; chủ tạo: quản lý link (thu hồi có xác nhận, cấp link mới) | Chủ tạo hoặc NN còn quyền | Chưa trả lời ≠ Bỏ qua; WAITING (chưa có người nhận); FINALIZED → chỉ xem; quyền bị thu hồi → 404/410 (AC-018/021) | OQ-07/08/09 |
| S-12 | Hai người cùng thích + chốt | `/choice/:sessionId/results` | C07/UI06 | TV (chủ tạo), NN | FR-12, FR-13 | Thấy nơi trùng; chủ tạo chốt | `getChoiceSession`, `finalizeChoiceSession` (Idempotency-Key) | Chủ tạo: chọn nơi + ngày giờ + ghi chú → chốt → S-15 | Chốt: chỉ chủ tạo | Không có nơi trùng → gợi ý chọn lại/tạo phiên mới; chốt lỗi → không báo thành công (AC-020); nơi không còn `available` | OQ-08 |
| S-13 | Buổi hẹn | `/plans?status` | UI07 | TV | FR-15, FR-16, FR-18, FR-10 | Xem kế hoạch và phiên đang cùng chọn | `listDatePlans`, `listMyChoiceSessions`; lời nhắc (CCR-02) | Tab Sắp tới/Đã qua/Đã hủy; mục “Đang cùng chọn”; thẻ lời nhắc | Đăng nhập | Chưa có kế hoạch → CTA khám phá | CCR-02, OQ-10 |
| S-14 | Tạo kế hoạch ➕ | `/plans/new?placeId` | UI07 | TV | FR-15 | Lên lịch một nơi | `getPlace`, `createDatePlan` (Idempotency-Key) | Chọn ngày giờ (giờ VN), ghi chú → lưu → S-15 | Đăng nhập | 409 giờ đóng: “Địa điểm đóng cửa vào thời gian bạn chọn” (AC-024); `warnings: HOURS_UNKNOWN` → cảnh báo, không chặn; thời điểm quá khứ | OQ-04/11 |
| S-15 | Chi tiết buổi hẹn | `/plans/:planId` (sửa: `/plans/:planId/edit` ➕) | C08/UI07 | TV (chủ), NN (chỉ xem) | FR-16, FR-17, FR-18, FR-35 | Xem/sửa/hủy, chỉ đường, lịch, trả lời “Đi chưa?” | `getDatePlan`, `updateDatePlan`, `cancelDatePlan`, `downloadDatePlanCalendar`, `reportVisit`; CCR-01/02 | Sửa, Hủy (xác nhận), Chỉ đường, Thêm vào lịch (.ics), Đã đi / Bỏ qua lời nhắc | Chủ: sửa/hủy; NN: chỉ xem | Luôn hiện “Kế hoạch này chưa giữ chỗ tại địa điểm”; CANCELLED không nhắc; nơi `placeAvailable=false` → cảnh báo; NN không thấy số lần đã đi | CCR-01/02, OQ-09/10/12 |
| S-16 | Tài khoản | `/account` | UI08 | TV | FR-08 | Hồ sơ | `getMe`, `updateMe`, `requestEmailChange`, `verifyEmailChange`, `requestAccountDeletion`, `logout`, `uploadFile` | Sửa tên/ảnh, đổi email (xác minh), xóa tài khoản (xác nhận 2 bước), đăng xuất | Đăng nhập | Email mới chưa xác minh → email cũ giữ nguyên (AC-009); sau yêu cầu xóa → đăng xuất, ghi “đã nhận yêu cầu” | OQ-06/17/21 |
| S-17 | Thông báo ➕ | `/account/notifications` | UI08 | TV | FR-21 | Xem thông báo | `listNotifications`, `markNotificationRead` | Mở thông báo → đối tượng (kiểm tra quyền lại) | Đăng nhập | Thông báo về đối tượng đã thu hồi → 404 (AC-033) | OQ-14 |
| S-18 | Hỗ trợ ➕ | `/account/support` | UI08 | TV | FR-20 | Danh sách yêu cầu | `listMyTickets` | Mở, tạo mới | Đăng nhập | — | — |
| S-19 | Gửi hỗ trợ ➕ | `/account/support/new` | UI08 | TV | FR-20 | Tạo yêu cầu | `createTicket`, `uploadFile` | Nhóm, chủ đề, nội dung, tệp | Đăng nhập | Tệp sai loại/kích thước (OQ-21) | OQ-21 |
| S-20 | Chi tiết hỗ trợ ➕ | `/account/support/:ticketId` | UI08 | TV | FR-20 | Theo dõi, bổ sung | `getMyTicket`, `replyMyTicket` | Trả lời khi WAITING_CUSTOMER / IN_PROGRESS | Chủ ticket | CLOSED: ẩn ô trả lời (OQ-13); ticket người khác → 404 (AC-032) | OQ-13 |
| — | Báo sai (dialog trên S-04) | — | UI03 | K, TV | FR-19 | Gửi báo sai | `reportPlace`, `uploadFile` | Lý do, mô tả, ảnh | Công khai | 429; xác nhận có mã | OQ-21 |
| S-21 | 404 / lỗi chung | `*`, errorElement | — | Tất cả | FR-22 | Không lộ tài nguyên | — | Về trang chủ | — | 404, lỗi không mong đợi (có `traceId`) | — |

## 2. Quản trị (F2, chưa lên lịch, chờ OQ-15/18/19/20)

| ID | Tên | Route | Mock | Req | Operation chính | Ghi chú |
|---|---|---|---|---|---|---|
| S-A01 | Hàng chờ duyệt | `/admin` | A01 | FR-24 | `adminListPlaces?status=PENDING`, `adminTransitionPlace` | |
| S-A02 | Danh sách địa điểm ➕ | `/admin/places` | A01 | FR-23 | `adminListPlaces` | |
| S-A03 | Biên tập địa điểm | `/admin/places/:placeId`, `/admin/places/new` ➕ | A01 | FR-23 | `adminGetPlace`, `adminCreatePlace`, `adminUpdatePlace`, images | OQ-15 |
| S-A04 | Nhập CSV | `/admin/imports`, `/admin/imports/:batchId` ➕ | A01 | FR-30 | template, validate, get, commit | OQ-19 |
| S-A05 | Danh mục & khu vực | `/admin/taxonomies` | A02 | FR-25 | admin taxonomies/areas | |
| S-A06 | Bộ sưu tập | `/admin/collections`, `/admin/collections/:id` ➕ | A03 | FR-26 | admin collections | OQ-18 |
| S-A07 | Tài khoản & vai trò | `/admin/users` | A04 | FR-27 | users, lock/unlock, roles | Chỉ SUPER_ADMIN |
| S-A08 | Nhật ký | `/admin/audit` | A04 | FR-31 | `adminListAuditLogs` | Chỉ đọc |
| S-A09 | Báo sai ✎ | `/admin/place-reports`, `/:reportId` | A05 | FR-28 | place-reports | Tách khỏi route `/admin/tickets` hiện tại |
| S-A10 | Hỗ trợ | `/admin/tickets`, `/admin/tickets/:ticketId` ➕ | A05 | FR-29 | admin support | public/internal |
| S-A11 | Báo cáo | `/admin/reports` | A06 | FR-33–34 | summary, export.csv | OQ-20 |

## 3. Thay đổi so với `router.tsx` hiện tại

- **Thêm:** `/collections/:collectionId`, `/saved/:listId`, `/choice/new`, `/plans/new`, `/plans/:planId/edit`, `/account/notifications`, `/account/support`, `/account/support/new`, `/account/support/:ticketId`; admin: `/admin/places`, `/admin/places/new`, `/admin/imports/:batchId`, `/admin/collections/:id`, `/admin/place-reports(/:id)`, `/admin/tickets/:ticketId`.
- **Layout:** `/login` và `/invite/:token` dùng `MinimalLayout`, không có bottom nav, để người nhận link tập trung vào việc tham gia.
- **Giữ nguyên** route hiện có để không phá link đã chia sẻ.
