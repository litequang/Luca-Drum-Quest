# AI / Codex instructions — Luca Drum Quest

## Đọc trước khi làm bất kỳ việc gì

1. Đọc [PROJECT_MAP.md](PROJECT_MAP.md) để nắm trạng thái và các quyết định hiện hành.
2. Đọc tài liệu liên quan trong `docs/` trước khi sửa, tạo issue hoặc viết code.
3. Phân biệt **CONFIRMED** (người dùng đã chốt), **PROPOSED** (đề xuất), **OPEN** (chưa chốt), **FUTURE** (để sau).
4. Cập nhật PROJECT_MAP.md và docs/06_ROADMAP_AND_DECISIONS.md nếu có quyết định mới.
5. Không coi ví dụ UI, số mốc hay tiêu chí PASS minh họa là đặc tả production đã duyệt.

## Product principles

- Season 1 = 24 tháng. Luca khởi đầu ở tuổi 4. Giáo viên 1 buổi/tuần dự kiến, học phí 500–700k VND/buổi.
- Mục đích: hành trình âm nhạc **vui**, gọi vốn nhẹ nhàng cho ông bà/người thân, quản lý kinh phí, nhật ký video và tiến độ học thực chất.
- Giáo trình kết hợp nghe/nhạc/thử nghiệm + kỹ thuật trống; nhà luyện, lớp hướng dẫn/sửa lỗi. Không ép PASS máy móc, không chặn buổi học khi cần giáo viên giúp.
- Tích hợp những ca khúc thờ phượng Nissi United mà Luca quen nghe ở mức độ phù hợp khả năng. **Không chép lời, tải/đăng lại audio/video thương mại hoặc sử dụng bản ghi không có quyền**; ưu tiên lưu tên/link nguồn hợp pháp và video biểu diễn gia đình theo quyền cho phép.
- Giáo viên chịu trách nhiệm hướng dẫn/sửa tư thế, kiểm tra an toàn; AI/phụ huynh không tự chẩn đoán tư thế kỹ thuật từ video rồi coi như thay thế thầy.
- Luôn có tùy chọn chơi tự do, nghỉ và điều chỉnh bài tập theo tâm trạng và phát triển vận động của trẻ.

## Privacy & safety

- Repository này hiện **PUBLIC**: tuyệt đối KHÔNG commit ảnh/video thật của Luca, ngày sinh đầy đủ, địa chỉ, trường học, lịch cố định định danh, thông tin liên lạc, số tài khoản/QR thanh toán cá nhân, dữ liệu người tài trợ, thông tin đăng nhập hay secrets.
- Website phải thiết kế quyền truy cập video gia đình, tài khoản quản trị, cơ chế đồng ý chia sẻ và xóa nội dung trước khi phát hành.
- Không hiển thị tiến trình học theo kiểu so sánh/đánh giá trẻ tiêu cực; không có leaderboard trẻ em.
- Ghi nhận nguồn gốc tư liệu, không vi phạm bản quyền nhạc.

## Engineering guardrails

- Hiện **chỉ có tài liệu, CHƯA khởi tạo ứng dụng**. Không tự ý chọn stack, dựng backend/database, kết nối thanh toán hoặc deploy khi chưa được yêu cầu.
- Khi triển khai: ưu tiên MVP nhỏ, mobile-first, dữ liệu có cấu trúc, đơn giản để gia đình cập nhật; không xây hệ thống thu tiền công khai phức tạp.
- Mọi thay đổi nên có tóm tắt rõ: điều đã làm, điều chưa làm, rủi ro, cách kiểm tra thực tế.
- Khi lập giáo trình, ghi rõ kỹ năng/tiêu chí PASS là dự thảo cần giáo viên xác nhận và điều chỉnh theo Luca.
