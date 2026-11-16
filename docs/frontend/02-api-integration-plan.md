# 02 — API Integration Plan (PHASE 2)

**Contract:** `gowithbae-be/api/openapi.yaml` v0.1.0 (nguồn ghi SRS v1.0). **Client:** `openapi-fetch`, kiểu từ `src/api/schema.d.ts` (`npm run gen:api`). Base URL `/api/v1`, dev proxy tới `localhost:8080`.
**Trạng thái backend (đọc code 16-11-2026):** ✅ chạy thật · 🟡 chạy một phần · ⛔ trả 501 (chưa implement) · ❌ chưa có trong contract (CCR).

## 1. Quy ước chung

| Chủ đề | Cách làm |
|---|---|
| Gọi API | Chỉ qua `api.GET/POST/PUT/PATCH/DELETE` có kiểu; bọc trong hook TanStack Query ở `src/hooks/` |
| Lỗi | Body `application/problem+json` → `Schemas['Problem']` (`title, status, detail, code, traceId, errors[]`). Helper `toProblem()` chuẩn hóa cả lỗi mạng (`status: 0`, “Không kết nối được máy chủ”) |
| Map status → UI | 400: lỗi dưới từng trường, giữ input · 401: `/login?returnTo` · 404: “Không tìm thấy” (không lộ tồn tại) · 409: theo `code` (bảng §4) · 410: “Liên kết không còn hiệu lực” · 429: đọc `Retry-After`, báo thời gian · 501: chỉ gặp khi dev → MSW che, nếu lọt thì hiện “Tính năng đang được phát triển” |
| Idempotency | Operation có tham số `IdempotencyKey` (`createChoiceSession`, `finalizeChoiceSession`, `createDatePlan`): tạo `crypto.randomUUID()` **một lần cho mỗi lần submit form**, dùng lại khi retry cùng form. Tạo key mới khi người dùng sửa dữ liệu |
| Xác thực | Header tự gắn bởi middleware hiện có. Thêm middleware `onResponse`: 401 trên request có bearer → xóa token và `queryClient.clear()` |
| Thời gian | Gửi ISO-8601 offset `+07:00`; hiển thị `Asia/Ho_Chi_Minh` |
| Retry | GET: tối đa 2 lần, không retry 4xx. Mutation: không retry tự động; với lỗi mạng chưa rõ kết quả thì refetch trạng thái rồi mới cho bấm lại (UC EX-03) |
| Dữ liệu minh họa | MSW handler cho operation ⛔/❌ khi `VITE_API_MOCK=1`; fixture `satisfies Schemas[...]`; banner “Dữ liệu minh họa” |

## 2. Theo màn hình (F1)

| Screen | Operation | Trạng thái BE | Loading | Empty | Error đặc thù | Auth |
|---|---|---|---|---|---|---|
| S-01 | `listCollections`, `listTaxonomies`, `listAreas` | ⛔ ⛔ ⛔ | Skeleton rail | “Chưa có bộ sưu tập” → vẫn có ô tìm | — | Không |
| S-01/S-13/S-15 | Lời nhắc đến hạn, dismiss | ❌ CCR-02 | — | Không hiện thẻ | — | Bearer |
| S-02 | `getCollection` | ⛔ | Skeleton lưới | “Bộ sưu tập chưa có địa điểm” | 404 | Không |
| S-03 | `searchPlaces` | 🟡 `q`, `areaId`, `budget`, `sort=DEFAULT\|PRICE_ASC`, phân trang. `tagIds`/`at`/`lat,lng,radiusKm`/`NEAREST` → **501** | Skeleton thẻ, giữ bộ lọc | 0 kết quả: giữ điều kiện + gợi ý bỏ bớt (không tự nới) | 400 tham số; 501 khi dùng bộ lọc chưa có → báo trong dev | Không |
| S-04 | `getPlace`; `listSavedLists` (nếu đăng nhập); `myVisitCount` | ⛔ ⛔ ❌ CCR-01 | Skeleton chi tiết | — | 404 (ẩn/không tồn tại, AC-004) | Không / bearer |
| S-04 | `reportPlace` | ⛔ | Nút pending | — | 400 trường; 429 | Không bắt buộc |
| S-04, S-08 | `addPlaceToList` (PUT, idempotent), `removePlaceFromList` | ⛔ | Nút pending | — | 404 | Bearer |
| S-05 | `comparePlaces?ids=` | ⛔ | Skeleton cột | <2 id: không gọi API, hiện gợi ý | 400 (RULE-06), 404 một id → bỏ khỏi khay và báo | Không |
| S-06 | `requestOtp`, `verifyOtp` | ⛔ ⛔ | Nút pending | — | 202 luôn trả (không lộ email); 400/409 mã sai/hết hạn; 429 | Không |
| S-07/08 | `listSavedLists`, `createSavedList`, `getSavedList`, `renameSavedList`, `deleteSavedList` | ⛔ | Skeleton | “Chưa có danh sách nào” | 400 tên; 404 | Bearer |
| S-09 | `createChoiceSession` (+Idempotency-Key) | ⛔ | Nút pending | — | 400 (2–5 nơi, nơi không hợp lệ) | Bearer |
| S-10 | `previewShareGrant`, `joinShareGrant`; xem nơi trước khi join | ⛔ ⛔ ❌ CCR-03 | Skeleton | — | 410 hết hạn/thu hồi; 409 `SLOT_TAKEN`; 400 tên | **Không** |
| S-11/12 | `getChoiceSession`, `castVote`, `finalizeChoiceSession` (+Idem.), `createShareGrant`, `revokeShareGrant`, `removeRecipient` | ⛔ | Skeleton; vote optimistic + rollback | WAITING: “Chờ người ấy tham gia” + link | 404 mất quyền; 409 đã chốt (AC-018); 409 chốt lỗi → không báo thành công | Bearer hoặc `X-Recipient-Session` |
| S-13 | `listDatePlans?status`, `listMyChoiceSessions` | ⛔ ⛔ | Skeleton | CTA “Khám phá địa điểm” | — | Bearer |
| S-14 | `getPlace`, `createDatePlan` (+Idem.) | ⛔ | Nút pending | — | 409 giờ đóng/nơi ẩn; 400 quá khứ; 201 + `warnings` | Bearer |
| S-15 | `getDatePlan`, `updateDatePlan`, `cancelDatePlan`, `downloadDatePlanCalendar`, `reportVisit` | ⛔ | Skeleton | — | 404; 409 (sửa plan đã hủy/qua giờ, đổi sang nơi ẩn AC-026) | Bearer hoặc recipient (chỉ đọc) |
| S-16 | `getMe`, `updateMe`, `requestEmailChange`, `verifyEmailChange`, `requestAccountDeletion`, `logout`, `uploadFile` | ⛔ | — | — | 400; 409 email đã dùng; upload 413/415 (OQ-21) | Bearer |
| S-17 | `listNotifications`, `markNotificationRead` | ⛔ | Skeleton | “Chưa có thông báo” | 404 khi mở đối tượng | Bearer |
| S-18–20 | `listMyTickets`, `createTicket`, `getMyTicket`, `replyMyTicket`, `uploadFile` | ⛔ | Skeleton | “Chưa có yêu cầu” | 404 (AC-032); 409 trả lời ticket đã đóng (OQ-13) | Bearer |
| Toàn app | `trackEvents` (lô) | ⛔ | — | — | Lỗi analytics **không** ảnh hưởng UI; giữ hàng đợi trong bộ nhớ, gửi lại tối đa 1 lần | Không bắt buộc |

`reportVisit` nhận `answer: YES|NO`. UI F1 chỉ gửi `YES` từ nút “Đã đi”. “Bỏ qua lời nhắc” **không** gửi `NO` (CR-001, RULE-15); hành vi dismiss chờ CCR-02.

## 3. Analytics (FR-32)

`lib/analytics.ts`:
- `track(name, { objectId, properties })`: chỉ nhận tên trong enum contract. Tự gắn `eventId` (UUID), `occurredAt`, `sessionId` (đổi sau 30 phút không hoạt động, **PROP** §10.3), `anonymousId` (localStorage, khi chưa đăng nhập), `platform` (`WEB_MOBILE`/`WEB_DESKTOP` theo media query < 768 px).
- Gửi theo lô mỗi 5 s hoặc khi `visibilitychange=hidden` (`navigator.sendBeacon` nếu được).
- Whitelist `properties` theo từng event (OQ-20), ví dụ `search_submitted: { searchId, resultsCount }`. **Không** gửi `q` thô, token, ghi chú, tọa độ.

| Event | Điểm phát |
|---|---|
| `search_submitted`, `results_shown` | S-03 khi submit/áp dụng lọc thành công (dùng `searchId` từ response) |
| `place_viewed` | S-04 khi tải xong |
| `place_saved` | sau `addPlaceToList` 2xx, **trừ** khi nơi đã có sẵn trong danh sách (AC-011, cần BE phân biệt; tạm thời so sánh với cache) |
| `comparison_opened` | S-05 khi có ≥2 nơi |
| `invite_created` | sau `createChoiceSession` 201 |
| `vote_submitted` | sau `castVote` 204 |
| `date_plan_created` | sau `createDatePlan`/`finalizeChoiceSession` 201 |
| `visit_self_reported` | sau `reportVisit` 204 |
| `date_reminder_dismissed` | chờ CCR-04 |

## 4. Mã lỗi nghiệp vụ 409 (`Problem.code`)

Contract chỉ nêu ví dụ `RULE-06`, `SLOT_TAKEN`. FE map các giá trị biết trước sang câu chữ SRS §5.2. Với `code` không biết: hiện `detail` từ server, không tự đặt câu chữ.

| code (dự kiến) | Câu hiển thị |
|---|---|
| `SLOT_TAKEN` | “Lời mời này đã có người tham gia. Hãy liên hệ người mời để nhận liên kết mới.” |
| `RULE-06` | “Bạn chỉ có thể so sánh tối đa 3 địa điểm” |
| `RULE-08` | “Hãy chọn từ 2 đến 5 địa điểm” |
| `RULE-05` / giờ đóng | “Địa điểm đóng cửa vào thời gian bạn chọn” |
| `RULE-11` / đã chốt | “Phiên này đã được chốt, không thể đổi lựa chọn” |

**Yêu cầu BE:** công bố danh sách `code` cố định trong contract (enum hoặc bảng mô tả). Đề xuất gộp vào CCR-05.

## 5. Kế hoạch chuyển từ mock sang API thật

1. Mỗi handler MSW gắn `operationId`. Khi BE implement một operation, xóa handler hoặc chuyển sang `passthrough`, rồi chạy test và thử thủ công.
2. Contract đổi: `npm run gen:api` → `npm run build`. Lỗi kiểu chính là danh sách chỗ phải sửa (cả fixture lẫn component).
3. Khi `VITE_API_MOCK` không bật, ứng dụng gọi thẳng backend. Production build không chứa MSW.

## 6. Không làm

- Không tự khai báo kiểu cho dữ liệu API, không gọi `fetch` trực tiếp (trừ `sendBeacon` cho analytics, vẫn dùng kiểu `Schemas['AnalyticsEvent']`).
- Không kết nối Supabase.
- Không dựa vào ẩn nút làm kiểm soát quyền.
