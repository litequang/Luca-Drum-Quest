> **Bàn giao PC → hosting (17/11/2026):** [Hướng dẫn tiếng Việt](docs/HOSTING_BAN_GIAO_VI.md), [kết quả build Windows](docs/WINDOWS_BUILD_REPORT.md). Dùng `luca-host.zip` đã chuẩn bị ở PC; upload cấu hình riêng `.env.host-private` tách biệt và đổi tên `.env` trên host. Chưa triển khai hosting.

> **AI phát triển tiếp:** đọc [AI_HANDOFF_VI.md](docs/AI_HANDOFF_VI.md) sau [PROJECT_MAP.md](PROJECT_MAP.md) và [AGENTS.md](AGENTS.md). Code chuẩn hiện nằm trên `main`, đã hợp nhất backend và các bản sửa frontend; các file cấu hình/SQL/ZIP riêng không có trong Git. Clone mới phải build gói runtime từ source.

> **Local backend + Admin pilot (2026-11-16):** [Windows setup](docs/LOCAL_PILOT_WINDOWS.md) · [Architecture/API/security](docs/LOCAL_PILOT_ARCHITECTURE.md) · [Implementation report and device checklist](docs/LOCAL_PILOT_REPORT.md). Run the Fastify server, not a generic static file server. YouTube-only video embeds, scoped teacher feedback and private practice images are included. No production deployment; no payments or real child data. 

# 🥁 Luca Drum Quest

**Season 1 / Vòng 1: 24 tháng học trống bài bản để chơi nhạc thờ phượng Chúa (khởi đầu ở tuổi 4).**

> Một dự án gia đình vui vẻ: ông bà, cô chú và người thân có thể đồng hành tài trợ thiết bị và học phí; bố mẹ theo dõi sự tiến bộ của Luca qua bài tập, video và những cột mốc âm nhạc.

**Trạng thái:** Đã có backend/admin pilot Node 24/TypeScript/Fastify/MariaDB, tài khoản và phân quyền; giao diện công khai giữ nguyên. Đã sửa runtime Argon2id WASM và charset tiếng Việt, kiểm tra Windows 30 tests đạt. Owner tự thao tác hosting; agent chưa deploy và chưa xác nhận đầy đủ kết quả host. Chưa có xử lý thanh toán.

## 🧭 Bắt đầu ở đâu?

- **[PROJECT_MAP.md](PROJECT_MAP.md)** — bản đồ dự án, *điểm vào số 1 cho AI/Codex*; điều đã chốt, điều đang đề xuất và hướng dẫn đọc tài liệu.
- **[AGENTS.md](AGENTS.md)** — quy tắc làm việc cho AI agent và Codex.
- [Tầm nhìn & nguyên tắc](docs/01_VISION.md)
- [Giáo trình học trống 24 tháng (bản đề xuất)](docs/02_CURRICULUM_24_MONTHS.md)
- [Hệ thống kỹ năng, PASS và hồ sơ bài học](docs/03_SKILL_SYSTEM.md)
- [Ý tưởng website, nội dung và quyền riêng tư](docs/04_WEBSITE_AND_PRIVACY.md)
- [Ngân sách & gọi vốn gia đình](docs/05_BUDGET.md)
- [Roadmap, quyết định và các câu hỏi còn mở](docs/06_ROADMAP_AND_DECISIONS.md)
- [Đặc tả bàn giao backend cho Codex](docs/BACKEND_HANDOFF.md)
- [Tối ưu giao diện điện thoại/iPad và checklist kiểm thử](docs/FRONTEND_RESPONSIVE_2026_11_16.md)

## Các điểm đã chốt

- Dự án được định hướng theo **nhiều vòng (Season)**. **Vòng 1 = 2 năm / 24 tháng**, KHÔNG phải một năm; Vòng 2+ có thể tiếp tục nhưng **chưa chốt thời gian, giáo trình hay ngân sách**. Mỗi vòng có mục tiêu, quỹ và tiến độ riêng.
- Dự kiến **1 buổi học với giáo viên mỗi tuần**, chi phí tham khảo **500.000–700.000 VND/buổi**.
- Học ở nhà là phần cốt lõi; mỗi kỹ năng có nhiệm vụ cụ thể và đánh giá tiến bộ, giáo viên kiểm tra kỹ thuật.
- **Mục tiêu chính của 24 tháng:** học trống **bài bản, nghiêm túc, phù hợp lứa tuổi để chơi và đệm nhạc thờ phượng Chúa**. Không hứa hai năm đạt trình độ nhạc công chuyên nghiệp người lớn; không phải định hướng thi chứng chỉ hoặc biểu diễn thương mại.
- Luca thường nghe và gõ theo **nhạc thờ phượng Nissi United**; sử dụng nhạc con yêu thích làm chất liệu luyện nhịp phù hợp độ tuổi.
- Khán giả chính của website là **gia đình và người thân**; hiển thị nội dung riêng tư của trẻ chỉ khi được phép.

## Chưa chốt

Domain, cấu hình hosting thực tế, thời điểm bắt đầu chính xác, mua bộ trống nào, danh sách bài nhạc, hình thức đóng góp, chính sách phân quyền chi tiết và giáo trình kỹ năng cuối cùng. Stack pilot đã được duyệt: Node 24/TypeScript/Fastify/MariaDB.

## Chạy bản backend pilot

- Chạy qua backend Fastify theo [LOCAL_PILOT_WINDOWS.md](docs/LOCAL_PILOT_WINDOWS.md); cần Node 24, dependencies và MariaDB riêng. Build runtime bằng `npm run package:host`.
- Không dùng `python -m http.server` hoặc static server phục vụ toàn bộ checkout vì có thể lộ cấu hình/ảnh riêng. Giao diện công khai dùng API cùng origin; `data.js` chỉ còn làm nguồn giáo trình dự thảo cho seed.
- 4 khu vực: Hành trình, Giáo trình (8 chặng + Skill Cards), Nhật ký video minh họa và Quỹ Luca tính thử học phí **Vòng 1**.
- `app.js`: điều hướng, bộ lọc, dialog chi tiết kỹ năng, máy tính học phí. `styles.css`: hệ thống giao diện responsive; `index.html`: bố cục.
- Backend có đăng nhập, lời mời và ghi nhận thu chi thủ công; không xử lý thanh toán. Giáo trình seed là dự thảo, các ước tính ngân sách không phải khoản đóng góp hay thành tích thật. Không đưa dữ liệu trẻ/người tài trợ vào repo công khai.
- Backend/admin pilot đã có theo [`docs/LOCAL_PILOT_REPORT.md`](docs/LOCAL_PILOT_REPORT.md); **giữ nguyên giao diện hiện có**. Tài liệu backend handoff còn phần lịch sử, cần ưu tiên quyết định mới nhất trong PROJECT_MAP.

**Không xem các mốc kỹ năng theo tháng là cam kết phát triển của trẻ.** Niềm vui âm nhạc, an toàn và sự phù hợp lứa tuổi quan trọng hơn tiến độ cứng.
