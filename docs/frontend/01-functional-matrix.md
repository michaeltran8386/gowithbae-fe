# 01 — Functional Matrix (PHASE 1)

Nguồn: SRS v1.1 §4–§5 và UC tương ứng. Bảng này là phân tích cho Frontend; **chi tiết AF/EX đầy đủ nằm trong file UC**. Mọi UC đều có 4 exception chuẩn: **EX-01** quyền/PRE không đạt, **EX-02** vi phạm validation/rule, **EX-03** đọc/ghi thất bại (không báo thành công, có mã tra cứu, giữ input), **EX-04** side effect sau thành công lỗi (giữ kết quả). Dưới đây chỉ ghi các trigger đặc thù.

Ký hiệu trạng thái: ✅ CONF/SRC rõ · ⚠️ có PROP (cô lập bằng cấu hình) · ⛔ phụ thuộc OQ chặn.

Actor: **K** = Khách · **TV** = Thành viên · **NN** = Người nhận link · **BT** = Biên tập · **DN** = Duyệt nội dung · **HT** = Hỗ trợ · **QT** = Quản trị cao nhất · **SYS** = hệ thống.

---

## M1 — Khám phá & tìm kiếm

### FR-01 Khám phá · UC-001 · ✅/⛔OQ-01
- **Actor:** K, TV · **Trigger:** mở trang chủ, chọn bộ sưu tập/hoạt động
- **Pre:** không cần đăng nhập · **Post:** hiện bộ sưu tập trong lịch hiển thị + nơi đã duyệt đang hiển thị
- **Main:** mở trang → thấy ô tìm, khu vực, ngân sách, hoạt động, bộ sưu tập → chọn để vào kết quả
- **Alt:** chọn bộ sưu tập → danh sách theo thứ tự cấu hình (AC-041) · **Exc:** trống/lỗi có hướng dẫn và thử lại; không lộ nháp/nơi ẩn (AC-042)
- **Quyền:** công khai · **I/O:** vào = lựa chọn bộ lọc nhanh; ra = collections, nhóm hoạt động
- **Validation/Rule:** RULE-01 · **AC:** AC-P01, AC-041, AC-042

### FR-02 Tìm kiếm · UC-001 · ⚠️⛔OQ-04
- **Actor:** K, TV · **Trigger:** gửi từ khóa (không tính theo ký tự)
- **Main:** nhập từ khóa tên/khu vực/hoạt động (không dấu, không phân biệt hoa thường) → danh sách thẻ: ảnh, tên, khu vực, giá 2 người, tối đa 3 nhãn, nút Lưu/So sánh
- **Sắp xếp mặc định:** khớp từ khóa → xác minh mới hơn → mã ổn định. **Công thức mức khớp & tìm rỗng: OQ-04**
- **Exc:** 0 kết quả: giữ nguyên điều kiện, gợi ý nới (chỉ nới khi người dùng chọn)
- **Output analytics:** `search_submitted`, `results_shown` (search_id [PROP])
- **AC:** AC-001, AC-P01

### FR-03 Bộ lọc · UC-001 · ⛔OQ-03/04/05
- **Input:** khu vực hoặc tâm+bán kính; ngân sách (5 khoảng); ngày giờ; 7 nhóm nhãn (§5.1 SRS)
- **Rule:** RULE-02 (giữa nhóm AND; hoạt động/phong cách/cảnh quan/dịp OR; không khí/đặc điểm/tiện ích AND); RULE-03 giá chuẩn 2 người (ranh giới: PROP, OQ-03); RULE-04 thiếu dữ liệu **không** đạt lọc; RULE-05 giờ + ngoại lệ
- **UI bắt buộc:** ghi rõ quy tắc AND/OR cạnh nhóm lọc (SRC §3.3); mobile mở bảng riêng có **Áp dụng**/**Xóa bộ lọc** (UI02)
- **Exc:** 0 kết quả giữ điều kiện · **AC:** AC-001, AC-002, AC-P01–02

### FR-04 Sắp xếp & bản đồ · UC-001 · ⛔OQ-05
- **Main:** sắp mặc định/gần nhất/giá tăng; chuyển danh sách ↔ bản đồ; điểm xuất phát do người dùng cung cấp
- **Rule:** giá chưa rõ xếp cuối; khoảng cách chỉ hiện khi có điểm gốc, gắn nhãn “ước tính”, không gọi là thời gian đi
- **Alt/Exc:** từ chối vị trí → nhập thủ công; bản đồ lỗi → danh sách vẫn dùng, bộ lọc không đổi (AC-002)
- **Privacy:** không theo dõi vị trí liên tục (NFR-07)

## M2 — Chi tiết & so sánh

### FR-05 Chi tiết địa điểm · UC-002 · ✅/⛔OQ-11
- **Actor:** K, TV · **Pre:** nơi được phép xem · **Trigger:** mở chi tiết theo mã chi nhánh
- **Thứ tự nội dung bắt buộc:** ảnh/tên → giá → trải nghiệm → tiện ích → giờ/địa chỉ → lưu ý → ngày cập nhật
- **Hành động:** gọi, chỉ đường, lưu, so sánh, chọn để lên kế hoạch, báo sai. **TV** xem “Đã đi X lần” (FR-35)
- **Rule:** RULE-04 thiếu = “Chưa có thông tin”; không hiển thị “miễn phí/đang mở/số sao” giả (AC-003)
- **Exc:** nơi ẩn qua URL trực tiếp → không trả nội dung (AC-004); hiển thị cho người có lịch sử: OQ-11
- **Analytics:** `place_viewed` · **AC:** AC-003, AC-004, AC-P03

### FR-06 So sánh · UC-003 · ✅
- **Actor:** K, TV · **Input:** 2–3 mã khác nhau
- **Main:** thêm từ thẻ/chi tiết → bảng: giá 2 người, khu vực/khoảng cách, giờ, hoạt động, không khí, tiện ích, đặt trước
- **Rule:** RULE-06; trùng không thêm lần 2; nơi thứ 4 bị chặn kèm hướng dẫn bỏ bớt (AC-005); <2 gợi ý thêm; thiếu trường ghi “Chưa có thông tin”, **không** đổi thành “Không có” (AC-006)
- **Alt:** K chọn nơi để lên kế hoạch → phải đăng nhập trước khi lưu (quay lại thao tác [PROP])
- **UI:** mobile có biểu diễn tương đương, cùng hàng tiêu chí (UI04) · **Analytics:** `comparison_opened`
- **Lưu trạng thái giỏ so sánh** của khách (client-only): chưa quy định → câu hỏi A-09

## M3 — Tài khoản

### FR-07 Đăng nhập · UC-004 · ⚠️⛔OQ-06
- **Actor:** người muốn đăng nhập · **Main [PROP]:** nhập email → nhận mã một lần → nhập mã → tạo phiên
- **Validation:** RULE-16: mã một lần, có hạn, giới hạn gửi lại/nhập sai (tham số OQ-06)
- **Exc:** mã sai/hết hạn/đã dùng → không cấp phiên, hướng dẫn lấy mã mới (AC-008); email lỗi → thử lại
- **Không hỏi:** tình trạng quan hệ/thông tin người yêu · **AC:** AC-007, AC-008
- **FE note:** quay lại thao tác dở sau đăng nhập [PROP §8]

### FR-08 Hồ sơ · UC-005 · ⛔OQ-17/21
- **Actor:** TV · **Main:** sửa tên, ảnh (tùy chọn); đổi email (xác minh email mới trước, AC-009); đăng xuất; yêu cầu xóa tài khoản
- **Rule:** RULE-17; xóa = thu hồi phiên + link riêng (AC-010); không tuyên bố xóa xong khi mới nhận yêu cầu
- **Exc:** tài khoản bị khóa → chặn sửa; giới hạn ảnh OQ-21

## M4 — Đã lưu

### FR-09 Danh sách đã lưu · UC-006 · ✅/⛔OQ-21
- **Actor:** TV (K bấm Lưu → yêu cầu đăng nhập, AC-056) · **Main:** tạo/đổi tên/xóa danh sách; thêm/bỏ địa điểm
- **Rule:** RULE-07: riêng tư; cặp list–place duy nhất (thêm lại không tạo item mới, không tính lượt lưu, AC-011); xóa list không xóa plan/place (AC-012)
- **Alt:** nơi đã ẩn → vẫn hiện tên + cảnh báo, không chọn mới
- **Analytics:** `place_saved` chỉ khi thành công · **Quota:** OQ-21

## M5 — Cùng chọn & chia sẻ

### FR-10 Tạo lời mời · UC-007 · ⚠️⛔OQ-07/11
- **Actor:** TV · **Input:** 2–5 nơi đã lưu · **Main:** chọn nơi → tạo phiên → nhận link khó đoán → chia sẻ
- **Rule:** RULE-08 (sai số lượng: “Hãy chọn từ 2 đến 5 địa điểm”, AC-014); **cảnh báo bắt buộc**: ai có link hợp lệ đều xem được và có thể chiếm suất (AC-013); hạn 7 ngày là **PROP**
- **Không lộ** toàn bộ danh sách cá nhân · **Analytics:** `invite_created`

### FR-11 Tham gia · UC-008 · ✅CONF CR-001 / ⛔OQ-07/09
- **Actor:** NN (không cần tài khoản) · **Trigger:** mở link
- **Main:** mở link → **xem ngay, không redirect đăng nhập** (AC-055) → nhập tên hiển thị → tham gia → hệ thống giữ **phiên khách theo link**
- **Alt:** chỉ xem, không tham gia; đã có phiên khách → vào thẳng; bấm Lưu yêu thích → yêu cầu đăng nhập, không làm mất quyền xem (AC-056)
- **Exc:** link hết hạn/thu hồi → “Liên kết không còn hiệu lực”, không lộ nội dung (AC-016); suất đã có người → giải thích, liên hệ chủ tạo; 2 người cùng tham gia → chỉ 1 thành công (AC-015); tên rỗng/chỉ khoảng trắng → lỗi trường
- **Validation:** display_name bắt buộc, độ dài OQ-21 · **Rule:** RULE-08/09/12/30

### FR-12 Bỏ phiếu & kết quả · UC-009 · ⛔OQ-07/08
- **Actor:** TV (chủ tạo), NN · **Main:** chọn Thích/Bỏ qua từng nơi; sửa được trước chốt
- **Rule:** RULE-10: chưa chọn = “Chưa trả lời”, **không** phải Bỏ qua (AC-017); chỉ cả hai Thích mới là nhóm trùng; không tự chốt
- **Alt:** không có nơi trùng → gợi ý chọn lại hoặc tạo phiên mới
- **Exc:** phiên đã chốt / quyền bị thu hồi → phiếu không đổi, hướng dẫn (AC-018)
- **Mở:** có xem phiếu riêng của nhau không (OQ-07) · **Analytics:** `vote_submitted`
- **Phân biệt UI:** “Bỏ qua” (lá phiếu) ≠ “Bỏ qua lời nhắc” (FR-18)

### FR-13 Chốt từ phiên · UC-010 · ⛔OQ-08
- **Actor:** chủ tạo · **Main:** chọn nơi cuối → điền ngày giờ/ghi chú → lưu kế hoạch → phiên chuyển chỉ xem
- **Rule:** RULE-11; [PROP] lưu plan + chốt là một thao tác nhất quán; lưu thất bại → **không** báo chốt (AC-020); không tự chọn theo phiếu (AC-019)
- **Mở:** chốt khi chưa có người nhận/chưa trả lời hết/không có giao (OQ-08)

### FR-14 Quản lý quyền chia sẻ · UC-011 · ⛔OQ-07/09
- **Actor:** chủ tạo · **Main:** thu hồi link, loại người nhận, cấp link mới
- **Rule:** link cũ mất quyền ngay, kể cả phiên khách cũ đang mở (AC-021); người không sở hữu không thu hồi được (AC-022); phiếu cũ giữ nguyên nghĩa
- **UI:** cần xác nhận trước thao tác thu hồi (thao tác không đảo ngược: link cũ không thể về Valid)

## M6 — Buổi hẹn, lời nhắc, số lần đã đi

### FR-15 Tạo kế hoạch · UC-012 · ✅/⛔OQ-04/11
- **Actor:** TV · **Input:** 1 nơi đang hiển thị, ngày giờ tương lai, ghi chú (tùy chọn), người nhận (nếu có)
- **Rule:** RULE-13; RULE-05: giờ đã xác minh là đóng → chặn (“Địa điểm đóng cửa vào thời gian bạn chọn”, AC-024); giờ chưa rõ → **cảnh báo**, không chặn; thời điểm quá khứ → chặn
- **Post:** trạng thái Đã lên lịch + dòng “Kế hoạch này chưa giữ chỗ tại địa điểm” (AC-023)
- **Entry:** từ chi tiết, so sánh, hoặc chốt phiên. Không cần cùng chọn · **Analytics:** `date_plan_created`

### FR-16 Quản lý kế hoạch · UC-013 · ⛔OQ-10/11
- **Actor:** chủ tạo (sửa giờ/ghi chú/đổi nơi/hủy); người nhận (chỉ xem)
- **Rule:** RULE-14; người nhận gọi sửa/hủy → bị từ chối (AC-025); đổi sang nơi đã ẩn → chặn (AC-026); lưu lỗi không báo thành công
- **UI:** hủy cần xác nhận; người nhận không thấy nút sửa (nhưng quyền vẫn ở server)

### FR-17 Tiện ích buổi hẹn · UC-013 · ⛔OQ-12
- **Main:** mở chỉ đường; thêm vào lịch cá nhân (ghi rõ giờ Việt Nam)
- **Mở:** file tải (.ics) hay OAuth (OQ-12); không đồng bộ hai chiều/không tự nhắc

### FR-18 Lời nhắc “Đi chưa?” · UC-014 · ✅CONF CR-001 / ⛔OQ-10/25
- **Actor:** người được nhắc (actor chính xác: OQ-10) · **Trigger:** đến `scheduled_at`, người dùng đang mở web hoặc lần mở tiếp theo
- **Main:** hiện “Đi chưa?” → **Đã đi** (ghi tự xác nhận, cập nhật số lần, đóng nhắc) **hoặc** **Bỏ qua lời nhắc** (chỉ đóng)
- **Rule:** RULE-15: Bỏ qua → biến mất, **không** hiện lại khi tải trang (AC-058), **không** popup khác, **không** đổi lịch/địa điểm, **không** ghi “Chưa đi”, **không** tăng count; plan hủy → không nhắc (AC-028); chỉ xem nhắc → visit_answer vẫn Chưa trả lời (AC-027); hiện đúng giờ hẹn, không chờ trạng thái Past (AC-057)
- **Nhãn bắt buộc:** “Bỏ qua lời nhắc” (không dùng “Chưa đi”)
- **Analytics:** `visit_self_reported`; `date_reminder_dismissed` [DER]

### FR-35 Số lần đã đi · UC-027 · ✅CONF CR-001 / ⛔OQ-10/25
- **Actor:** TV (chỉ thấy số của chính mình) · **Output:** “Đã đi X lần” tại chi tiết địa điểm và buổi hẹn
- **Rule:** RULE-29: tính theo tài khoản + chi nhánh; mỗi plan tối đa 1 lượt; retry/tải lại không tăng (AC-054); 2 plan khác cùng nơi → 2 (AC-053); không chuỗi ngày/reset; không hiển thị cho NN
- **Trạng thái UI:** X = 0 → hiển thị gì? (chưa quy định → A-11)

## M7 — Báo sai, hỗ trợ, thông báo

### FR-19 Báo sai · UC-015 · ✅/⛔OQ-21
- **Actor:** K, TV · **Input:** lý do (sai giá/giờ/địa chỉ/đóng cửa/ảnh/khác), mô tả, ảnh tùy chọn
- **Post:** mã báo sai + trạng thái Mới (AC-029); giá công khai **không** tự đổi (AC-030)
- **Exc:** quá hạn mức → chặn, cho biết cách thử lại (RULE-18); khách không tra cứu được báo sai người khác bằng mã
- **Validation:** loại/kích thước tệp OQ-21 (RULE-27)

### FR-20 Yêu cầu hỗ trợ · UC-016 · ⛔OQ-13
- **Actor:** TV · **Main:** gửi chủ đề/nhóm/nội dung/tệp → xem lịch sử → bổ sung khi “Chờ khách phản hồi” (AC-031)
- **Rule:** RULE-19; không chat realtime; không thấy ghi chú nội bộ; đổi id sang ticket khác → không đọc được (AC-032)
- **Mở:** trả lời khi đã đóng/mở lại (OQ-13)

### FR-21 Thông báo · UC-017 · ⛔OQ-14
- **Actor:** TV · **Main:** danh sách thông báo (cập nhật buổi hẹn, hỗ trợ) → mở đối tượng (kiểm tra quyền lại)
- **Rule:** RULE-24; thông báo cũ không cấp quyền xem plan đã thu hồi (AC-033); hỗ trợ ≠ đồng ý tiếp thị (AC-034)
- **Mở:** đọc/chưa đọc, badge (OQ-14); không push/email nhắc hẹn

### FR-22 Quyền riêng tư · nhiều UC · ✅
- Xuyên suốt: mọi thao tác riêng kiểm tra tại server. FE: không dựa vào ẩn nút; trang link mời `noindex`; không hiển thị email/lịch sử/danh sách/vị trí/ghi chú người khác; xử lý 401/403/404/410 thống nhất mà không lộ sự tồn tại của tài nguyên

## M9–M11 — Quản trị (F2)

| FR | UC | Actor | Main / output | Rule & validation | Exc / AC | OQ |
|---|---|---|---|---|---|---|
| FR-23 Biên tập địa điểm | UC-018 | BT | Tạo/sửa nháp, xem trước, lọc khu vực/trạng thái, gửi duyệt (Nháp → Chờ duyệt) | RULE-20 điều kiện xuất bản; tọa độ hợp lệ; ảnh có quyền; giá known: `0 ≤ min ≤ chuẩn ≤ max` | Thiếu → lỗi theo trường (AC-036); unknown giá/giờ vẫn gửi được (AC-035) | 03/04/15/18/21 |
| FR-24 Duyệt & ẩn | UC-019 | DN | Duyệt / trả về (lý do) / ẩn / ngừng hoạt động | RULE-21/22; BT không tự xuất bản (AC-037); audit trước–sau–lý do | Ẩn nơi đang có plan → plan cũ giữ tham chiếu (AC-038) | 11/15/18 |
| FR-25 Danh mục | UC-020 | DN/QT | Loại hình, nhãn, khu vực; ngừng dùng nhãn | RULE-22 | Ngừng nhãn không xóa dữ liệu (AC-039); không quyền → từ chối (AC-040) | 18 |
| FR-26 Bộ sưu tập | UC-021 | theo quyền | Tên/nội dung/ảnh, chọn nơi, thứ tự, lịch hiển thị | Chỉ nơi công khai | AC-041/042 | 01/18/21 |
| FR-27 Tài khoản & vai trò | UC-022 | QT | Tìm, xem trạng thái, khóa/mở có lý do, gán/bỏ vai trò | Audit; chặn gọi API vượt quyền (AC-043) | Khóa → không tạo/sửa (AC-044); admin cuối OQ-18 | 06/17/18 |
| FR-28 Xử lý báo sai | UC-024 | HT/DN/BT theo quyền | Hàng chờ, giao việc, ghi chú, trạng thái Mới → Đang kiểm tra → Đã xử lý/Không đủ căn cứ | Đóng bắt buộc ghi chú (AC-047); mở lại giữ lịch sử (AC-048) | | 14/18 |
| FR-29 Xử lý hỗ trợ | UC-025 | HT | Nhận việc, trả lời public, ghi chú internal, Mới/Đang xử lý/Chờ khách/Đã đóng | Tách public/internal (AC-049) | AC-050 | 13/14/18/21 |
| FR-30 Nhập CSV | UC-023 | BT | Tải mẫu, nhập thử, báo lỗi từng dòng, xác nhận ghi | RULE-23; không tự xuất bản; [PROP] chỉ ghi khi toàn lô hợp lệ | AC-045/046 | 19/21 |
| FR-31 Nhật ký | UC-018/019/022/024 | QT (xem) | Danh sách audit: chủ thể/thời điểm/đối tượng/trước–sau/lý do | Chỉ đọc qua UI, không hiện bí mật | | 17/18 |
| FR-32 Sự kiện phân tích | UC-026 | SYS (FE phát sự kiện) | 9 sự kiện nguồn + `date_reminder_dismissed` | event_id chống trùng; whitelist thuộc tính; không token/OTP/ghi chú | Không ghi theo ký tự | 20 |
| FR-33 Báo cáo | UC-026 | theo quyền | Lọc thời gian/khu vực/loại hình/nền tảng; chỉ số §10; thời điểm cập nhật | Mẫu số 0 → “Chưa có dữ liệu” (AC-052); cohort chưa đủ 30 ngày | AC-051 | 18/20/22 |
| FR-34 Xuất CSV | UC-026 | theo quyền | Xuất theo đúng bộ lọc/quyền | Khớp tổng; lỗi có thử lại | AC-051 | 18/20 |

Các bảng UC cho FR-23 đến FR-34 có đủ PRE/POST/AF/EX. Phân tích chi tiết từng field form quản trị sẽ làm ở Phase 2/3 khi phạm vi F2 được duyệt.
