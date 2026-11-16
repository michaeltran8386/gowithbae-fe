# Hướng dẫn làm việc — Frontend GoWithBae G1

Đọc kèm: contract `gowithbae-be/api/openapi.yaml`, hướng dẫn backend `gowithbae-be/docs/DEVELOPMENT.md`, hồ sơ thiết kế [docs/frontend/](frontend/README.md) (màn hình, component, design system, đặc tả UI), SRS `GWB-REQ-G1` v1.1.

## 1. Nguyên tắc

- **Contract-first.** Mọi request/response đi qua client có kiểu sinh từ `openapi.yaml`. Không tự khai báo type cho dữ liệu API, không gọi `fetch` trực tiếp.
- **Frontend không phải lớp bảo mật.** Ẩn nút chỉ là UX; backend luôn kiểm tra quyền.
- **Không bịa dữ liệu.** Trường `null` hiển thị "Chưa có thông tin"; không tự hiện sao/đánh giá, không giả định đang mở cửa hay có giá (RULE-04).
- Frontend không kết nối Supabase. Không dùng `@supabase/supabase-js`, không đặt key Supabase trong code.

## 2. Cài đặt và chạy

Yêu cầu: Node 20 trở lên. Backend đang chạy ở `http://localhost:8080` (xem hướng dẫn backend).

```bash
npm install
npm run dev
```

Mở `http://localhost:5173`. Vite proxy mọi request `/api/*` sang backend, nên không cần cấu hình CORS khi dev. Thử `/search` để thấy dữ liệu thật.

**Không có backend?** `npm run dev:mock` bật MSW với dữ liệu minh họa (`src/mocks/`). Mã đăng nhập thử: `123456`. Link mời mẫu: `/invite/loi-moi-mau` (hợp lệ), `/invite/loi-moi-da-thu-hoi` (đã thu hồi). Trang luôn hiện dải “Dữ liệu minh họa”.

| Lệnh | Việc |
|---|---|
| `npm run dev` | Dev server (backend thật) |
| `npm run dev:mock` | Dev server + dữ liệu minh họa |
| `npm test` | Vitest |
| `npm run gen:api` | Sinh lại `src/api/schema.d.ts` từ contract |
| `npm run build` | Kiểm tra type (`tsc -b`) + build production vào `dist/` |
| `npm run lint` | oxlint |

`gen:api` đọc `../gowithbae-be/api/openapi.yaml`, nên clone hai repo **cạnh nhau** trong cùng thư mục cha.

## 3. Cấu trúc

```
src/
  api/
    schema.d.ts       CODE SINH — không sửa tay
    client.ts         client openapi-fetch + gắn header xác thực, xử lý 401
    problem.ts        chuẩn hóa lỗi Problem (status → câu chữ SRS, lỗi theo trường)
  app/
    router.tsx        bảng route (lazy theo màn), ghi mã màn S-xx và FR
    providers.tsx     QueryClient, Auth, khay so sánh, toast
    auth.tsx          AuthProvider, RequireAuth, loginHref(returnTo, intent)
    compare.tsx       khay so sánh tối đa 3 (localStorage)
  layouts/            AppLayout, MinimalLayout (login, link mời), AdminLayout
  pages/              mỗi màn một file
  components/
    ui/               Button (variant tường minh), Field (compound), Dialog, StateView…
    place/ choice/ plan/   component theo nghiệp vụ
  hooks/              hook TanStack Query theo resource; useNow
  lib/                format (tiền, giờ VN), hours, analytics, storage, idempotency
  mocks/              MSW + dữ liệu minh họa (chỉ dev/test)
  test/               setup Vitest, renderApp, test luồng theo AC
  index.css           Tailwind + design token
```

Tách component dùng lại vào `src/components/`, logic gọi API vào hook trong `src/hooks/`. Chỉ tách khi có chỗ thứ hai dùng. Ưu tiên composition (compound component, variant tường minh) thay vì thêm prop boolean.

## 4. Gọi API

```ts
import { api, type Schemas } from '../api/client.ts'

const { data, error, response } = await api.GET('/places/{placeId}', {
  params: { path: { placeId } },
})
if (error) {
  // error có kiểu Problem: title, status, detail, code, errors[]
}
```

- Đường dẫn, tham số, body, kiểu trả về đều được TypeScript kiểm tra. Sai tên field là lỗi build.
- Lấy type model: `Schemas['PlaceDetail']`, `Schemas['BudgetBand']`...
- Ví dụ đầy đủ (state loading/lỗi/rỗng, bộ lọc trên URL): `src/pages/SearchPage.tsx`.

### Xử lý mã lỗi

| Status | Nghĩa | Màn hình làm gì |
|---|---|---|
| 400 | Dữ liệu sai; `errors[]` có `field` + `message` | Hiện lỗi ngay dưới ô nhập tương ứng, giữ dữ liệu người dùng đã nhập |
| 401 | Chưa đăng nhập / phiên hết hạn | Chuyển `/login`, quay lại thao tác đang làm sau khi đăng nhập |
| 404 | Không tồn tại **hoặc không có quyền** | "Không tìm thấy"; không gợi ý là tồn tại |
| 409 | Vi phạm quy tắc; `code` cho biết quy tắc nào (vd. `SLOT_TAKEN`) | Giải thích và chỉ cách tiếp tục |
| 410 | Link mời hết hạn / đã thu hồi | "Liên kết không còn hiệu lực" |
| 429 | Gửi quá nhiều; header `Retry-After` | Báo thời gian thử lại |
| 501 | Backend chưa implement | Chỉ gặp khi dev; kiểm tra backend |

### Xác thực

- Sau khi xác minh OTP: `session.setAccessToken(token)`; đăng xuất: `session.setAccessToken(null)`.
- Người nhận link mời: `session.setRecipientSession(token)` sau khi `POST /share-grants/{token}/join`.
- `client.ts` tự gắn `Authorization: Bearer` và `X-Recipient-Session` vào mọi request.

## 5. Quy trình làm một màn hình

Ví dụ: C03 Chi tiết địa điểm.

1. **Đọc yêu cầu:** đặc tả màn trong `docs/frontend/04-screen-ui-specifications.md`, FR ghi trong `src/app/router.tsx` (FR-05), và operation `getPlace` trong contract.
2. **Kiểm tra backend:** gọi thử endpoint. Nếu trả 501, phối hợp với backend; trong lúc chờ, thêm handler vào `src/mocks/handlers.ts` với dữ liệu đúng kiểu `Schemas['PlaceDetail']` (`satisfies`).
3. **Tạo page:** `src/pages/PlaceDetailPage.tsx`, thay `Placeholder` trong `router.tsx`.
4. **Đủ trạng thái:** loading, rỗng, lỗi có nút thử lại (SRS §8). Nút đang gửi phải bị khóa để không tạo bản ghi trùng.
5. **Kiểm tra:** `npm run build && npm run lint && npm test`, viết test cho AC của màn trong `src/test/`, xem ở chiều rộng 360 px và desktop, thao tác được bằng bàn phím.

### Khi contract đổi

```bash
npm run gen:api
npm run build
```

Lỗi type sau khi sinh lại chính là danh sách chỗ phải sửa. Commit `schema.d.ts` cùng với phần code sửa theo.

## 6. Giao diện

- **Màu và font:** dùng token trong `src/index.css` (`bg-action`, `text-ink-muted`, `bg-peach-50`, `rounded-control`…). Không dùng mã màu hex rời trong component. Token theo design system B+ (docs/frontend/04), màu đo từ logo, chờ mã chính thức OQ-01. `sky` và `heart` chỉ dùng trang trí (tương phản thấp), chữ dùng `action`/`attention`.
- **Mobile trước:** không tràn chữ/nút/bảng ở 360 px (NFR-02). Mobile có thanh điều hướng đáy: Khám phá, Đã lưu, Buổi hẹn, Tài khoản.
- **Truy cập (NFR-03):** ô nhập có `<label>` (có thể `sr-only`), ảnh có `alt`, lỗi gắn `role="alert"`, mọi thao tác dùng được bằng bàn phím.
- **Câu chữ bắt buộc theo SRS:**
  - Kế hoạch: "Kế hoạch này chưa giữ chỗ tại địa điểm".
  - Khoảng cách: ghi "ước tính", không gọi là thời gian đi.
  - So sánh tối đa 3: "Bạn chỉ có thể so sánh tối đa 3 địa điểm".
  - Chưa trả lời ≠ Bỏ qua trong phiếu cùng chọn.
  - Lời nhắc buổi hẹn: đúng hai nút “Đã đi” / “Bỏ qua lời nhắc”; không dùng “Chưa đi”, không mở popup khác (CR-001).
  - Không hiển thị số sao, lượt đánh giá, hay “đang mở cửa” khi giờ chưa xác minh.
- **Tiền:** `Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND', maximumFractionDigits: 0 })`.
- **Giờ:** hiển thị theo giờ Việt Nam (`timeZone: 'Asia/Ho_Chi_Minh'`), gửi lên API dạng ISO-8601 có offset.

## 7. Trạng thái trên URL

Bộ lọc, trang, sắp xếp đặt trong query string (`useSearchParams`) để chia sẻ link và giữ nguyên điều kiện khi quay lại (FR-03). State tạm (form đang gõ, modal) để trong component.

## 8. Sự kiện phân tích (FR-32)

Gửi qua `POST /events` theo danh sách tên sự kiện trong contract (`search_submitted`, `place_viewed`...). Mỗi sự kiện một `eventId` (`crypto.randomUUID()`). **Không** gửi token, OTP, ghi chú riêng, vị trí chính xác; không gửi mỗi lần gõ phím. Chỉ ghi `place_saved` / `date_plan_created` sau khi API trả thành công.

## 9. Lỗi hay gặp

| Triệu chứng | Nguyên nhân | Cách xử lý |
|---|---|---|
| "Không kết nối được máy chủ" | Backend chưa chạy | Chạy `./mvnw spring-boot:run` trong `gowithbae-be` |
| `gen:api` không tìm thấy file | Hai repo không nằm cạnh nhau | Clone `gowithbae-be` cùng thư mục cha |
| Lỗi type sau `gen:api` | Contract đổi | Sửa code theo lỗi; không sửa `schema.d.ts` |
| Mọi API trả 401 | Token hết hạn / sai `JWT_SECRET` giữa các lần chạy backend | Đăng nhập lại |
