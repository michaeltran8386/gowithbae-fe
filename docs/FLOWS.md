# Luồng chức năng và hướng dẫn dùng — Frontend GoWithBae G1

Dành cho thành viên mới và người test: web có những màn nào, đi qua từng luồng ra sao, và code của mỗi luồng nằm ở đâu. API chi tiết xem repo backend `docs/FLOWS.md`.

## 1. Chạy để thử

| Cách | Lệnh / địa chỉ | Đăng nhập |
|---|---|---|
| Dữ liệu minh họa, không cần backend | `npm run dev:mock` → http://localhost:5173 | Email bất kỳ, mã `123456`. Admin: `admin@gowithbae.test`, mã `123456`, mã Authenticator `654321` |
| Backend thật trên máy | `npm run dev` (proxy `/api` → `localhost:8080`) | Mã OTP gửi qua SMTP cấu hình ở backend |
| Cả hệ thống bằng Docker | http://localhost:8081 (`docker compose up -d --build` trong `gowithbae-be/docker`, xem backend `docs/DEVELOPMENT.md` §9–10) | Mã OTP xem ở hộp thư giả http://localhost:8025; admin cần cài Google Authenticator qua link kích hoạt |

Dữ liệu minh họa nằm trong bộ nhớ trình duyệt: tải lại trang là về trạng thái ban đầu.

## 2. Luồng của người dùng

### 2.1 Khám phá và chọn nơi (không cần đăng nhập)

1. **Khám phá** (`/`): ô tìm (gõ không dấu được), khu vực, ngân sách cho hai người, chip hoạt động; bên dưới là bộ sưu tập.
2. **Kết quả** (`/search`): lọc thêm nhãn, sắp xếp, "Gần tôi". Không có kết quả thì giữ nguyên điều kiện và cho bỏ từng điều kiện.
3. **Chi tiết** (`/places/:id`): ảnh, giá cho hai người, giờ mở cửa hôm nay và cả tuần, nhãn, nguồn/ngày kiểm tra. Nút **Lưu**, **So sánh**, **Lên kế hoạch**, **Báo sai thông tin**.
4. **So sánh** (`/compare`): tối đa 3 nơi; trường thiếu ghi "Chưa có thông tin".

### 2.2 Đăng nhập

`/login`: nhập email → nhận mã 6 số → nhập mã. Tài khoản admin có thêm ô "Mã trong Google Authenticator". Sau đăng nhập quay về trang đang xem (`returnTo`); admin đi thẳng vào `/admin`.

### 2.3 Lưu và rủ người ấy cùng chọn

1. Ở chi tiết địa điểm bấm **Lưu** → chọn hoặc tạo danh sách.
2. Bấm **"Rủ người ấy cùng chọn"** ở trang Khám phá hoặc Buổi hẹn, hoặc nút **"Mời cùng chọn"** trên thẻ danh sách ở **Đã lưu**. Cần một danh sách có **ít nhất 2 nơi**; trang chọn danh sách nói rõ danh sách nào còn thiếu bao nhiêu nơi.
3. **Tạo lời mời** (`/choice/new`): chọn 2–5 nơi → **Tạo lời mời** → copy link. Link chỉ hiện một lần.
4. Người ấy mở link (`/invite/:token`), không cần tài khoản → **Tham gia chọn** → bấm Thích / Bỏ qua từng nơi (`/choice/:id`). Mỗi link nhận một người.
5. Bạn bỏ phiếu → **Kết quả** (`/choice/:id/results`) → **"Chốt … và tạo kế hoạch"**. Kế hoạch tạo ra được chia sẻ cho người ấy.

Tự test một mình: dùng tab thường cho bạn, cửa sổ ẩn danh cho người ấy.

### 2.4 Kế hoạch hẹn

- **Buổi hẹn** (`/plans`): sắp tới / đã qua. **Tạo kế hoạch** (`/plans/new`): chọn nơi, ngày giờ, ghi chú. Hệ thống cảnh báo nếu nơi đóng cửa giờ đó.
- **Chi tiết** (`/plans/:id`): thêm vào lịch (`.ics`), chỉ đường, sửa, hủy. Người nhận chỉ xem.
- Sau giờ hẹn trang chủ hiện lời nhắc "Đi chưa?".
- **Mời người ấy xem kế hoạch** (kế hoạch tạo tay, sắp tới): khung "Mời người ấy" ở chi tiết kế hoạch → **Tạo link mời** → gửi link (chỉ hiện một lần). Người ấy mở `/plan-invite/:token`, không cần tài khoản, thấy giờ và địa điểm (không thấy ghi chú của bạn), bấm **Mình sẽ đi** / **Không đi được** (có thể ghi tên). Bạn nhận thông báo và thấy câu trả lời ngay trong khung. **Tạo link mới** làm link cũ mất hiệu lực; **Thu hồi link** để ngừng chia sẻ.

### 2.5 Tài khoản, thông báo, hỗ trợ, trang tĩnh

- **Tài khoản** (`/account`): đổi email, đăng xuất, yêu cầu xóa tài khoản (bị xóa sau 30 ngày; trong thời gian đó liên hệ hỗ trợ để admin khôi phục).
- **Thông báo** (chuông, `/account/notifications`): kế hoạch đổi/hủy, hỗ trợ trả lời, thông báo từ quản trị.
- **Hỗ trợ** (`/account/support`): tạo yêu cầu, xem hội thoại, trả lời.
- **Báo sai**: từ chi tiết địa điểm; gửi được khi chưa đăng nhập.
- **Trang tĩnh**: `/faq`, `/terms`, `/privacy`, `/contact` (link ở chân trang). Tiêu đề trang chủ, banner đầu trang và chân trang do admin sửa.

## 3. Luồng quản trị (`/admin`, chỉ `SUPER_ADMIN`)

### 3.1 Vào lần đầu

1. Nhận link `/admin/activate/<token>` (từ lệnh bootstrap hoặc admin khác tạo tài khoản cho bạn).
2. Mở link → quét mã QR bằng Google Authenticator (hoặc nhập khóa dạng chữ) → nhập mã 6 số → **Kích hoạt**.
3. Đăng nhập ở `/login`: email → mã email → mã Authenticator **mới** (mã vừa dùng để kích hoạt không dùng lại được).

### 3.2 Các màn

| Menu | Làm gì |
|---|---|
| Bảng điều khiển | Số liệu theo kỳ, xuất CSV; địa điểm chờ duyệt, báo sai và yêu cầu hỗ trợ mới |
| Tài khoản | Tìm/lọc, **Tạo tài khoản** (chọn Admin thì hiện link kích hoạt để gửi). Chi tiết: khóa/mở (bắt buộc lý do), đổi vai trò, đăng xuất mọi thiết bị, cấp lại link Authenticator; tab Hoạt động, Phiên đăng nhập (IP, thiết bị), Nhật ký. Tài khoản **chờ xóa**: hiện ngày tự xóa, nút **Khôi phục** / **Xóa ngay**. Tài khoản khác: **Vùng nguy hiểm → Xóa tài khoản** (gõ lại email + lý do, không hoàn tác) |
| Địa điểm | Lọc trạng thái/khu vực/từ khóa → tạo hoặc sửa: thông tin, nhãn theo nhóm, giá, giờ mở cửa (tuần + ngoại lệ), nguồn; **Ảnh** (tải lên, ghi nguồn/quyền, chọn bìa). Khung **Trạng thái & duyệt** liệt kê phần còn thiếu và các nút chuyển trạng thái |
| Nhập CSV | Tải file mẫu → tải file lên để kiểm tra → xem lỗi từng dòng → **Ghi thành nháp** (chỉ khi cả file hợp lệ) |
| Nhãn & khu vực | Thêm, đổi tên, ngừng dùng / dùng lại (không xóa) |
| Bộ sưu tập | Tiêu đề, mô tả, ảnh bìa, khung thời gian hiển thị, chọn và sắp xếp địa điểm |
| Trang tĩnh (Nội dung web) | Trang chủ, banner, FAQ (thêm/xóa/đổi thứ tự), điều khoản, quyền riêng tư, liên hệ, chân trang |
| Gửi thông báo | Gửi tất cả thành viên hoặc một người; xem lịch sử |
| Báo sai | Lọc trạng thái, mở nhanh địa điểm để sửa, chuyển trạng thái; đóng phải có ghi chú |
| Yêu cầu hỗ trợ | Hội thoại, **Trả lời công khai** (thành viên nhận thông báo) hoặc **Ghi chú nội bộ** (không bao giờ lộ), đổi trạng thái, đóng |
| Nhật ký | Mọi thao tác quản trị: ai, lúc nào, đối tượng, trước/sau, lý do |

### 3.3 Duyệt địa điểm — điều cần biết

- Vòng đời: **Nháp → Chờ duyệt → Đang hiển thị → Tạm ẩn / Ngừng hoạt động → Khôi phục (về Chờ duyệt)**. Chỉ sửa được khi Nháp hoặc Chờ duyệt.
- Admin (`SUPER_ADMIN`) **tự duyệt được** nơi do chính mình tạo (OQ-18 đã chốt). Nhật ký vẫn ghi ai duyệt.
- Ô giá phải chọn "Đã biết giá" hoặc "Chưa rõ giá"; để "Chưa ghi" thì chưa gửi duyệt được.

## 4. Code ở đâu

```
src/app/router.tsx        toàn bộ route (lazy); AppLayout (web), MinimalLayout (login, invite), AdminLayout (/admin)
src/app/auth.tsx          phiên đăng nhập, meta.isAdmin; 401 → xóa phiên và tải lại dữ liệu
src/api/                  client openapi-fetch, schema.d.ts (sinh từ contract: npm run gen:api), problem.ts (câu lỗi)
src/hooks/                React Query theo nhóm: places, saved, choice, plans, account, admin, adminCatalog, adminSupport
src/pages/                màn người dùng; pages/admin/ màn quản trị
src/components/           ui/ (Button, Field, Dialog, Toast, StateView), admin/AdminUi, place/, plan/, choice/
src/mocks/                MSW: handlers.ts (người dùng), admin.ts, adminCatalog.ts, adminSupport.ts
src/test/                 Vitest + Testing Library theo luồng (flows, acceptance, admin, adminCatalog, adminSupport, a11y)
```

Thêm một màn: thêm hook trong `src/hooks/`, trang trong `src/pages/`, route trong `router.tsx`, mock trong `src/mocks/`, test luồng trong `src/test/`. API mới phải có trong `openapi.yaml` của backend trước, rồi chạy `npm run gen:api`.

Trang quản trị dùng `adminProblemMessage` (hiện lý do thật của lỗi 403/404); web người dùng dùng `problemMessage` (403/404 thành câu chung "Không tìm thấy").

## 5. Còn thiếu

- Người nhận link mời xem kế hoạch chưa nhận thông báo khi chủ đổi giờ/hủy (họ thấy bản mới mỗi lần mở lại link).
- Bản đồ thật, đổi địa điểm trong màn sửa kế hoạch.
- Chưa thử trên Safari iOS / Chrome Android máy thật.
