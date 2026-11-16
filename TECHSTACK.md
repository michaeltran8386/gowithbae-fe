# Tech stack — GoWithBae G1 Frontend

Phiên bản ghi theo lần dựng khung ngày 16-11-2026. Nguồn chính xác: `package.json` + `package-lock.json`. Tech stack backend và database: `gowithbae-be/TECHSTACK.md`.

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
| Be Vietnam Pro (Google Fonts) | — | Font, theo mock Stitch |

### 2.3 Gọi API

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
| Không dùng thư viện state (Redux, Zustand…) | Chưa có state toàn cục phức tạp; bộ lọc nằm trên URL |
| Không dùng thư viện component | Mock Stitch dùng Tailwind; giữ token riêng của GoWithBae |
| Tailwind 4 với `@theme` | Token màu một chỗ, khớp tên token của mock |
| Token lưu `localStorage` | Tạm cho khung (đánh dấu `shortcut:` trong `client.ts`); xem lại khi chốt cơ chế phiên OQ-06 |

## 4. Chưa chọn

| Hạng mục | Ghi chú |
|---|---|
| Bản đồ (hiển thị kết quả, chỉ đường) | Theo nhà cung cấp backend chọn, OQ-05 |
| Thư viện data fetching/cache (TanStack Query…) | Thêm khi có nhiều màn dùng chung dữ liệu |
| Test UI (Vitest, Playwright) | Thêm khi có màn hình thật đầu tiên |
| Hosting, CI/CD | OQ-22 |

## 5. Nâng cấp phiên bản

- Sau khi nâng bất kỳ gói nào: `npm run build && npm run lint` phải sạch, rồi cập nhật bảng ở file này.
- Nâng `openapi-typescript`: sửa phiên bản trong script `gen:api` của `package.json`, chạy lại `npm run gen:api` và kiểm tra diff `schema.d.ts`.
