# 04 — UI Options (PHASE 4)

**Vai trò:** Senior UI Designer · **Skill:** `frontend-design`, `web-design-guidelines`
**Mockup so sánh:** [mockups/04-ui-options.html](mockups/04-ui-options.html). Mở bằng trình duyệt; cần mạng để tải Google Fonts. Mockup tĩnh, dữ liệu và tên quán là ví dụ, ảnh là khung giữ chỗ. Đã kiểm tra hiển thị trong trình duyệt tích hợp ngày 16-11-2026.

## 4.1 Visual context audit

| Nguồn | Nội dung | Ràng buộc rút ra |
|---|---|---|
| File nguồn §2.4 [SRC] | Phong cách **trẻ trung, nhẹ nhàng, dễ thương**; **xanh da trời + trắng** chủ đạo; **cam nhạt** điểm xuyết theo logo; nút và thẻ **bo góc nhẹ** | Bắt buộc với cả 3 hướng. Không chọn nền tối/kem/đen làm chủ đạo |
| Logo (PNG 159 px nhúng trong file nguồn) | Chữ “GO” xanh trời có quầng sáng, hai trái tim (cam + xanh), chữ “GoWithBae” đậm màu tối | Màu đo từ pixel: xanh trời **#00B0F8**, quầng sáng **#BCE9FA**, cam đào **#FA9A6E**. Thiếu bản vector → OQ-01 |
| Repo hiện tại | Token tạm `#004885` (xanh navy), font Be Vietnam Pro; ghi là lấy từ mock Stitch, nhưng mock **không tồn tại** | Token cũ không có nguồn duyệt. `#004885` lệch “xanh da trời” → thay. Be Vietnam Pro hợp lý (thiết kế cho tiếng Việt, đủ dấu) → giữ |
| Kiểm tra tương phản | `#00B0F8` trên trắng 2,45:1, `#FA9A6E` trên trắng 2,12:1 | Hai màu logo **không dùng cho chữ thường/nút có chữ**. Cần sắc đậm: `#0070B8` (5,24:1), `#B4532A` (4,99:1) |
| Đối tượng | Cặp đôi, dùng điện thoại là chính (SRC §1.1, NFR-02) | Mobile-first; vùng chạm ≥44 px; một tay dùng được |

Chủ đề, người dùng và nhiệm vụ chính (theo `frontend-design`): **GoWithBae là công cụ giúp một cặp đôi chọn và hẹn một nơi đi chơi ở TP.HCM, dùng trên điện thoại, nhiệm vụ chính là đi từ “chưa biết đi đâu” đến “đã có lịch hẹn”.** Vật liệu thị giác của chủ đề này gồm bầu trời trong (từ logo), trái tim, tấm vé/thiệp hẹn, bưu thiếp địa điểm.

## 4.2 Ba hướng

Cả ba dùng **cùng bảng màu lõi** (từ logo) và **cùng nội dung**, để so sánh đúng ở quyết định thiết kế chứ không phải ở màu.

### Option A — Gọn & thực dụng

| Mục | Mô tả |
|---|---|
| Rationale | Ưu tiên rõ ràng và dễ làm: giao diện “công cụ”, mọi thứ đều quen thuộc |
| Navigation | Header chữ + bottom nav chỉ có chữ (không icon) |
| Page layout | Nền trắng, chia mục bằng đường kẻ mảnh; danh sách địa điểm dạng **hàng ngang** (ảnh nhỏ trái, chữ phải) |
| Typography | Be Vietnam Pro duy nhất, 2 độ đậm (400/600); tiêu đề nhỏ (20 px) |
| Color | Xanh `#0070B8` chỉ cho hành động/link; cam gần như không dùng; xanh nhạt hầu như vắng |
| Component | Bo 8 px đồng nhất; viền 1 px; không bóng đổ |
| Interaction | Mặc định của nền tảng; toast cho kết quả; lời nhắc là khung có vạch màu trái |
| Desktop/mobile | Cùng một cột nội dung, desktop chỉ rộng hơn (max 1152 px) |
| Pros | Làm nhanh nhất; ít CSS; dễ đạt tương phản; dễ bảo trì |
| Cons | Thiếu “trẻ trung, dễ thương” theo §2.4; logo cam/tim không có chỗ; dễ trông giống một app tra cứu chung chung |
| Complexity | Thấp |
| Risks | Không đạt cảm xúc thương hiệu mà khách mô tả → có thể phải làm lại visual sau nghiệm thu |

### Option B — Tối ưu hành trình

| Mục | Mô tả |
|---|---|
| Rationale | Sản phẩm là một **hành trình nhiều bước, hai người** (tìm → lưu → cùng chọn → hẹn → “Đi chưa?”). UI ưu tiên việc **đang dở** và **thông tin để quyết định** |
| Navigation | Bottom nav icon + chữ; header có chuông. Trang chủ mở bằng khu **“Tiếp tục”** (lời nhắc, phiên đang cùng chọn kèm tiến độ, buổi hẹn sắp tới), sau đó đến tìm kiếm |
| Page layout | Nền xanh xám rất nhạt `#F4F8FA`, nội dung trong khối trắng bo 14 px; chi tiết có **dải 3 thông tin quyết định** (giá 2 người · giờ hôm nay · khu vực) ngay dưới tên; desktop: kết quả 2 cột lọc/kết quả, chi tiết 2 cột với cột quyết định sticky |
| Typography | Be Vietnam Pro; số tiền dùng `tabular-nums` đậm để so nhanh; tiêu đề 20–24 px |
| Color | Xanh `#0070B8` cho hành động chính; xanh nhạt `#EAF7FD` cho hành động phụ; **cam đậm `#B4532A` chỉ cho trạng thái cần chú ý** (“Bạn chưa trả lời”); ink `#14324A` cho chip đang chọn |
| Component | Bo 10 px (nút) / 14 px (khối) / pill (chip lọc); bộ lọc nhanh cuộn ngang dưới ô tìm; vote dạng segmented 2 nút |
| Interaction | Tiến độ trả lời của cả hai; “Cả hai cùng thích” gắn ngay trên thẻ; nút chính cố định đáy ở chi tiết/bỏ phiếu |
| Desktop/mobile | Mobile: một cột, action bar đáy. Desktop: lưới + cột phụ sticky |
| Pros | Giảm bước (việc dở luôn ở trang chủ); thông tin quyết định lên trước; hợp nhiều trạng thái nghiệp vụ (WAITING/VOTING, lời nhắc); dễ mở rộng |
| Cons | Cá tính thương hiệu ở mức vừa; trang chủ phức tạp hơn khi có nhiều việc dở |
| Complexity | Trung bình |
| Risks | Khu “Tiếp tục” cần dữ liệu từ nhiều API (plans, sessions, reminders; một phần chờ CCR-02) → cần xử lý loading riêng từng khối |

### Option C — Bầu trời & vé hẹn

| Mục | Mô tả |
|---|---|
| Rationale | Dịch thẳng logo thành ngôn ngữ thị giác: **trời trong + trái tim**. Buổi hẹn là một **tấm vé** (vật thể quen trong văn hóa hẹn hò). Tạo cảm giác “dễ thương” đúng §2.4 |
| Navigation | Như A/B; header nằm trong dải trời ở trang chủ |
| Page layout | Trang chủ: dải trời gradient `#BCE9FA → trắng` có mây mờ, tiêu đề lớn “Hôm nay hẹn ở đâu?”, ô tìm dạng viên thuốc có quầng xanh; lời nhắc và buổi hẹn là **vé** có răng cưa hai bên và đường đục lỗ; ảnh chi tiết bo cong đáy 40 px |
| Typography | **Baloo 2** (tròn, có tiếng Việt) cho tiêu đề; Be Vietnam Pro cho nội dung |
| Color | Gradient trời từ quầng sáng của logo; **trái tim cam `#FA9A6E`** là biểu tượng “Thích” và “Đã đi X lần”; chữ cam dùng `#B4532A` |
| Component | Pill cho nút; thẻ bo 18 px; vote là nút trái tim |
| Interaction | Một khoảnh khắc chuyển động duy nhất: trái tim đầy lên khi Thích / khi xác nhận Đã đi (tắt khi `prefers-reduced-motion`) |
| Desktop/mobile | Dải trời co lại trên desktop; vé hẹn giữ nguyên tỉ lệ |
| Pros | Nhận diện mạnh, gắn logo; khác biệt so với app tra cứu địa điểm thông thường; đúng mô tả “trẻ trung, dễ thương” |
| Cons | Thêm 1 font (~30 kB); mask răng cưa và gradient cần kiểm tra Safari; nguy cơ quá “trẻ con” nếu lạm dụng |
| Complexity | Trung bình–cao |
| Risks | Cá tính phải giữ ở 2 điểm (dải trời, vé); nếu lan ra mọi thẻ sẽ rối và giảm khả năng đọc |

Các hướng khác nhau ở: cấu trúc trang chủ (danh sách vs “Tiếp tục” vs dải trời), cách trình bày địa điểm (hàng ngang vs khối quyết định vs bưu thiếp), cách bỏ phiếu (nút chữ vs segmented có tiến độ vs trái tim), typography (1 font/2 độ đậm vs số liệu tabular vs font tiêu đề tròn) và cách trình bày buổi hẹn (khung vs khối vs vé).

## 4.6 Design review

Thang 1–5 (5 tốt nhất), đánh giá của Agent, chưa test người dùng.

| Tiêu chí | A | B | C |
|---|---|---|---|
| Requirement coverage (FR, câu chữ bắt buộc, trạng thái) | 5 | 5 | 5 |
| Usability (giảm bước, thông tin quyết định) | 3 | **5** | 4 |
| Accessibility (tương phản, chạm, bàn phím) | 5 | 5 | 4 (gradient sau chữ, mask cần kiểm tra) |
| Visual consistency / brand fit §2.4 | 2 | 3 | **5** |
| Implementation effort (cao = ít công) | **5** | 4 | 3 |
| Scalability (thêm màn F2, G2) | 4 | **5** | 3 |
| Product fit (hành trình hai người) | 3 | **5** | 4 |
| **Tổng** | 27 | **32** | 28 |

## Đề xuất của Agent

**Chọn B làm nền, mượn đúng hai yếu tố của C (“B+”):**
1. **Tấm vé hẹn** cho thẻ lời nhắc “Đi chưa?” và đầu trang chi tiết buổi hẹn: đây là nơi cảm xúc thương hiệu có giá trị nhất, và là tính năng khách vừa chốt (CR-001).
2. **Trái tim cam của logo** cho trạng thái Thích và “Đã đi X lần”.

Giữ phần còn lại theo B (một font Be Vietnam Pro, không có dải trời gradient toàn trang).

Lý do:
- B giải quyết tốt nhất bài toán nhiều bước, hai người và nhiều trạng thái chờ.
- A không đạt mô tả phong cách của khách.
- C thuần dễ bị lạm dụng trang trí và tốn công hơn.
- B+ có cá tính ở đúng một chỗ, theo nguyên tắc “spend your boldness in one place”.

Nếu bạn muốn nhận diện mạnh hơn: chọn C và giới hạn Baloo 2 chỉ ở H1/H2.
