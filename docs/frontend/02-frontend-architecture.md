# 02 — Frontend Architecture (PHASE 2)

**Ngày:** 16-11-2026 · **Vai trò:** Senior Frontend Architect + Tech Lead
**Đầu vào đã duyệt (Gate 1):** A-01 React + TS + Vite + React Router · A-02 F1 làm trước (web khách), F2 quản trị sau · A-03 contract-first, mock khi backend chưa có (đã điều chỉnh, xem §0)
**Skill áp dụng:** `vercel-composition-patterns` (cấu trúc component, state); `vercel-react-best-practices` cho phần hiệu năng (§5)

## 0. Thay đổi so với Phase 1 (impact analysis)

Repo `gowithbae-fe` (nhánh `dev`, commit `cb23d8f`) và repo `gowithbae-be` (commit `893e343`) đã được clone vào `D:\go_with_bae\web` và `D:\go_with_bae\gowithbae-be`. Hai repo đặt cạnh nhau, đúng yêu cầu của `npm run gen:api`.

| Giả định Phase 1 | Thực tế | Tác động |
|---|---|---|
| Chưa có codebase | Đã có khung: React 19.3, Vite 8.3, TS 7.0, Tailwind 4.3, React Router 8.5, openapi-fetch 0.17. Đã có route C01–C08/A01–A06, layout, `SearchPage` gọi API thật | **Giữ nguyên** stack và convention. Không dựng lại |
| Chưa có API contract → mock adapter tự định nghĩa kiểu | **Đã có `api/openapi.yaml`** (OpenAPI 3.0, 70+ operation) và `src/api/schema.d.ts` sinh tự động | A-03 đổi thành: **kiểu luôn lấy từ contract**. Mock chỉ là *dữ liệu trả về* đúng kiểu `Schemas[...]` cho endpoint backend còn trả 501. Không tự viết kiểu API |
| Chưa có backend | Spring Boot 4.1 + Supabase Postgres. **Chỉ `GET /places` chạy thật**, và chỉ với `q`, `areaId`, `budget`, `sort=DEFAULT/PRICE_ASC`. Mọi operation khác trả 501 | Dev cần lớp mock theo endpoint (§4.3) |
| Chưa có thiết kế | README nhắc tới mock Stitch `srs/GoWithBae_UI_Review_v1` (HTML + PNG, mã C01–C08). Token màu/font trong `src/index.css` lấy từ mock này | **Mock không có trong cả hai repo lẫn workspace.** Cần bạn cung cấp trước Phase 4 (§7, Q-P2-03) |
| Contract theo SRS v1.1 | **Contract ghi nguồn là SRS v1.0** | Thiếu 3 nội dung CR-001 (§3, CCR-01 đến CCR-03) |

Baseline đo ngày 16-11: `npm ci` OK · `npm run build` (gồm `tsc -b`) **pass** · `npm run lint` (oxlint) **0 lỗi** · bundle JS 329,5 kB (gzip 104,2 kB), mới có 2 page.

## 1. Existing Codebase Audit

| Hạng mục | Hiện trạng | Quyết định |
|---|---|---|
| Framework/build | Vite SPA, `createBrowserRouter`, proxy `/api` → `localhost:8080` | **Giữ** |
| Routing | `src/router.tsx`, một bảng route, comment mã màn + FR | **Giữ, mở rộng**: thêm route còn thiếu, `lazy` theo route, error/404 element, guard |
| Layout | `AppLayout` (header desktop + bottom nav mobile 4 mục), `AdminLayout` (sidebar) | **Giữ, mở rộng**: badge thông báo, vùng lời nhắc, skip-link; AdminLayout thêm guard vai trò |
| API client | `api` (openapi-fetch), middleware gắn `Authorization` + `X-Recipient-Session` từ localStorage | **Giữ**. Bổ sung middleware xử lý 401 và gắn `Idempotency-Key` theo từng request |
| Phiên | Token để trong localStorage, code đánh dấu `shortcut:` chờ OQ-06 | **Giữ tạm**; ghi rủi ro XSS ở §6. Bọc bằng `AuthProvider` |
| Style | Tailwind 4 `@theme`, token theo mock Stitch, font Be Vietnam Pro | **Giữ**; token cuối chốt ở Phase 4 (OQ-01) |
| Page | `SearchPage` (C02): fetch trong `useEffect`, bộ lọc trên URL. Còn lại là `Placeholder` | **Refactor** `SearchPage` sang hook server-state (§4.2), giữ hành vi URL. Lưu ý: hiện mỗi phím gõ đều gọi API → vi phạm FR-32 (“không đếm từng ký tự”) và tốn request. Sẽ đổi sang submit/debounce |
| Lint/format | oxlint (rules-of-hooks, only-export-components). Không có Prettier | **Giữ**; không thêm formatter nếu team chưa dùng |
| Test | Chưa có | **Thêm** Vitest + Testing Library (TECHSTACK §4 đã dự kiến “khi có màn hình thật đầu tiên”) |
| Convention (DEVELOPMENT.md) | Contract-first; `pages/` mỗi màn một file; tách `components/`, `hooks/` khi có chỗ thứ hai dùng; câu chữ bắt buộc theo SRS; tiền/giờ `vi-VN`/`Asia/Ho_Chi_Minh`; trạng thái trên URL | **Tuân thủ toàn bộ** |

## 2. Cấu trúc thư mục đề xuất

Mở rộng convention hiện có, **không** đổi sang feature-folder:

```
src/
  api/            client.ts, schema.d.ts (sinh), problem.ts (chuẩn hóa lỗi Problem)
  app/            providers.tsx (QueryClient, Auth, Toast), router.tsx (chuyển từ src/)
  layouts/        AppLayout, AdminLayout, MinimalLayout (trang link mời, login)
  pages/          mỗi màn một file; pages/admin/ cho F2
  components/
    ui/           primitive dùng chung: Button, Field, Dialog, Sheet, Toast, StateView…
    place/        PlaceCard, PriceText, HoursText, UnknownValue, VisitCount…
    choice/       VoteCard, MatchList, ShareLinkPanel…
    plan/         PlanForm, VisitReminder, PlanStatusBadge…
  hooks/          hook gọi API theo resource (usePlace, useSavedLists…), useAuth, useCompare
  lib/            format.ts (tiền, giờ VN), analytics.ts, idempotency.ts, storage.ts
  mocks/          (chỉ dev) MSW handlers + fixtures đúng kiểu Schemas
  test/           setup Vitest
```

Chỉ chuyển `router.tsx` vào `app/` khi bắt đầu M0. Thay đổi này nằm trong một commit riêng để dễ review.

## 3. Contract gap so với SRS v1.1 (CR-001)

Frontend **không tự bịa** field/endpoint (DEVELOPMENT.md §1, Global Rule 3). Các thiếu hụt dưới đây được ghi thành **Contract Change Request (CCR)** gửi backend/PO. UI tương ứng chỉ được làm sau khi `openapi.yaml` được cập nhật và chạy `gen:api`.

| CCR | Yêu cầu SRS v1.1 | Contract hiện tại | Đề xuất thay đổi contract (để BE/PO quyết) | Chặn |
|---|---|---|---|---|
| **CCR-01** | FR-35 “Đã đi X lần” ở chi tiết địa điểm và buổi hẹn, chỉ cho chính tài khoản đó | Không có field nào | Thêm `myVisitCount: integer, nullable` vào `PlaceDetail` và `DatePlan` (null khi chưa đăng nhập hoặc với người nhận link) | S-04, S-16 phần đếm |
| **CCR-02** | FR-18: lời nhắc “Đi chưa?” tại giờ hẹn; **Bỏ qua lời nhắc** lưu ở server, không hiện lại khi tải trang (AC-058); trạng thái nhắc tách khỏi visitAnswer | Chỉ có `PUT /date-plans/{id}/visit-report {answer: YES\|NO}`. Không có resource lời nhắc, không có dismiss, không có cách lấy danh sách nhắc đến hạn | (a) `DatePlan.reminder: {status: PENDING\|SHOWN\|DISMISSED\|ANSWERED\|CANCELLED, scheduledAt}`; (b) `GET /date-reminders/due` (nhắc còn hiệu lực của người dùng); (c) `POST /date-plans/{id}/reminder/dismiss`. Lưu ý `answer: NO` vẫn có trong contract, nhưng UI lời nhắc **không** hiển thị nút “Chưa đi” (CR-001) | S-01/S-14/S-16 lời nhắc |
| **CCR-03** | FR-11/CR-001: người nhận mở link **xem được nội dung chia sẻ ngay**, chưa cần tham gia | `previewShareGrant` chỉ trả `creatorName`, `candidateCount`, `slotAvailable`. Muốn xem các địa điểm phải `join` trước | Thêm `candidates: PlaceCard[]` (chỉ đọc) vào `ShareGrantPreview` | S-10 hiển thị trước khi tham gia |
| CCR-04 | §10.2 [DER]: sự kiện `date_reminder_dismissed` | Không có trong enum `AnalyticsEvent.name` | Thêm giá trị enum | Không chặn (chỉ thiếu analytics) |
| CCR-05 | Contract ghi nguồn SRS v1.0 | — | Cập nhật `info.description` sang v1.1, và rà các `x-oq` đã được chốt một phần (OQ-09, OQ-10) | Không chặn |

**Xử lý tạm:** màn hình vẫn dựng layout cho các phần này nhưng đặt sau một feature flag `contractPending`, hiện nhãn “Chờ cập nhật API (CCR-0x)” trong chế độ dev. Không hiển thị cho người dùng thật.

## 4. State & Data Architecture

### 4.1 Phân loại state

| Loại | Ví dụ | Nơi giữ |
|---|---|---|
| Server state | địa điểm, danh sách đã lưu, phiên cùng chọn, kế hoạch, thông báo, `me` | **TanStack Query** (§4.2) |
| URL state | `q`, `areaId`, `budget`, `tagIds`, `at`, `sort`, `page`, `view=list\|map`; `ids` của trang so sánh; `returnTo` khi đăng nhập | `useSearchParams` (đã là convention) |
| Client shared state | khay so sánh (≤3 id, A-09: localStorage); auth token; recipient session; toast | Context nhỏ + `lib/storage.ts` |
| Local UI state | form đang nhập, dialog mở/đóng, sheet bộ lọc mobile (bản nháp trước khi bấm Áp dụng) | `useState` trong component |
| Form | input → validate cơ bản ở client (bắt buộc, độ dài theo `maxLength` của contract) → server trả 400 `errors[]` → gắn vào từng trường | Không thêm thư viện form. Dùng helper `useFieldErrors(problem)` |

### 4.2 Server state: thêm `@tanstack/react-query`

TECHSTACK §4 ghi “thêm khi có nhiều màn dùng chung dữ liệu”. Điều kiện đó đã đạt:
- `me` dùng ở header, guard, tài khoản.
- `unreadCount` ở badge và màn thông báo.
- Lời nhắc đến hạn ở trang chủ, Buổi hẹn và chi tiết buổi hẹn.
- Danh sách đã lưu ở mọi `PlaceCard` (nút Lưu) và dialog chọn danh sách.
- Mutation (lưu, bỏ phiếu, tạo kế hoạch) cần invalidate cache, khóa nút khi pending (NFR-08) và retry an toàn.

Pattern: mỗi resource một hook trong `hooks/` gọi `api.GET/POST` (giữ kiểu openapi-fetch), query key theo path + params. **Không** dùng `openapi-react-query` để tránh thêm lớp trừu tượng. Retry tự động chỉ cho GET. Mutation không retry tự động: nếu lỗi mạng chưa rõ kết quả thì đọc lại trạng thái trước khi cho thử lại (UC EX-03).

*Phương án thay thế nếu không muốn thêm dependency:* tự viết `useApiQuery` với `useEffect`. Không khuyến nghị vì phải tự làm cache, invalidate và dedupe.

### 4.3 Dữ liệu khi backend còn 501: thêm `msw` (dev-only)

- Handler MSW chặn `/api/v1/*` khi bật `VITE_API_MOCK=1`. Endpoint backend đã implement thì cho đi thẳng tới backend (`passthrough`).
- Fixture khai báo bằng `satisfies Schemas['PlaceDetail']`…, nên khi contract đổi thì sai kiểu ở build. Fixture phản ánh các ca biên của SRS: giá/giờ UNKNOWN, nơi ẩn, link 410, suất 409 `SLOT_TAKEN`, giờ đóng 409, `warnings: HOURS_UNKNOWN`.
- Khi chạy mock, UI hiện dải **“Dữ liệu minh họa — không phải dữ liệu thật”** (RULE-28, NFR-12). MSW không nằm trong bundle production (import động có điều kiện).
- Cùng bộ handler được dùng lại trong Vitest.

### 4.4 Authentication & Authorization (UX; quyền thật ở server)

| Khía cạnh | Thiết kế |
|---|---|
| Đăng nhập | `POST /auth/otp/request` → `POST /auth/otp/verify` → `session.setAccessToken`, invalidate `me` |
| Trạng thái | `AuthProvider` cung cấp `{ status: 'anonymous'\|'member', user, roles, signOut }` theo `state-context-interface` (state/actions/meta); UI không biết token lưu ở đâu (`state-decouple-implementation`) |
| Route cần đăng nhập | `RequireAuth` cho `/saved`, `/plans`, `/account/*`, `/choice/new`. Chưa đăng nhập → `/login?returnTo=<path>` (A-11) |
| Thao tác cần đăng nhập trên trang công khai | Nút Lưu/Lên kế hoạch khi chưa đăng nhập → chuyển login kèm `returnTo` và intent (vd. `intent=save&placeId=`). Sau đăng nhập thực hiện lại intent, có xác nhận (AC-056) |
| 401 giữa chừng | Middleware xóa token, chuyển `/login?returnTo` |
| Người nhận link | `/invite/:token` **không** qua `RequireAuth` (CR-001). Join → `session.setRecipientSession`. Trang phiên cùng chọn và kế hoạch chấp nhận bearer **hoặc** recipient session |
| Quản trị | `RequireRole(['EDITOR','REVIEWER','SUPPORT','SUPER_ADMIN'])`; menu admin lọc theo `roles`. Ma trận chi tiết chờ OQ-18 (F2) |
| 403/404 | Hiện “Không tìm thấy” chung, không gợi ý tài nguyên tồn tại (FR-22, contract trả 404) |

### 4.5 Caching, phân trang, lọc, sắp xếp

- Phân trang theo `Page`/`Size` của contract (`PageMeta`). Kết quả tìm dùng phân trang có số trang (giữ được trên URL, chia sẻ được); không dùng infinite scroll ở G1.
- `staleTime`: danh mục (`taxonomies`, `areas`, `collections`) 10 phút; dữ liệu riêng tư 0–30 s; `me` đến khi đăng xuất.
- Đăng xuất hoặc thu hồi phiên → `queryClient.clear()` để không lộ dữ liệu người trước trên máy dùng chung.

## 5. Hiệu năng (vercel-react-best-practices)

| Rule | Áp dụng |
|---|---|
| `bundle-*` | Route-level `lazy` (React Router `lazy`), tách chunk admin khỏi web khách; MSW chỉ import trong dev; bản đồ (khi chọn nhà cung cấp) import động khi bật `view=map` |
| `async-*` (waterfall) | Chi tiết địa điểm: gọi `getPlace` và (nếu đăng nhập) `listSavedLists` song song; dùng loader/prefetch khi hover thẻ địa điểm |
| `client-*` | Dedupe qua TanStack Query; tìm kiếm chỉ gửi khi submit hoặc dừng gõ 400 ms, và chỉ ghi `search_submitted` khi submit |
| `rerender-*` | State bộ lọc nháp nằm trong sheet, chỉ đẩy lên URL khi Áp dụng; không đặt state mau đổi vào context dùng chung |
| `rendering-*` | Ảnh có `width/height`/`aspect-ratio`, `loading="lazy"` (trừ ảnh đầu trang chi tiết), tránh CLS |
| Không làm | Không `useMemo`/`memo` tùy tiện; chỉ thêm khi đo thấy vấn đề |

Không đặt chỉ tiêu số (SRS không có). Phase 6 sẽ đo kích thước bundle bằng output của `vite build`.

## 6. Bảo mật & quyền riêng tư phía client

- Token ở localStorage (đang là shortcut của repo) có rủi ro bị đọc nếu dính XSS. Giảm thiểu bằng cách không dùng `dangerouslySetInnerHTML` và để React escape mọi nội dung người dùng. Đề xuất BE chuyển sang cookie `HttpOnly` khi chốt OQ-06 (ngoài phạm vi FE quyết định).
- Không đưa `inviteToken`, OTP, ghi chú vào analytics hoặc log console. URL `/invite/:token` thêm `<meta name="robots" content="noindex">` và `referrerpolicy="no-referrer"` cho link ra ngoài trang này.
- Chỉ xin vị trí khi người dùng bấm “Dùng vị trí của tôi” (`getCurrentPosition` một lần, không `watchPosition`, NFR-07). Gửi tọa độ làm tròn tới mức đủ dùng.
- Liên kết ngoài (website địa điểm, chỉ đường) dùng `rel="noopener noreferrer"`.

## 7. Quyết định kiến trúc cần duyệt

| ID | Quyết định | Khuyến nghị |
|---|---|---|
| D-01 | Giữ nguyên stack/convention repo, mở rộng cấu trúc như §2 | Duyệt |
| D-02 | Thêm `@tanstack/react-query` | Duyệt (§4.2) |
| D-03 | Thêm `msw` (devDependency) cho dữ liệu minh họa và test | Duyệt (§4.3) |
| D-04 | Thêm Vitest + @testing-library/react + jsdom (devDependency); Playwright để Phase 6 | Duyệt |
| D-05 | Gửi CCR-01 đến CCR-05 cho backend | **Đã chốt 16-11: team backend sửa `openapi.yaml`.** FE chỉ gửi yêu cầu (§3), không sửa contract |
| D-06 | Bản đồ: chưa chọn nhà cung cấp (OQ-05). F1 dựng `view=list` đầy đủ; `view=map` là khung có interface `MapView`, cài đặt sau | Duyệt |

**Câu hỏi Phase 2 — đã trả lời 16-11-2026:**
- **Q-P2-01:** Team backend cập nhật `openapi.yaml` cho các CCR (D-05).
- **Q-P2-02:** Toàn bộ docs phase chuyển vào repo FE tại `gowithbae-fe/docs/frontend/`. Không giữ bản ở workspace.
- **Q-P2-03:** **Chưa có mock Stitch.** README, `TECHSTACK.md` và comment trong `src/index.css` đang nhắc tới một mock không tồn tại; token màu/font hiện tại coi là **tạm, chưa có nguồn duyệt**. Phase 4 đề xuất 3 hướng UI theo đúng quy trình, dựa trên logo và mô tả phong cách trong file nguồn (§2.4). Phase 5 sẽ sửa các tham chiếu tới mock cho đúng thực tế.

**16-11-2026: D-01 đến D-06 đã được duyệt toàn bộ** (thêm TanStack Query, MSW, Vitest/RTL; bản đồ là placeholder cho tới khi chọn nhà cung cấp).
