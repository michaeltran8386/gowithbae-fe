# gowithbae-fe

Frontend GoWithBae G1: React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · openapi-fetch.

## Chạy

```bash
npm install
npm run dev        # http://localhost:5173, /api được proxy tới http://localhost:8080
```

Cần backend `gowithbae-be` đang chạy.

## API client

- Kiểu sinh từ contract: `npm run gen:api` đọc `../gowithbae-be/api/openapi.yaml` → `src/api/schema.d.ts` (không sửa tay).
- Dùng: `api.GET('/places', { params: { query: { q } } })` từ `src/api/client.ts`; request/response có kiểu đầy đủ.
- Client tự gắn `Authorization: Bearer` và `X-Recipient-Session` nếu có.

## Màn hình

Route khai báo trong `src/router.tsx`, đặt theo mã mock trong `srs/GoWithBae_UI_Review_v1` (C01–C08, A01–A06).
`SearchPage` (C02) đã nối API thật; các màn còn lại là `Placeholder`.
Token màu/font lấy từ mock Stitch (`src/index.css`), chờ chốt OQ-01.
