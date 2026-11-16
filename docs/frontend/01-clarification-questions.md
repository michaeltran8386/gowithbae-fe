# 01 — Clarification Questions (PHASE 1)

Mức ưu tiên: **BLOCKER** nghĩa là không thể thiết kế/triển khai đúng nếu thiếu · **IMPORTANT** nghĩa là ảnh hưởng đáng kể tới UX/logic · **OPTIONAL** nghĩa là có thể quyết định sau.
Không hỏi lại 3 nội dung CR-001 đã CONF (số lần đã đi; Bỏ qua lời nhắc chỉ đóng; xem link không đăng nhập).

> **Cập nhật 16-11-2026 (sau Gate 1):** A-01, A-02, A-03 đã được duyệt. Repo `gowithbae-fe` đã có contract OpenAPI, nên A-03 được hiểu lại: kiểu luôn lấy từ contract; mock chỉ là dữ liệu đúng kiểu cho endpoint còn 501. A-04 được trả lời bởi TECHSTACK của repo (SPA, không SSR). Xem `02-frontend-architecture.md` §0.

## Phần A — Câu hỏi riêng cho Frontend (chưa có trong SRS)

| QID | Requirement | Vấn đề | Tác động | Đề xuất của Agent | Ưu tiên |
|---|---|---|---|---|---|
| **A-01** | SRS §2.2, §14.2 | SRS chưa chọn framework. Master Prompt mặc định React. Cần chốt: **React + Vite SPA** (React Router) hay **Next.js** (SSR/SSG)? Thư mục đặt code (vd. `web/` trong workspace này)? Package manager? | Quyết định toàn bộ kiến trúc Phase 2, routing, cách xử lý SEO/link mời | **React 18/19 + TypeScript + Vite + React Router**, đặt ở `web/`, npm. Lý do: chưa có yêu cầu SEO, chưa có backend, prototype cần nhanh. Nếu A-04 = cần SEO thì chọn Next.js | **BLOCKER** |
| **A-02** | SRS §2.1, §14.2; nguồn §12.3 | Phạm vi giao lần này: (a) chỉ web khách G1 (F1), (b) F1 + quản trị (F2), hay (c) chỉ prototype bấm thử để PO duyệt? | Khối lượng, số màn hình, thứ tự milestone | **(a) F1 web khách đầy đủ trạng thái trên mock adapter**, đồng thời là prototype bấm thử theo §14.2. F2 làm sau khi chốt OQ-15/18/19/20 | **BLOCKER** |
| **A-03** | SRS §7.1 (“API… là tài liệu thiết kế riêng”) | Không có backend/OpenAPI/DTO. Có đội backend và lịch ra contract không? Ai sở hữu contract? | Không thể tích hợp API thật; nguy cơ FE “phát minh” contract | Tạo **typed adapter interface + mock in-memory** gắn nhãn `MOCK – không phải API thật`. Kiểu dữ liệu suy ra từ mô hình logic SRS §6 và được đánh dấu là giả định. Thay bằng client thật khi có contract | **BLOCKER** |
| A-04 | Không có | Trang khám phá/chi tiết công khai có cần SEO (index Google, chia sẻ preview link) không? Link mời bắt buộc `noindex` (RULE-12) | Chọn SPA hay SSR; meta/OG tags | Nếu là bản dùng thử thì **không cần SEO G1**; vẫn đặt `noindex` cho link mời và meta cơ bản | IMPORTANT |
| A-05 | Mọi [PROP] | Trong prototype, các hành vi PROP (ranh giới giá, hạn link 7 ngày, chốt nhất quán, OTP email…) xử lý thế nào? | Nếu ẩn, PO không bấm thử được; nếu hard-code, có thể bị hiểu nhầm là đã duyệt | **Dùng PROP làm mặc định trong file cấu hình riêng**, ghi chú `PROP – chờ duyệt` trong code và docs; UI không khẳng định là chính sách | IMPORTANT |
| A-06 | NFR-02, A01–A06 | Quản trị có cần dùng tốt trên mobile 360 px như web khách không? | Layout bảng/form quản trị | Quản trị **desktop-first (≥1024 px)**, ở mobile vẫn dùng được (không tràn, cuộn ngang bảng có kiểm soát). Web khách **mobile-first** | IMPORTANT |
| A-07 | NFR-03 | Không có chuẩn đo tiếp cận. Có dùng WCAG 2.2 AA làm **mục tiêu kiểm tra nội bộ** (không tuyên bố chứng nhận)? | Tiêu chí QA Phase 6, màu tương phản | Có: WCAG 2.2 AA làm checklist nội bộ | IMPORTANT |
| A-08 | FR-18, CR-001 DEC-02 | Lời nhắc “Đi chưa?” hiển thị dạng gì, ở đâu? Khách nói “không cần popup khác”. Bản thân lời nhắc có được là modal không? | UX quan trọng nhất của CR-001 | **Thẻ/banner inline không chặn** (không modal) ở đầu trang chủ và trên trang Buổi hẹn tương ứng; 2 nút “Đã đi” / “Bỏ qua lời nhắc” | IMPORTANT |
| A-09 | FR-06 | Giỏ so sánh của khách lưu ở đâu: trong tab, trên trình duyệt (localStorage), có giữ sau khi đăng nhập? | Hành vi khi tải lại trang | Lưu **localStorage trên thiết bị**, giữ sau đăng nhập, không gửi server | OPTIONAL |
| A-10 | FR-35 | “Đã đi X lần” khi X = 0: ẩn hay hiện “Chưa đi lần nào”? | Hiển thị chi tiết địa điểm | **Ẩn khi X = 0** | OPTIONAL |
| A-11 | §8 [PROP] | Duyệt việc quay lại đúng thao tác dở (lưu, lên kế hoạch) sau khi đăng nhập? | Luồng auth | Có: giữ intent + URL quay lại | IMPORTANT |
| A-12 | FR-04, OQ-05/22 | Prototype có cần bản đồ thật không, khi nhà cung cấp chưa chọn? | Phụ thuộc thư viện/API key | Dùng **Leaflet + OpenStreetMap** (không cần key) cho prototype, cô lập sau interface `MapView` để đổi nhà cung cấp; hoặc placeholder nếu không muốn phụ thuộc | OPTIONAL |
| A-13 | Không có | Dark mode? | Token màu | **Không làm ở G1** (không có yêu cầu) | OPTIONAL |
| A-14 | Không có | i18n: chỉ tiếng Việt. Có cần chuẩn bị đa ngôn ngữ? | Cấu trúc chuỗi | **Không dùng thư viện i18n**; gom chuỗi UI theo feature để dễ tách sau | OPTIONAL |

## Phần B — OQ của SRS, xếp lại theo tác động Frontend

Chi tiết câu hỏi và owner tại SRS §13. Cột “Đề xuất” là cách Frontend xử lý **khi chưa có câu trả lời**, không phải đề xuất chính sách.

| QID | Requirement | Vấn đề (rút gọn) | Tác động FE | Đề xuất xử lý tạm | Ưu tiên (FE) |
|---|---|---|---|---|---|
| OQ-01 | §8, NFR | Logo gốc dạng vector, mã màu, font, khu vực thử nghiệm, danh mục khu vực | Design system Phase 4 | Dùng logo PNG 159 px trích từ file nguồn chỉ để tham khảo; trích màu gần đúng; cần **file SVG/AI** + mã màu chính thức | **BLOCKER** (thiết kế cuối) |
| OQ-03 | FR-03, RULE-03 | Giá chuẩn 2 người; “Miễn phí” có thuộc “dưới 200k”; biên 700k | Bộ lọc ngân sách, nhãn giá | UI 5 khoảng theo nguồn; ranh giới đặt trong mock (PROP) | BLOCKER (logic) / không chặn UI |
| OQ-04 | FR-02/03/15, RULE-05 | Relevance, tìm rỗng, giờ qua đêm, lọc thời điểm | Kết quả tìm, cảnh báo giờ khi lên kế hoạch | Mock xử lý đơn giản có nhãn; UI không phụ thuộc công thức | BLOCKER (logic) |
| OQ-05 | FR-03/04 | Khu vực vs tâm+bán kính; đơn vị/giới hạn bán kính; khoảng cách thẳng hay đường đi | UI chọn vị trí, nhãn khoảng cách | UI cho phép 1 trong 2 chế độ (loại trừ nhau), chưa có slider bán kính cố định | IMPORTANT |
| OQ-06 | FR-07, RULE-16 | Phương thức đăng nhập, hạn mã, gửi lại | Màn hình đăng nhập | Dựng email + OTP [PROP] với đếm ngược gửi lại cấu hình được | IMPORTANT (UI) / BLOCKER (production) |
| OQ-07 | FR-10–14 | Hạn link; sửa tập trước khi tham gia; **xem phiếu của nhau**; thay người nhận | Màn hình kết quả cùng chọn | Mặc định chỉ hiện nhóm trùng + phiếu của chính mình; công tắc cấu hình cho “xem phiếu đối phương” | **BLOCKER** (UC-009 UI) |
| OQ-08 | FR-13 | Điều kiện chốt; một phiên bao nhiêu plan | Nút “Chốt” khi nào được bật | [PROP] chỉ chủ tạo, sau khi có người nhận, 1 plan/phiên; cấu hình được | **BLOCKER** (UC-010) |
| OQ-09 | FR-11/14 | Hết hạn link với phiên đã tham gia; quyền xem plan sau thu hồi; chia sẻ plan trực tiếp | Màn hình plan của người nhận | Chưa làm “chia sẻ plan trực tiếp”; plan người nhận chỉ xem khi grant còn hiệu lực | IMPORTANT |
| OQ-10 | FR-16/18/35 | Mốc Past; sửa/hủy plan đã qua giờ; **ai được trả lời “Đi chưa?”** (chủ tạo hay cả người nhận) | Ai thấy lời nhắc; nút sửa sau giờ | [Giả định] chỉ chủ tạo (có tài khoản) thấy nhắc và đếm; plan qua giờ chỉ xem | **BLOCKER** (UC-014 actor) |
| OQ-11 | FR-05/09/10/13/16 | Nơi bị ẩn hiển thị gì trong list/phiên/plan cũ | Trạng thái “Nơi không còn hiển thị” | Thẻ xám + tên + cảnh báo, chặn hành động mới | IMPORTANT |
| OQ-12 | FR-17 | Thêm lịch: file .ics hay OAuth | Nút “Thêm vào lịch” | [PROP] tải .ics một lần + lưu ý cập nhật thủ công | IMPORTANT |
| OQ-13 | FR-20/29 | Ticket đã đóng có trả lời/mở lại được | Ô trả lời khi Đã đóng | Ẩn ô trả lời khi Đã đóng, hướng dẫn tạo yêu cầu mới | IMPORTANT |
| OQ-14 | FR-21 | Loại thông báo, đọc/chưa đọc | Badge, danh sách | [PROP] có trạng thái đọc; badge số chưa đọc | IMPORTANT |
| OQ-21 | nhiều | Giới hạn độ dài/tệp/quota | Validation form, test biên | Đặt hằng số cấu hình tạm, ghi `TBD OQ-21` | IMPORTANT |
| OQ-25 | FR-18/35 | Sửa xác nhận, nhắc lại sau đổi giờ, lượt ngoài kế hoạch | Nhánh phụ của lời nhắc | Không làm nhánh này trong F1 | OPTIONAL (F1) |
| OQ-15 | FR-23/24 | Phiên bản nội dung công khai, khôi phục | Workflow quản trị | Chờ trước F2 | BLOCKER (F2) |
| OQ-18 | §3.1, FR-25–27/31/33 | Ma trận quyền chi tiết, vai trò kép | Menu/route quản trị | Chờ trước F2 | BLOCKER (F2) |
| OQ-19 | FR-30 | Chính sách commit CSV | Màn hình import | Chờ trước F2 | BLOCKER (F2) |
| OQ-20 | FR-32–34 | Công thức báo cáo, định danh, whitelist sự kiện | Báo cáo, instrumentation | F1 chỉ dựng lớp `track()` no-op/log có whitelist | BLOCKER (F2) |
| OQ-17 | FR-08, RULE-17 | Xóa/khóa tài khoản, retention | Thông điệp xóa tài khoản | UI ghi “đã nhận yêu cầu”, không tuyên bố đã xóa | OPTIONAL (FE) |
| OQ-02, 16, 22, 23 | — | KPI, SLA, hạ tầng, người duyệt | Không trực tiếp | Cần OQ-23 (người duyệt thiết kế) trước Gate 2 | OPTIONAL (FE) |
| OQ-24 | G2 | — | Không áp dụng | — | N/A |

## Tóm tắt: cần người dùng trả lời trước Phase 2

1. **A-01** stack và vị trí code · **A-02** phạm vi giao · **A-03** chiến lược API/mock
2. Nên trả lời luôn: **A-05** (PROP trong prototype), **A-08** (dạng lời nhắc), **OQ-07/08/10** (hoặc đồng ý để FE dùng mặc định có nhãn như cột “Đề xuất”)
3. Trước Phase 4: **OQ-01** tài sản thương hiệu
