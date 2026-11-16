# gowithbae-fe

Frontend GoWithBae G1: React 19 · TypeScript · Vite · Tailwind CSS 4 · React Router · openapi-fetch · TanStack Query.

**Hướng dẫn làm việc:** [docs/DEVELOPMENT.md](docs/DEVELOPMENT.md) · **Tech stack:** [TECHSTACK.md](TECHSTACK.md) · **Phân tích, kiến trúc, UX/UI:** [docs/frontend/](docs/frontend/README.md)

## Chạy

```bash
npm install
npm run dev:mock   # dữ liệu minh họa (MSW), không cần backend — mã đăng nhập thử 123456
npm run dev        # gọi backend thật: /api được proxy tới http://localhost:8080
```

| Lệnh | Việc |
|---|---|
| `npm test` | Vitest + Testing Library, dữ liệu qua MSW |
| `npm run build` | Kiểm tra type + build production (không chứa dữ liệu minh họa) |
| `npm run lint` | oxlint |
| `npm run gen:api` | Sinh lại `src/api/schema.d.ts` từ `../gowithbae-be/api/openapi.yaml` |

## Trạng thái (16-11-2026)

- **Web khách G1 (F1):** đủ 21 màn S-01…S-21 (khám phá, kết quả, chi tiết, so sánh, đăng nhập, đã lưu, cùng chọn, buổi hẹn + lời nhắc “Đi chưa?”, tài khoản, thông báo, hỗ trợ).
- **Quản trị (F2):** chưa làm, chờ OQ-15/18/19/20.
- **Backend:** mới có `GET /places` (một phần). Các màn còn lại chạy được bằng `npm run dev:mock`.
- **Chờ backend cập nhật contract:** CCR-01 (số lần đã đi), CCR-02 (lưu “Bỏ qua lời nhắc” ở server), CCR-03 (người nhận xem các nơi trước khi tham gia). Chi tiết: [docs/frontend/02-frontend-architecture.md](docs/frontend/02-frontend-architecture.md) §3.

Nhật ký triển khai: [docs/frontend/05-implementation-log.md](docs/frontend/05-implementation-log.md).
