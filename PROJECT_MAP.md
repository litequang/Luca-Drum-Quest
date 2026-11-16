# PROJECT MAP — Luca Drum Quest

**Ngày cập nhật:** 2026-11-16  
**Repository:** https://github.com/litequang/Luca-Drum-Quest  
**Trạng thái:** DISCOVERY / DOCUMENTATION. Chưa có ứng dụng, dữ liệu thật, thiết kế chốt hay deployment.

> **Dành cho AI mới tiếp quản:** Đọc trang này trước. Không suy đoán rằng một đề xuất trong tài liệu đã được người dùng đồng ý triển khai.

## 1. Tóm tắt 30 giây

Luca Drum Quest là website dự án gia đình (vui, ấm áp, có chút hài hước kiểu gọi vốn startup) theo dõi hành trình Luca, con trai 4 tuổi, học trống. **Vòng 1 là một vòng duy nhất kéo dài 24 tháng**. Huy động hỗ trợ mua trống + học phí chủ yếu từ ông bà/người thân, cập nhật video tập và tiến bộ cho những người được phép xem. Đồng thời tạo hệ thống học tập để bố mẹ không phó mặc toàn bộ cho thầy: có kỹ năng, tiền đề, bài tập ở nhà, đánh giá HOME READY và giáo viên xác nhận TEACHER PASS.

**Tín hiệu mới nhất:** Luca đã quen nghe và gõ theo **nhạc thờ phượng Nissi United**. Dùng nhạc con thích như cầu nối vào nhịp điệu, không bắt bé phải chơi đầy đủ như bản thu.

## 2. Các quyết định đã CHỐT (CONFIRMED)

| ID | Quyết định |
|---|---|
| C01 | Season/Vòng 1 = **2 năm = 24 tháng**, không chia hai vòng một năm |
| C02 | Luca bắt đầu ở **4 tuổi**; giáo trình hướng tới giai đoạn **4–6 tuổi** |
| C03 | Dự kiến **1 buổi với thầy/tuần** là mức phù hợp chi phí gia đình, không mặc định 2 buổi |
| C04 | Giá buổi học do gia đình tham khảo: **500.000–700.000 VND/buổi** |
| C05 | Gọi vốn/đồng hành tài chính **chủ yếu ông bà và người thân**, gồm học phí + thiết bị |
| C06 | Website cập nhật **nhật ký tiến độ, video theo giai đoạn**, để người thân theo dõi |
| C07 | Bố mẹ muốn tham gia luyện tập tại nhà có mục tiêu, bài cũ thực hiện được rồi mới tăng độ khó; tiết học ưu tiên dạy mới và sửa lỗi |
| C08 | Luca thường được nghe và **gõ theo nhạc thờ phượng Nissi United**; đây là chất liệu luyện tập có ý nghĩa với con |
| C09 | **Đang bàn thiết kế**, chưa yêu cầu viết ứng dụng hoàn chỉnh hoặc triển khai website |

## 3. Đề xuất đang THẢO LUẬN (PROPOSED, chưa chốt)

- Tên hiển thị **Luca Drum Quest**; tagline **Season 1 — Hành trình tay trống nhí**, lối kể chuyện gọi vốn gia đình/nhà đầu tư thiên thần.
- Website gồm **Family View** (thành tích, video, thông tin tài trợ) và **Learning Dashboard** (bài tập, PASS, lịch, kinh phí).
- Sáu trục: (A) cảm âm/nhịp, (B) tư thế/tay, (C) phối hợp vận động, (D) bộ trống/groove, (E) ngôn ngữ âm nhạc, (F) sáng tạo/biểu diễn.
- Các trạng thái: **LEARNING → PRACTICING → HOME READY → TEACHER PASS**. Không áp PASS/FAIL cứng khiến trẻ mất vui.
- Luyện ngắn khoảng 5–10 phút/lần, 4–5 ngày/tuần **chỉ là mức thử ban đầu**; thay đổi theo phản ứng của Luca.
- Chia 24 tháng thành 8 chặng, 3 tháng/chặng; **12 buổi đầu là pilot phương pháp**, không phải vòng gọi vốn khác.
- Giáo viên đưa nhiệm vụ và hướng dẫn bố mẹ cách luyện; bố mẹ ghi video; giáo viên xác nhận kỹ thuật/đề xuất bước tiếp.
- Video và dữ liệu của trẻ **private by default**; repository công khai chỉ chứa tài liệu/mẫu/dữ liệu giả.

## 4. Những gì còn MỞ (OPEN)

- Chốt giáo trình: hướng kết hợp kỹ thuật + âm nhạc hay biến thể; danh mục kỹ năng A–Z và chuẩn PASS từng kỹ năng **chưa được duyệt**.
- Danh sách bài Nissi United cụ thể, tốc độ/phiên bản phù hợp và vấn đề bản quyền khi đăng video có nhạc nền.
- Lịch bắt đầu (không mặc định 2026–2028), số tuần nghỉ, thời lượng mỗi buổi, cách linh hoạt lịch với thầy.
- Thiết bị (practice pad, dùi, trống điện/acoustic), mức ngân sách mua trống và phụ kiện.
- Giao diện, branding, domain, hosting, stack, admin, quyền video, cách chia sẻ link và hạ tầng lưu trữ.
- Cơ chế ủng hộ và thông tin thanh toán; chỉ dự kiến minh bạch thu/chi, chưa chọn đơn vị hay cổng thanh toán.

## 5. Bản đồ tài liệu

| Tài liệu | Mục đích |
|---|---|
| [README.md](README.md) | Giới thiệu và link hướng dẫn |
| [AGENTS.md](AGENTS.md) | Ràng buộc AI, bảo mật, quy trình |
| [docs/01_VISION.md](docs/01_VISION.md) | Mục tiêu và nguyên tắc nuôi dưỡng hứng thú |
| [docs/02_CURRICULUM_24_MONTHS.md](docs/02_CURRICULUM_24_MONTHS.md) | 8 chặng, 24 tháng, 6 trục kỹ năng |
| [docs/03_SKILL_SYSTEM.md](docs/03_SKILL_SYSTEM.md) | Trạng thái học, rubric PASS, mẫu skill card |
| [docs/04_WEBSITE_AND_PRIVACY.md](docs/04_WEBSITE_AND_PRIVACY.md) | Website hai vai trò, nhật ký video, privacy |
| [docs/05_BUDGET.md](docs/05_BUDGET.md) | Chi phí, ngân sách và minh bạch tài trợ |
| [docs/06_ROADMAP_AND_DECISIONS.md](docs/06_ROADMAP_AND_DECISIONS.md) | Lộ trình triển khai, backlog, lịch sử quyết định |

## 6. Handoff / nhiệm vụ tiếp theo nên làm

**Ưu tiên #1 — Cùng gia đình và giáo viên hoàn thiện giáo trình trước khi code:**

1. Chốt khung giáo dục 4–6 tuổi, đánh giá điều kiện ban đầu và lựa chọn thiết bị với thầy.
2. Viết **skill catalogue v1 (A–Z)**: mã kỹ năng, điều kiện tiên quyết, hoạt động tại nhà, lỗi nên để thầy sửa, rubric PASS bằng video và xác nhận của thầy.
3. Xây **12 tuần đầu** thành phiếu bài học có thể sử dụng; chọn 1–3 bài nhạc Luca thích (ghi tên/link, không sao chép nhạc).
4. Sau đó chốt scope MVP website và nền tảng triển khai.

**Lưu ý quan trọng:** Đừng hiểu tiêu chí PASS thành lý do cứng để hoãn gặp thầy; khi bé tập sai hoặc mắc kẹt, buổi học sửa lỗi có giá trị. Đừng thiết kế KPI tính số kỹ năng/buổi học.

## 7. Quy tắc cập nhật map

Khi có quyết định mới: ghi ID, ngày, phân loại CONFIRMED/PROPOSED/OPEN; sửa file liên quan; ghi trong [decision log](docs/06_ROADMAP_AND_DECISIONS.md). Đừng âm thầm nâng đề xuất thành yêu cầu.

**Source of truth:** lời xác nhận mới nhất của chủ dự án > bảng quyết định ở đây > các tài liệu đề xuất cũ.
