# 01 — Requirement Analysis (PHASE 1)

**Ngày:** 16-11-2026 · **Vai trò:** Senior BA + Product Manager, góc nhìn Frontend
**Trạng thái:** Chờ APPROVAL GATE 1. Chưa có code Frontend.

## 1.1 Requirement Discovery

### Tài liệu tìm thấy

| Tài liệu | Version / ngày | Vai trò | Ghi chú |
|---|---|---|---|
| `GoWithBae_Yeu_cau_san_pham_v1.md` | Bản đề xuất 12-11-2026 | **Nguồn gốc của khách hàng** | SHA-256 `CC17DB1E…452F5E` khớp với giá trị ghi trong SRS, tức file chưa bị sửa. Có logo nhúng base64 (159×159 PNG) |
| `docs/requirements/GoWithBae_Requirements_G1_v1.1.md` | **1.1 / 15-11-2026** | **SRS chính, bản mới nhất**. Dùng làm nguồn sự thật | Draft, chờ khách duyệt nghiệp vụ; gồm 35 FR, 30 RULE, 12 NFR, 25 OQ, CR-001 |
| `docs/requirements/GoWithBae_Requirements_G1_v1.0.md` | 1.0 / 13-11-2026 | Bản trước, giữ để đối chiếu | Đã được v1.1 thay thế, không dùng |
| `docs/specs/UC-001…UC-027*.md` (+ `.mermaid`, `-tasks.md`) | 1.1 / 15-11-2026 | 27 use case, 58 AC Given/When/Then, sequence/state | Theo v1.1 |
| `docs/requirements/Gap_Analysis.md`, `Verification_Report.md`, `Implementation_Backlog.md`, `traceability.json` | 15-11-2026 | Gap, blocker, backlog, truy vết máy đọc | Theo v1.1 |
| `.publish/GoWithBae/**` | 15-11-2026 22:55 | Bản sao để publish | Nội dung SRS v1.1 **trùng khớp**, chỉ khác link tương đối → GitHub. Không phải version mâu thuẫn |

**Kết luận version:** không có mâu thuẫn version. v1.1 là bản chính, và README của bộ tài liệu cũng xác nhận điều này. v1.0 chỉ để tham khảo lịch sử.

**Không tìm thấy:** codebase ứng dụng (không có `package.json`/`src`), OpenAPI/endpoint/DTO, mock contract, Figma/style guide, design token, file logo vector. SRS §2.2 ghi rõ *“chưa chọn framework, cơ sở dữ liệu, cơ chế token, nhà cung cấp, thiết kế API”*.

### Phân loại mức ràng buộc (giữ nguyên nhãn của SRS)

| Nhãn | Ý nghĩa với Frontend |
|---|---|
| **[SRC]** | Có trong tài liệu khách nhưng chưa ký duyệt. Thiết kế theo, đánh dấu “chờ baseline” |
| **[CONF]** | Đã xác nhận. Gồm: phạm vi web G1 + quản trị; G2 chỉ định hướng; CR-001 (số lần đã đi, Bỏ qua lời nhắc chỉ đóng, xem link không cần đăng nhập) |
| **[DER]** | Hệ quả phân tích. Dùng được làm hành vi UI nhưng cần PO xem lại |
| **[PROP]** | Đề xuất. **Không được** hard-code thành chính sách. Frontend phải cô lập thành cấu hình |
| **[TBD]/OQ** | Chưa có. Không suy đoán; UI dùng placeholder có nhãn hoặc tạm loại khỏi phạm vi |

Lưu ý từ nguồn: file khách ghi chú *“(\*) là phần viết để dễ hình dung, không cần làm vì đây chỉ là bản dùng thử đơn giản”*. Các mục (\*) đều thuộc G2/đối tác. Tín hiệu này cho thấy G1 được kỳ vọng là **bản dùng thử**, ảnh hưởng tới đề xuất phạm vi Frontend (§1.7).

## 1.2 Product Understanding

**Vision:** nền tảng giúp cặp đôi tìm địa điểm hẹn hò theo ngân sách, vị trí, sở thích, thời gian; so sánh; cùng chọn; lưu kế hoạch. Thay cho việc tự gom thông tin từ Facebook/TikTok, vốn chỉ hiện bài viral. [SRC §1]

**Business objectives:** BR-01 đến BR-07 (SRS §1.3): tìm đúng theo bộ lọc, so sánh trên cùng tiêu chí, hai người cùng chọn nhưng người tạo quyết định, kế hoạch riêng tư, dữ liệu đáng tin có duyệt, đo được hành trình, web thuận tiện cho điện thoại. **KPI định lượng: chưa có (OQ-02).**

**Target users (theo bằng chứng):**

| Nhóm | Bằng chứng | Nhu cầu chính |
|---|---|---|
| Khách chưa đăng nhập | SRC §2.1 | Tìm, lọc, xem, so sánh; mở link mời |
| Thành viên (một người trong cặp đôi) | SRC §2.1 | Lưu, tạo lời mời cùng chọn, lập/quản lý buổi hẹn, hỗ trợ |
| Người nhận link (khách hoặc thành viên) | CONF CR-001 | Xem/bỏ phiếu không cần tài khoản |
| Nhân sự nội bộ: Biên tập, Duyệt nội dung, Hỗ trợ, Quản trị cao nhất | SRC §7.2 | Duy trì dữ liệu, xử lý báo sai/hỗ trợ, phân quyền, báo cáo |

*Persona chi tiết (tuổi, thiết bị, thói quen): **chưa có bằng chứng**, không tự tạo. Giả định thiết kế duy nhất có căn cứ: mobile-first (SRC §1.1 “web dùng tốt trên điện thoại trước”, NFR-02 360 px).*

**Pain points (nguồn):** lựa chọn ít, thiên về viral; phải tự tổng hợp và so sánh; khó thống nhất giữa hai người; thông tin giá/giờ không đáng tin.

**Use case chính:** Khám phá → lọc → chi tiết → so sánh/lưu → mời cùng chọn → chốt → kế hoạch → chỉ đường/lịch → sau giờ hẹn “Đi chưa?” → số lần đã đi.

**Scope G1 (CONF):** web khách responsive tiếng Việt + quản trị nội bộ (SRS §2.1).
**Out-of-scope:** toàn bộ G2 (đối tác, gói/suất, đặt chỗ, thanh toán, đánh giá, app native), chat/realtime, mạng xã hội, AI, lịch trình nhiều điểm, chia tiền… (SRS §2.2).
**MVP vs future:** SRS chưa tách MVP trong G1. Backlog đề xuất 7 đợt phụ thuộc (0–6). G2 là future.
**Success criteria:** AC-P01 đến AC-P13 (SRS §12.1) và 58 AC cấp UC. Chưa có tiêu chí kinh doanh.

## 1.3 Functional Analysis

Phân tích đầy đủ từng FR (actor, pre/trigger, main/alt/exception, post, quyền, I/O, validation, rule, AC) nằm tại **[01-functional-matrix.md](01-functional-matrix.md)**. Tóm tắt theo module:

| Module | FR | UC | Actor chính | Mức sẵn sàng thiết kế UI |
|---|---|---|---|---|
| M1 Khám phá & tìm kiếm | FR-01–04 | UC-001 | Khách | Layout & luồng: **được**. Logic lọc giá/giờ/vị trí: **chặn** OQ-03/04/05 |
| M2 Chi tiết & so sánh | FR-05–06 | UC-002–003 | Khách | **Được**, trừ trạng thái nơi ẩn (OQ-11) |
| M3 Tài khoản | FR-07–08 | UC-004–005 | Thành viên | Màn hình **được** với giả định OTP email [PROP]. Production **chặn** OQ-06/17 |
| M4 Đã lưu | FR-09 | UC-006 | Thành viên | **Được** |
| M5 Cùng chọn & chia sẻ | FR-10–14 | UC-007–011 | Thành viên, người nhận | Luồng xem/tham gia khách **CONF**. Chốt/hết hạn/phiếu riêng **chặn** OQ-07/08/09 |
| M6 Buổi hẹn & lời nhắc | FR-15–18, FR-35 | UC-012–014, UC-027 | Thành viên | Lời nhắc & đếm **CONF**. Trạng thái Past/actor trả lời **chặn** OQ-10/25. Lịch OQ-12 |
| M7 Báo sai, hỗ trợ, thông báo | FR-19–21 | UC-015–017 | Khách/thành viên | **Được**, trừ trạng thái đóng/mở lại (OQ-13) và đọc/chưa đọc (OQ-14) |
| M8 Quyền riêng tư | FR-22 | Nhiều UC | Hệ thống | Xuyên suốt. Frontend chỉ phản ánh; quyền thật ở server |
| M9 Quản trị nội dung | FR-23–26, FR-30 | UC-018–021, UC-023 | Nhân sự | **Chặn** phần workflow OQ-15/18/19 |
| M10 Quản trị tài khoản, báo sai, hỗ trợ | FR-27–29, FR-31 | UC-022, 024, 025 | Nhân sự | **Chặn** ma trận quyền OQ-18 |
| M11 Analytics & báo cáo | FR-32–34 | UC-026 | Nhân sự / hệ thống | **Chặn** công thức OQ-20. Instrumentation client cần whitelist |

## 1.4 Non-functional Analysis (phần liên quan Frontend)

| Nhóm | Yêu cầu có trong tài liệu | Trạng thái | Tác động Frontend |
|---|---|---|---|
| Performance | NFR-01: tìm kiếm ≤2 s p95 (1.000 nơi, 100 người) | **Đề xuất, chưa cam kết** | Chủ yếu là backend. FE: tránh waterfall, skeleton, debounce không tạo lượt tìm theo ký tự (FR-32) |
| Responsiveness | NFR-02: 360 px → desktop; không tràn chữ/nút/bảng | **Phải** | Mobile-first; bảng so sánh có dạng mobile tương đương (UI04); bộ lọc mobile là sheet riêng có Áp dụng/Xóa bộ lọc |
| Accessibility | NFR-03: bàn phím, nhãn, alt, lỗi rõ, tương phản dễ đọc | **Phải**, không tuyên bố chứng nhận chuẩn | Semantic HTML, focus visible, lỗi gắn trường. Chuẩn đo (vd. WCAG 2.2 AA) **chưa được nêu** → hỏi |
| Security & privacy | NFR-04–07, FR-22, RULE-27 | **Phải** | Không dựa vào ẩn nút; không lưu token ở nơi lộ; không đưa invite token vào analytics/log; `noindex` cho trang link mời; không theo dõi vị trí liên tục |
| Reliability | NFR-08: không tạo trùng khi bấm lặp/đồng thời | **Phải** [DER] | Khóa nút khi đang xử lý; idempotency key do backend định nghĩa; không báo thành công khi chưa chắc |
| Browser compat | Chrome/Safari/Edge hiện hành lúc bàn giao | **Phải**; danh sách thiết bị OQ-22 | Không dùng API chưa hỗ trợ Safari |
| Localization | Tiếng Việt, VND, giờ Việt Nam | **Giả định nguồn**, chốt OQ-01 | Format tiền/giờ theo `vi-VN`, `Asia/Ho_Chi_Minh`; tìm không dấu (backend). Đa ngôn ngữ: không yêu cầu |
| SEO | Không có yêu cầu SEO trực tiếp. RULE-12: link mời **không index** | Một phần | Trang công khai (khám phá/chi tiết) có thể hưởng lợi từ SEO nhưng **chưa có yêu cầu** → hỏi, vì ảnh hưởng chọn SPA hay SSR |
| Maintainability | §14.3 yêu cầu bàn giao mã nguồn, hướng dẫn | Phải | TypeScript, cấu trúc theo feature, test |
| Client scalability | Không có quota số list/phiên (OQ-21) | TBD | Phân trang/virtual list sẽ quyết định ở Phase 2 khi có contract |
| Monitoring | NFR-11: lỗi có mã truy vết | Phải | UI hiển thị mã tra cứu lỗi từ server; công cụ giám sát chưa chọn |

Không tự đặt thêm chỉ tiêu (Lighthouse score, LCP…) vì tài liệu không có.

## 1.5 Gap & Ambiguity

Bảng đầy đủ tại **[01-clarification-questions.md](01-clarification-questions.md)**. Gồm hai phần:
- **Phần A: câu hỏi riêng của Frontend** chưa có trong SRS (stack, phạm vi giao hàng, backend/API, admin responsive, a11y chuẩn, SEO, vị trí lời nhắc…).
- **Phần B: OQ của SRS** được xếp lại theo mức chặn đối với Frontend. Không hỏi lại các mục CR-001 đã CONF.

## 1.6 Traceability

Ma trận FR → Screen → User flow → Component → API → Test tại **[01-requirement-traceability.md](01-requirement-traceability.md)**. Screen dùng mã nguồn UI01–UI08, A01–A06 (mã S-xx cuối cùng sẽ cấp ở Phase 2). Component và API để “TBD Phase 2”; API ghi rõ **chưa có contract**.

## 1.7 Đề xuất phạm vi Frontend (chờ duyệt)

Căn cứ: (1) toàn bộ SRS vẫn **Draft**, nhiều OQ chặn logic; (2) SRS §14.2 và nguồn §12.3 yêu cầu *“thiết kế màn hình/luồng có thể bấm thử, kể cả empty/error, được thống nhất trước khi xây giao diện”*; (3) không có backend/API; (4) nguồn coi G1 là “bản dùng thử”.

**Đề xuất: giao theo 2 bậc.**

| Bậc | Nội dung | Dữ liệu | Mục đích |
|---|---|---|---|
| **F1 (đề xuất làm trước)** | Web khách G1 đầy đủ màn hình UI01–UI08: khám phá, kết quả, chi tiết, so sánh, đã lưu, cùng chọn (gồm xem link bằng phiên khách), buổi hẹn + lời nhắc “Đi chưa?” + “Đã đi X lần”, đăng nhập/hồ sơ, báo sai, hỗ trợ, thông báo. Mọi loading/empty/error | **Mock adapter có kiểu (typed), gắn nhãn “dữ liệu minh họa”** (RULE-28, NFR-12); hành vi PROP/TBD đặt trong cấu hình có nhãn | Prototype bấm thử được để PO duyệt (đáp ứng §14.2); khung code dùng tiếp khi có API |
| **F2** | Quản trị A01–A06 | Mock adapter | Sau khi chốt OQ-15/18/19/20 |
| **Sau F1/F2** | Thay mock bằng API thật | API contract từ đội backend | Khi có contract |

Ngoài phạm vi Frontend: mọi G2; kiểm tra quyền thật (server); gửi email/OTP thật; tính toán báo cáo (server).

**Quyết định cần người dùng xác nhận:** xem [01-clarification-questions.md](01-clarification-questions.md) Phần A, các mục A-01 đến A-03 là BLOCKER cho Phase 2.
