# PROJECT MAP — Luca Drum Quest

**Ngày cập nhật:** 2026-11-16  
**Repository:** https://github.com/litequang/Luca-Drum-Quest  
**Trạng thái:** FRONTEND DEMO trên `main` (HTML/CSS/JS modules); backend, lưu trữ, xác thực, tài trợ thật và deployment chưa có. Các trang frontend là prototype được chủ dự án yêu cầu làm trực tiếp, không phải sản phẩm production.

> **Dành cho AI mới tiếp quản:** Đọc trang này trước. Không suy đoán rằng một đề xuất trong tài liệu đã được người dùng đồng ý triển khai.

## 1. Tóm tắt 30 giây

Luca Drum Quest là website dự án gia đình (vui, ấm áp, có chút hài hước kiểu gọi vốn startup) theo dõi hành trình Luca, con trai 4 tuổi, **học trống bài bản để chơi nhạc thờ phượng Chúa**. **Vòng 1 là một vòng duy nhất kéo dài 24 tháng**. Huy động hỗ trợ mua trống + học phí chủ yếu từ ông bà/người thân, cập nhật video tập và tiến bộ cho những người được phép xem. Đồng thời tạo hệ thống học tập để bố mẹ không phó mặc toàn bộ cho thầy: có kỹ năng, tiền đề, bài tập ở nhà, đánh giá HOME READY và giáo viên xác nhận TEACHER PASS.

**Mục tiêu đã xác nhận:** học 2 năm cần **chất lượng đào tạo và kỹ thuật nghiêm túc** để phục vụ việc chơi/đệm **nhạc thờ phượng Chúa**, không phải học cho vui một cách sơ sài. Không đặt mục tiêu nghề nghiệp thương mại hoặc cam kết trình độ nhạc công người lớn sau đúng 2 năm. Luca quen nghe/gõ theo **Nissi United**; đây là chất liệu học, không buộc con đánh giống bản thu.

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
| C09 | Website frontend được yêu cầu **làm trực tiếp**, backend giao Codex triển khai sau |
| C10 | **Mục tiêu cuối là chơi/đệm nhạc thờ phượng Chúa**; học bài bản, kỹ thuật chuẩn, 24 tháng có đánh giá; không hướng chứng chỉ/biểu diễn thương mại |
| C11 | Giao diện đã được tác giả hóa trên `main`; Codex **không được tự thiết kế lại hoặc ghi đè UI**, chỉ nối API sau khi chốt backend |

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

- Mục tiêu **nhạc thờ phượng** và yêu cầu học **bài bản** đã chốt; tỉ lệ kỹ thuật/cảm âm cụ thể, danh mục kỹ năng A–Z và chuẩn PASS từng kỹ năng **chưa được giáo viên duyệt**.
- Danh sách bài Nissi United cụ thể, tốc độ/phiên bản phù hợp và vấn đề bản quyền khi đăng video có nhạc nền.
- Lịch bắt đầu (không mặc định 2026–2028), số tuần nghỉ, thời lượng mỗi buổi, cách linh hoạt lịch với thầy.
- Thiết bị (practice pad, dùi, trống điện/acoustic), mức ngân sách mua trống và phụ kiện.
- Giao diện, branding, domain, hosting, stack, admin, quyền video, cách chia sẻ link và hạ tầng lưu trữ.
- Cơ chế ủng hộ và thông tin thanh toán; chỉ dự kiến minh bạch thu/chi, chưa chọn đơn vị hay cổng thanh toán.

## 5. Bản đồ frontend và tài liệu

| File | Vai trò |
|---|---|
| `index.html` | Bố cục 4 trang, minh họa bộ trống SVG và mobile nav |
| `styles.css` | Design tokens, responsive, tương phản, reduced-motion |
| `data.js` | Chỉ dữ liệu giả: 8 chặng, Skill Cards, ví dụ nhật ký |
| `app.js` | JS render, lọc, dialog, mô phỏng chi phí; chưa có API |
| `docs/BACKEND_HANDOFF.md` | Kế hoạch API, bảo mật, dữ liệu và ranh giới công việc Codex |
| `docs/FRONTEND_RESPONSIVE_2026_11_16.md` | Layout phone/iPad (thiết kế v0.2), checklist kiểm thử thiết bị thật |

**Chạy frontend:** `python -m http.server 5173` ở root, vào `http://localhost:5173` (không mở `file://` vì ES modules). Chưa có bước production deploy.

## 5b. Tài liệu nền

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
| [docs/BACKEND_HANDOFF.md](docs/BACKEND_HANDOFF.md) | Backend Codex, API design và các gate an toàn |

## 6. Handoff / nhiệm vụ tiếp theo nên làm

**Ưu tiên #1 — Cùng gia đình và giáo viên hoàn thiện giáo trình trước khi code:**

1. Chốt khung giáo dục 4–6 tuổi, đánh giá điều kiện ban đầu và lựa chọn thiết bị với thầy.
2. Viết **skill catalogue v1 (A–Z)**: mã kỹ năng, điều kiện tiên quyết, hoạt động tại nhà, lỗi nên để thầy sửa, rubric PASS bằng video và xác nhận của thầy.
3. Xây **12 tuần đầu** thành phiếu bài học có thể sử dụng; chọn 1–3 bài nhạc Luca thích (ghi tên/link, không sao chép nhạc).
4. Frontend prototype đã có. Tiếp tục duyệt yêu cầu backend, phân quyền, nơi lưu video, hosting và chiến lược triển khai rồi mới giao Codex nối dữ liệu thật. **Không cho Codex viết lại giao diện**.

**Lưu ý quan trọng:** Đừng hiểu tiêu chí PASS thành lý do cứng để hoãn gặp thầy; khi bé tập sai hoặc mắc kẹt, buổi học sửa lỗi có giá trị. Đừng thiết kế KPI tính số kỹ năng/buổi học.

## 7. Quy tắc cập nhật map

Khi có quyết định mới: ghi ID, ngày, phân loại CONFIRMED/PROPOSED/OPEN; sửa file liên quan; ghi trong [decision log](docs/06_ROADMAP_AND_DECISIONS.md). Đừng âm thầm nâng đề xuất thành yêu cầu.

**Source of truth:** lời xác nhận mới nhất của chủ dự án > bảng quyết định ở đây > các tài liệu đề xuất cũ.
