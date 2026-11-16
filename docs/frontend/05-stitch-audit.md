# 05 — Stitch MVP Audit (đầu vào PHASE 5)

**Nguồn:** export Stitch `stitch_gowithbae_web_prototype` (15 màn S-01 đến S-15, mỗi màn có `code.html` + `screen.png`, kèm `gowithbae/DESIGN.md`), người yêu cầu gửi ngày 16-11-2026. Bản export không được đưa vào repo (khoảng 12 MB ảnh); repo chỉ giữ kết quả audit này.
**Quyết định (Gate 2):** người yêu cầu gửi bản Stitch và yêu cầu làm Phase 5. Hướng được duyệt: **lấy Stitch làm tham chiếu visual, sửa theo design system B+ và phạm vi SRS G1**. Không chép HTML của Stitch vào code.

## 1. Phần giữ lại

`DESIGN.md` của Stitch dùng đúng token B+ của Phase 4: sky-700 `#0070B8`, peach `#FA9A6E/#B4532A`, ink `#14324A/#4A6275`, nền `#F4F8FA`, viền `#D6E6EF`, bo 10/14/16/pill, Be Vietnam Pro, `tabular-nums`, vé hẹn có răng cưa, nút tim 44 px. Các phần giữ lại:

- Bố cục khu “Tiếp tục” trên trang chủ (3 thẻ: lời nhắc, phiên cùng chọn, buổi hẹn sắp tới).
- Thanh tìm kiếm nhiều trường trên desktop; chip hoạt động cuộn ngang.
- Chi tiết địa điểm: dải thông tin quyết định (giá 2 người · giờ hôm nay · khu vực), cột phải sticky “Lên kế hoạch”.
- Bỏ phiếu: thẻ ứng viên với segmented Thích/Bỏ qua, tiến độ hai người, thanh hành động đáy.
- Chi tiết buổi hẹn: đầu trang dạng vé, thẻ “Đi chưa?” có **Bỏ qua lời nhắc** và **Đã đi**.

## 2. Phần phải sửa (lệch SRS/phạm vi)

| # | Vấn đề trong Stitch | Màn | Căn cứ | Cách sửa |
|---|---|---|---|---|
| 1 | Lời nhắc dùng “Viết review đôi” / “Để sau” | S-01 | CR-001, FR-18; đánh giá là G2 | Thay bằng **Đã đi** / **Bỏ qua lời nhắc** |
| 2 | Hồ sơ cặp đôi “Minh & Linh”, “Kỷ niệm 420 ngày”, avatar đôi | 13 màn | SRS §2.2: không có hồ sơ cặp đôi G1 | Header chỉ có tài khoản cá nhân; tên người cùng chọn chỉ hiện trong phiên |
| 3 | Số sao, “(320 đánh giá)” | S-03, 11, 13, 15 | FR-05, RULE-04: không dựng sao/đánh giá | Bỏ hoàn toàn |
| 4 | Khoảng cách khi chưa có điểm gốc; “8 phút đi xe máy” | S-01, 03, 11, 15 | FR-04: chỉ hiện khi có điểm gốc, ghi “ước tính”, không gọi là thời gian đi | Chỉ hiện `distanceKm` từ API kèm “ước tính” |
| 5 | Mã QR “Check-in”, mã vé kỷ niệm | S-15 (và icon ở nhiều màn) | G2 (đơn/mã sử dụng); SRS: tự xác nhận không phải bằng chứng | Bỏ |
| 6 | Widget thời tiết | S-15 | Không có trong SRS, cần tích hợp ngoài | Bỏ |
| 7 | “Gợi ý ngẫu nhiên cho hai đứa” | S-01 | Ngoài phạm vi (gợi ý AI/tự động) | Bỏ |
| 8 | “Nhắc Linh nhẹ nhàng”, “Gửi gợi ý cho Linh”, “Gửi vé cho Bae” | S-04, 11, 15 | Không có chat/push/gửi tin G1 | Bỏ; chia sẻ chỉ qua link mời (FR-10) |
| 9 | “Thích chung: Buổi hẹn xác nhận”, “chỉ thành buổi hẹn khi cả 2 cùng Thích” | S-11 | RULE-11: không tự chốt; người tạo quyết định | Câu đúng: “<Người tạo> sẽ chọn nơi cuối cùng” |
| 10 | “Hai bạn đã ghé 2 lần” | S-04, 15 | FR-35: đếm theo **tài khoản**, chỉ người đó thấy | “Bạn đã đi X lần” (chờ CCR-01) |
| 11 | “Đang mở cửa · Đóng sau 4 giờ” khi không biết giờ đã xác minh | S-04 | RULE-04/05: không giả định đang mở | Chỉ hiển thị khi `hours.status=KNOWN`; tính theo lịch tuần + ngoại lệ |
| 12 | Thiếu “Kế hoạch này chưa giữ chỗ tại địa điểm”; có “Gọi quán đặt bàn” | S-14, 15 | FR-15 câu bắt buộc | Thêm câu bắt buộc; Gọi là liên hệ, không gọi là đặt bàn |
| 13 | Ảnh stock hotlink `lh3.googleusercontent.com`, người mẫu | 14 màn | RULE-28; ảnh phải có quyền | Dùng ảnh từ API (`PlaceImage`); không có ảnh → khung giữ chỗ |
| 14 | Nhãn chữ HOA (“THỜI GIAN HẸN”, “KẾ HOẠCH HẸN HÒ”) | 13 màn | DD-10 | Sentence case |
| 15 | Nav S-11 đổi thành “Đã lưu · So sánh · Buổi hẹn…” | S-11 | SRS §8: 4 mục cố định | Giữ 4 mục |
| 16 | Footer “© 2024 …, Điều khoản, Bảo mật” | mọi màn | Chưa có nội dung pháp lý | Footer tối giản, không link chết |
| 17 | Material Symbols + emoji trong chip | mọi màn | DD-07 (Lucide), không emoji làm icon | Lucide |
| 18 | Chữ nav xuống dòng ở desktop hẹp, nút nhiều dòng | S-15 | NFR-02 | Kiểm tra tại 768/1024 |
| 19 | “Còn 46 giờ” trên phiên | S-11 | Hạn link 7 ngày là PROP (OQ-07) | Hiển thị `expiresAt` của share grant (nếu có) |

## 3. Kết luận

Stitch hữu ích về visual và bố cục, nhưng khoảng một nửa nội dung là chức năng ngoài phạm vi hoặc dữ liệu giả, vốn là các dấu hiệu “AI làm” dễ thấy nhất. Phase 5 dựng giao diện theo bố cục của Stitch, dùng dữ liệu đúng contract và câu chữ bắt buộc của SRS.
