# Báo cáo Nhật ký Công việc: nuoc_dai.md

Tài liệu ghi lại toàn bộ các chi tiết kỹ thuật, chức năng được triển khai, lỗi đã sửa, thao tác dọn dẹp/xóa và tình trạng Git trong phiên làm việc.

---

## 1. Khắc phục lỗi màn hình "Trang gặp lỗi" (Place Detail & Runtime Errors)

### 1.1. Nguyên nhân
* Khi bấm vào một địa điểm (ví dụ: *Mèo Lười Cà Phê*) trên giao diện, frontend gọi `GET /api/v1/places/{id}`.
* Backend trả về mã lỗi HTTP 500 do truy vấn SQL trong `PlacesDelegate.java` chứa các cột không khớp với bảng `place` thực tế trên cơ sở dữ liệu Supabase:
  * Lỗi 1: `PSQLException: ERROR: column p.slug does not exist` (Bảng `place` không có cột `slug`).
  * Lỗi 2: `PSQLException: ERROR: column p.website_url does not exist` (Cột thực tế trong schema DB là `p.website`).
  * Lỗi 3: Bảng mở cửa là `opening_hours` (`day_of_week`, `opens_at`, `closes_at`), code trước đó join sai bảng `place_opening_hours`.
* Phía Frontend: Khi API trả về 500, React Router Error Boundary tại `router.tsx` bắt lỗi và hiển thị `RouteErrorPage` với giao diện:
  > **Trang gặp lỗi**  
  > *Đã có lỗi khi tải trang. Hãy tải lại trang.*  
  > `[Thử lại]`
* Ngoài ra, tệp `DiscoverPage.tsx` gặp lỗi TypeScript `TS2339` khi truy cập `places.data.page?.total` (theo schema chuẩn là `totalElements`), gây lỗi khi chạy lệnh `npm run build`.

### 1.2. Thao tác xử lý
* **Backend (`PlacesDelegate.java`)**:
  * Đã loại bỏ `p.slug`.
  * Sửa `p.website_url` thành `p.website`.
  * Join thêm bảng `taxonomy` để nạp thông tin danh mục `category`.
  * Truy vấn bảng `opening_hours` để ánh xạ lịch mở cửa trong tuần (`OpeningHoursWeeklyInner` 1–7) theo đúng hợp đồng OpenAPI.
* **Frontend (`DiscoverPage.tsx`)**:
  * Đổi `places.data.page?.total` thành `places.data.page?.totalElements`.
  * Đã chạy kiểm tra `npm run build` đạt 100% (54/54 chunks biên dịch thành công).
  * Chạy `npm run test` (Vitest) đạt 57/57 tests passed.
* **Kiểm thử thực tế**:
  * Endpoint `GET http://localhost:8080/api/v1/places/{id}` trả về HTTP 200 đầy đủ: ID, tên, giá cho 2 người, ảnh cover, 5 nhãn tags, lịch mở cửa cả tuần, danh mục và khu vực.

---

## 2. Triển khai hoàn thiện các API Backend (gowithbae-be)

Đã bổ sung và hoàn thiện toàn bộ các API Delegate còn thiếu theo đúng OpenAPI contract v0.3.0:

1. **Cùng chọn địa điểm hẹn hò (`ChoiceSessionsDelegate.java` & `ShareGrantsDelegate.java`)**:
   * `POST /choice-sessions`: Tạo phiên cùng chọn với danh sách ứng viên (tối đa 5 địa điểm).
   * `POST /choice-sessions/{id}/votes`: Ghi nhận phiếu chọn (`LIKE` / `PASS`).
   * `GET /choice-sessions/{id}/results`: Tính toán kết quả đồng thuận (mutual like).
   * `POST /share-grants`: Tạo token liên kết chia sẻ cho người nhận (`/invite/{token}`), cho phép khách bình chọn không cần tạo tài khoản (CR-001).
   * `DELETE /share-grants/{id}`: Thu hồi quyền truy cập của người nhận.

2. **Kế hoạch buổi hẹn (`DatePlansDelegate.java`)**:
   * `POST /date-plans`: Tạo kế hoạch buổi hẹn tại địa điểm cụ thể.
   * `GET /date-plans`: Danh sách buổi hẹn của người dùng.
   * `GET /date-plans/{id}`: Chi tiết buổi hẹn.
   * `DELETE /date-plans/{id}`: Hủy lịch hẹn.
   * `GET /date-plans/{id}/calendar.ics`: Xuất file lịch hẹn chuẩn iCalendar (RFC 5545) để người dùng thêm vào Apple Calendar / Google Calendar.

3. **Báo cáo sai & Hỗ trợ người dùng (`SupportDelegate.java`)**:
   * `POST /places/{id}/reports`: Báo sai thông tin địa điểm (sai giá, sai giờ, đổi địa chỉ, đóng cửa).
   * `POST /support-tickets`: Tạo yêu cầu hỗ trợ tài khoản / buổi hẹn.
   * `POST /support-tickets/{id}/messages`: Gửi tin nhắn trao đổi trong ticket hỗ trợ.

4. **Khám phá (`DiscoveryDelegate.java`)**:
   * `GET /collections`: Danh sách các bộ sưu tập địa điểm công khai.
   * `GET /collections/{id}`: Chi tiết bộ sưu tập kèm danh sách địa điểm.

---

## 3. Phân quyền và Giao diện Quản trị viên (Admin)

1. **Cơ chế truy cập**:
   * Ứng dụng áp dụng nguyên tắc *security-by-obscurity*: Khi khách hoặc người dùng có vai trò thông thường (`MEMBER`) gõ đường dẫn `/admin`, hệ thống sẽ hiển thị trang 404 để giấu đường dẫn quản trị.
   * Chỉ người dùng có vai trò nhân sự (`isStaff`: `SUPER_ADMIN`, `EDITOR`, `REVIEWER`, `SUPPORT`) mới hiển thị giao diện thanh menu bên trái của `AdminLayout.tsx`.
2. **Cấp quyền tài khoản**:
   * Đã cấp quyền `SUPER_ADMIN` trên DB Supabase cho tài khoản cá nhân: `xuansinh4567@gmail.com`.

---

## 4. Hardcode Bypass Đăng nhập Admin (`admin@baicut.com` / mã `0000`)

Theo yêu cầu phục vụ kiểm thử và truy cập nhanh quyền Admin:

1. **Cơ sở dữ liệu Supabase**:
   * Đã tạo tài khoản `admin@baicut.com` với trạng thái `ACTIVE`.
   * Gán 2 vai trò `MEMBER` và `SUPER_ADMIN` trong bảng `user_role`.

2. **Backend (`AuthService.java`)**:
   * Khi gửi yêu cầu OTP với email `admin@baicut.com`: Bỏ qua kiểm tra rate-limit, không cần gửi mail thực tế qua SMTP.
   * Khi xác thực OTP: Khớp trực tiếp mã `0000` (hoặc `000000`), bỏ qua xác thực 2FA/TOTP nhân viên, tự động tạo `access_session` và trả về JWT mang quyền `SUPER_ADMIN`.
   * Cập nhật `openapi.yaml`: Điều chỉnh pattern mã OTP từ `^[0-9]{6}$` thành `^[0-9]{4,6}$`.

3. **Frontend (`LoginPage.tsx`)**:
   * Mở khóa input và nút bấm cho phép gửi mã 4 số `0000`.
   * Thêm nút bấm tắt: **"⚡ Đăng nhập nhanh Admin (admin@baicut.com / mã 0000)"**.
   * Tự động điều hướng thẳng vào trang `/admin` ngay sau khi đăng nhập thành công.

---

## 5. Dừng các phiên chạy (Process Cleanup)

* Đã dừng tiến trình Frontend dev server (Vite, cổng `5173`).
* Đã dừng tiến trình Backend Spring Boot (Tomcat, cổng `8080`).

---

## 6. Nhật ký thao tác Nhánh Git (Git Operations)

### 6.1. Xử lý lỗi không thể tạo nhánh có tiền tố `dev/`
* Ban đầu có yêu cầu đẩy code lên nhánh `dev/bai_nuoc_dai_than_thanh`.
* Khi đẩy lên GitHub, máy chủ GitHub trả về lỗi:
  ```text
  ! [remote rejected] dev/bai_nuoc_dai_than_thanh -> dev/bai_nuoc_dai_than_thanh 
  (cannot lock ref 'refs/heads/dev/bai_nuoc_dai_than_thanh': 'refs/heads/dev' exists; cannot create 'refs/heads/dev/bai_nuoc_dai_than_thanh')
  ```
* **Lý do kỹ thuật**: Trên repository GitHub, nhánh **`dev`** là Default branch (`HEAD`). Trong Git, tên nhánh là đường dẫn tệp tin (`refs/heads/dev`). Git không thể tạo thư mục `dev/` khi tệp `dev` đã tồn tại.

### 6.2. Các nhánh đã xóa (Purged Branches)
Đã xóa sạch tất cả các nhánh tạm thời trên cả Local và Remote GitHub:
* Đã xóa remote + local: `dev-bai_nuoc_dai_thanh_thanh`
* Đã xóa remote + local: `dev_bai_nuoc_dai_thanh_thanh`
* Đã xóa remote + local: `dev_bai_nuoc_dai_than_thanh`
* Đã xóa remote + local: `feature/bai_nuoc_dai_than_thanh`
* Đã xóa remote + local: `personal/bai_nuoc_dai_than_thanh`
* Đã xóa local: `dev/bai_nuoc_dai_than_thanh`

### 6.3. Nhánh chính thức duy nhất hiện tại
Toàn bộ mã nguồn hoàn chỉnh đã được đẩy lên nhánh hợp lệ duy nhất:
* 👉 **`fix/for_example_nothing`**
  * Backend: `https://github.com/michaeltran8386/gowithbae-be/tree/fix/for_example_nothing`
  * Frontend: `https://github.com/michaeltran8386/gowithbae-fe/tree/fix/for_example_nothing`
