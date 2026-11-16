# Tech stack — GoWithBae G1 Frontend

Phiên bản ghi theo lần dựng khung và triển khai F1 ngày 16-11-2026. Nguồn chính xác: `package.json` + `package-lock.json`. Tech stack backend và database: `gowithbae-be/TECHSTACK.md`.

## 1. Vị trí trong hệ thống

```
Trình duyệt ──▶ gowithbae-fe (static) ──/api/v1──▶ gowithbae-be (Spring Boot) ──▶ Supabase Postgres
```

Frontend chỉ nói chuyện với backend qua REST. Không kết nối thẳng Supabase, không giữ key Supabase.

## 2. Thành phần

### 2.1 Runtime và build

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| Node.js | 20 trở lên (dev/build) | Chạy công cụ build |
| TypeScript | 7.0.2 | Kiểm tra kiểu (`tsc -b`) |
| Vite | 8.3.8 | Dev server, proxy `/api`, build production |
| @vitejs/plugin-react | 6.3.0 | JSX, fast refresh |
| oxlint | 1.93.0 | Lint |

### 2.2 Ứng dụng

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| React / React DOM | 19.3.1 | UI |
| React Router | 8.5.1 | Định tuyến (`createBrowserRouter`) |
| Tailwind CSS + @tailwindcss/vite | 4.3.5 | Style; token màu/font trong `src/index.css` |
| Be Vietnam Pro (Google Fonts) | — | Font (design system B+, docs/frontend/04) |
| @tanstack/react-query | 5.107.1 | Dữ liệu từ server: cache, invalidate, khóa nút khi đang gửi, retry GET |
| lucide-react | 1.73.0 | Icon (tree-shake theo icon) |

### 2.3 Kiểm thử và dữ liệu minh họa

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| msw | 3.0.6 | Dữ liệu minh họa khi `npm run dev:mock` và trong test; không có trong bản build |
| vitest | 5.1.0 | Chạy test |
| @testing-library/react / jest-dom / user-event | 16.3.3 / 7.0.1 / 14.6.12 | Test theo hành vi người dùng |
| jsdom | 31.0.1 | Môi trường DOM cho test |

### 2.4 Gọi API

| Thành phần | Phiên bản | Vai trò |
|---|---|---|
| openapi-typescript | 7.13.0 (chạy qua `npx` trong `npm run gen:api`) | Sinh `src/api/schema.d.ts` từ `openapi.yaml` |
| openapi-fetch | 0.17.0 | Client `fetch` có kiểu theo contract (~6 kB) |

`openapi-typescript` không nằm trong `devDependencies` vì cần TypeScript 5 làm peer, xung đột với TypeScript 7 của project. Chạy qua `npx` dùng bản TypeScript riêng.

## 3. Quyết định và lý do

| Quyết định | Lý do |
|---|---|
| SPA thuần (Vite), không SSR | Không cần SEO cho dữ liệu riêng; trang công khai có thể xem lại khi chốt OQ-01. Triển khai là file tĩnh |
| openapi-fetch thay vì axios/client tự viết | Kiểu suy ra từ contract, không phải duy trì type tay; nhẹ |
| Không dùng thư viện state (Redux, Zustand…) | Dữ liệu server do TanStack Query giữ; bộ lọc nằm trên URL; khay so sánh và phiên trong context nhỏ |
| TanStack Query (D-02) | Nhiều màn dùng chung dữ liệu (me, thông báo, lời nhắc, danh sách đã lưu); cần invalidate và chống bấm lặp |
| MSW (D-03) | Backend đa số còn 501; dữ liệu minh họa đúng kiểu contract, dùng chung cho dev và test |
| Không dùng thư viện component | Component nhỏ tự viết theo design system B+; token trong `src/index.css` |
| Tailwind 4 với `@theme` | Token màu một chỗ, khớp tên token của mock |
| Token lưu `localStorage` | Tạm cho khung (đánh dấu `shortcut:` trong `client.ts`); xem lại khi chốt cơ chế phiên OQ-06 |

## 4. Chưa chọn

| Hạng mục | Ghi chú |
|---|---|
| Bản đồ (hiển thị kết quả) | Theo nhà cung cấp backend chọn, OQ-05. Hiện có khung “Bản đồ chưa sẵn sàng”, danh sách luôn đầy đủ (D-06) |
| Test end-to-end (Playwright) | Khi có backend chạy được để test cả luồng thật |
| Hosting, CI/CD | OQ-22 |

## 5. Nâng cấp phiên bản

- Sau khi nâng bất kỳ gói nào: `npm run build && npm run lint` phải sạch, rồi cập nhật bảng ở file này.
- Nâng `openapi-typescript`: sửa phiên bản trong script `gen:api` của `package.json`, chạy lại `npm run gen:api` và kiểm tra diff `schema.d.ts`.
