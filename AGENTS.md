# AI / Codex instructions — Luca Drum Quest

## Đọc trước khi làm bất kỳ việc gì

1. Đọc [PROJECT_MAP.md](PROJECT_MAP.md) để nắm trạng thái và các quyết định hiện hành.
2. Đọc tài liệu liên quan trong `docs/` trước khi sửa, tạo issue hoặc viết code.
3. Phân biệt **CONFIRMED** (người dùng đã chốt), **PROPOSED** (đề xuất), **OPEN** (chưa chốt), **FUTURE** (để sau).
4. Cập nhật PROJECT_MAP.md và docs/06_ROADMAP_AND_DECISIONS.md nếu có quyết định mới.
5. Không coi ví dụ UI, số mốc hay tiêu chí PASS minh họa là đặc tả production đã duyệt.

## Product principles

- **Dự án nhiều vòng (Season 1, 2, 3...)**; Vòng 1 = 24 tháng, không chia thành các vòng nhỏ. Vòng 2+ chưa chốt thời gian/phạm vi/ngân sách. Luca khởi đầu ở tuổi 4. Giáo viên 1 buổi/tuần dự kiến, học phí 500–700k VND/buổi.
- Mục đích: hành trình học trống thờ phượng **bài bản** và **gây quỹ hỗ trợ học tập tự nguyện** từ ông bà/người thân. **Không phải đầu tư hoặc hoàn vốn**. Vòng 1 đặt mục tiêu huy động **đủ trọn 24 tháng học phí + mua bộ trống/phụ kiện**, nhằm hạn chế việc học bị gián đoạn; cập nhật thu chi, nhật ký video và tiến độ học thực chất.
- Giáo trình kết hợp nghe/nhạc/thử nghiệm + kỹ thuật trống; nhà luyện, lớp hướng dẫn/sửa lỗi. Không ép PASS máy móc, không chặn buổi học khi cần giáo viên giúp.
- Tích hợp những ca khúc thờ phượng Nissi United mà Luca quen nghe ở mức độ phù hợp khả năng. **Không chép lời, tải/đăng lại audio/video thương mại hoặc sử dụng bản ghi không có quyền**; ưu tiên lưu tên/link nguồn hợp pháp và video biểu diễn gia đình theo quyền cho phép.
- Giáo viên chịu trách nhiệm hướng dẫn/sửa tư thế, kiểm tra an toàn; AI/phụ huynh không tự chẩn đoán tư thế kỹ thuật từ video rồi coi như thay thế thầy.
- Luôn có tùy chọn chơi tự do, nghỉ và điều chỉnh bài tập theo tâm trạng và phát triển vận động của trẻ.

## Mục tiêu âm nhạc đã chốt

- Luca học **bài bản trong 24 tháng để chơi và đệm trống cho nhạc thờ phượng Chúa**; Nissi United là nhạc con quen nghe.
- Học nghiêm túc nghĩa là nền tảng kỹ thuật đúng, nhịp vững, khả năng nghe và chơi cùng bài thờ phượng. Không hứa đạt trình độ nhạc công trưởng thành chuyên nghiệp chỉ sau 2 năm ở tuổi 4–6.
- Giáo trình 24 tháng là dự thảo có tiêu chí PASS và check-in với thầy, không áp lực ép trẻ vào khuôn.

## Privacy & safety

- Repository này hiện **PUBLIC**: tuyệt đối KHÔNG commit ảnh/video thật của Luca, ngày sinh đầy đủ, địa chỉ, trường học, lịch cố định định danh, thông tin liên lạc, số tài khoản/QR thanh toán cá nhân, dữ liệu người tài trợ, thông tin đăng nhập hay secrets.
- Website phải thiết kế quyền truy cập video gia đình, tài khoản quản trị, cơ chế đồng ý chia sẻ và xóa nội dung trước khi phát hành.
- Không hiển thị tiến trình học theo kiểu so sánh/đánh giá trẻ tiêu cực; không có leaderboard trẻ em.
- Ghi nhận nguồn gốc tư liệu, không vi phạm bản quyền nhạc.

## Engineering guardrails

- **Frontend demo đã có trên main:** index.html, styles.css, app.js, data.js, do ChatGPT thiết kế trực tiếp. Codex không được tự đổi lại visual identity, layout, typography, CSS/mobile nav khi chỉ được giao backend. Xem docs/BACKEND_HANDOFF.md.
- **Backend chưa triển khai.** Không tự quyết định stack, DB, nơi lưu video riêng tư, đăng nhập, kết nối thanh toán hoặc production deploy khi chủ dự án chưa duyệt.
- Khi triển khai: ưu tiên MVP nhỏ, mobile-first, dữ liệu có cấu trúc, đơn giản để gia đình cập nhật; không xây hệ thống thu tiền công khai phức tạp.
- Mọi thay đổi nên có tóm tắt rõ: điều đã làm, điều chưa làm, rủi ro, cách kiểm tra thực tế.
- Khi lập giáo trình, ghi rõ kỹ năng/tiêu chí PASS là dự thảo cần giáo viên xác nhận và điều chỉnh theo Luca.
