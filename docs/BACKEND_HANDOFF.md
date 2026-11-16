# Backend Handoff — Luca Drum Quest (dành cho Codex)

**Trạng thái:** SPEC / CHƯA TRIỂN KHAI. Ngày 2026-11-16.

## Tóm tắt bối cảnh (đọc trước khi code)

Đọc AGENTS.md, PROJECT_MAP.md, docs/01_VISION.md, docs/03_SKILL_SYSTEM.md, docs/04_WEBSITE_AND_PRIVACY.md. Vòng 1 kéo dài **24 tháng**, Luca khởi đầu ở tuổi 4. Mục tiêu là học **bài bản để chơi/đệm nhạc thờ phượng Chúa**; Nissi United là nhạc quen, không có quyền sao chép bản ghi.

- **Frontend đã được làm trực tiếp**: index.html, styles.css, app.js, data.js. Không yêu cầu Codex thiết kế lại typography, màu sắc, bố cục hoặc animation.
- Frontend là **prototype JS modules không phụ thuộc build**, có data demo và tương tác client-side; chưa có backend.
- Repo GitHub PUBLIC, tuyệt đối không commit media thật, dữ liệu chi tiết trẻ, donor identity, số tài khoản/QR cá nhân hoặc secrets.
- **Chưa được duyệt:** host, DB, nơi lưu video, đăng nhập, danh tính người thân, phương thức hỗ trợ. Không tự đưa các quyết định này thành product fact.

## Vai trò & phân quyền dự kiến

1. **visitor**: xem landing page, chương trình công khai và ngân sách dự kiến, không xem video cá nhân hay thông tin riêng của Luca. Không có donate checkout.
2. **family_viewer**: người được mời, chỉ xem bài/clip được gia đình chia sẻ; không thấy đánh giá riêng của thầy, dữ liệu người góp vốn hoặc ghi chú nhạy cảm.
3. **parent_admin**: quản lý tiến độ, đăng video, nhật ký, kỹ năng, lời mời/thu hồi, tài chính; xem và xóa dữ liệu thật.
4. **teacher** (tùy chọn sau khi thầy đồng ý): xem riêng các bài/video được gán, nhận xét và xác nhận TEACHER PASS.

Ưu tiên backend authn/authz **theo từng tài nguyên**. Private media không thể truy cập bằng URL đoán được. Thu hồi lời mời và hết hạn quyền cần hoạt động ở server, không chỉ ẩn UI. Chặn dò mật khẩu; session cookies HttpOnly, SameSite, TLS và CSRF protection cho mutation cookie-based.

## Model dữ liệu tham khảo (không phải migration đã chốt)

- **project:** id, name, months_total=24, start_date nullable, owner_id
- **stage:** id, project_id, label, planned_month_range, goals, sort_order
- **skill:** id, axis, title, prerequisites, teacher_approved, home_practice, pass_rubric, safety_notes, revision
- **skill_progress:** skill_id, status (LEARNING/PRACTICING/HOME_READY/TEACHER_PASS), reviewed_by, reviewed_at, private_notes
- **lesson:** scheduled_at, actual_at, fee, attended, teacher_notes, next_practice
- **practice:** date, skill_ids, duration_seconds nullable, child_engagement nullable, notes (private)
- **media:** owner_id, storage_key, privacy, mime_type, size, duration, retention, metadata_removed
- **update:** title, body, stage_id, media_ids, visibility, created_at
- **support:** amount, type (gift/funding/in-kind), date, source_private, visibility, created_by
- **budget_item:** category, planned_amount, actual_amount, note, private
- **invitation:** recipient identifier (minimize PII), role, expires_at, revoked_at, scope
- **audit_log:** actor, action, target, timestamp; không log raw private video URLs hoặc tokens

Độ tuổi, ngày sinh đầy đủ, tên họ, trường/lịch học và vị trí trẻ không được đưa lên trang công khai.

## Contract frontend → API (PROPOSED, cần duyệt trước khi triển khai)

API chung origin để giảm CORS. Mọi endpoint có validation server-side, permissions per-resource và lỗi chuẩn JSON với code/message.

| Method | Resource | Quyền | Ghi chú |
|---|---|---|---|
| GET | /api/v1/public/project | public | mô tả dự án đã duyệt |
| GET | /api/v1/public/stages | public | chương trình chung, không tiến độ trẻ |
| GET | /api/v1/public/budget | public | ước tính/thu chi tổng hợp đã duyệt |
| GET | /api/v1/me | logged-in | role, session |
| GET | /api/v1/skills | parent, teacher-scoped | catalog + tiến độ được phép |
| PATCH | /api/v1/skills/:id/progress | parent/teacher scoped | người đánh giá có thẩm quyền |
| GET/POST | /api/v1/practices | parent | nhật ký riêng |
| GET/POST | /api/v1/updates | parent, family-read scoped | nội dung được cấp quyền |
| POST | /api/v1/media/upload-intent | parent | media size/type checks, private store |
| GET | /api/v1/media/:id/access | authorized | URL truy cập ngắn hạn |
| DELETE | /api/v1/media/:id | parent | xóa media và references |
| GET/POST | /api/v1/budget/items | parent | sổ thu chi không tự public |
| POST | /api/v1/invitations | parent | invite scoped, expiring, revocable |

## Phân kỳ backend Codex

**B0 — Audit & design, chưa code:**

- Đọc tài liệu và frontend, lập proposal về hosting phù hợp shared cPanel/CloudLinux nếu có và MariaDB nếu khả dụng.
- Đề xuất lưu video private cùng ước tính chi phí lưu trữ/băng thông, retention, xóa, backup, tính di chuyển được.
- Thống nhất chiến lược role-based auth, public/private boundary, session/CSRF, upload scan/limits và lịch sử sửa đổi.
- Deliver: ERD, API contract, access matrix, privacy risk, GO/NO-GO checklist. **Không tạo backend trước khi chủ dự án duyệt.**

**B1 — Local backend scaffold (chỉ sau phê duyệt):**

- Migrations, demo seed, auth, role checks, audit, public read endpoints.
- Tách dữ liệu giả trong data.js thành adapter demo/API mà **không thay thiết kế**.
- Test integration: access matrix, missing secrets, IDOR attempt, invalid payload, error responses.
- Chưa có payment, chưa có video thật.

**B2 — Nhật ký gia đình riêng tư và giáo viên:**

- Private upload (type/size validation, object storage, controlled URLs), remove location metadata where possible, revoke access, delete.
- Skill/lesson/practice records and optional teacher review.
- Smoke thực tế iOS/Android, accessibility, bad network và lỗi media.
- Chỉ deploy khi chủ dự án phê duyệt.

**B3 — Sổ tài chính và đồng hành:**

- Ghi nhận thủ công quà tặng, buổi học và thiết bị, có audit; công khai đúng phần tổng hợp được duyệt.
- Không tự tạo payment gateway, QR thanh toán, tự động nhận tiền hoặc leaderboard tài trợ.

## Ranh giới kỹ thuật giao diện

- **KHÔNG** ghi đè styles.css hoặc tái thiết kế index.html khi chưa được giao sửa UI.
- data.js là demo, không coi video/thành tích/khoản thu mô phỏng là sự kiện đã xảy ra.
- Codex có thể đề xuất apiClient.js và nối phần render của app.js tối thiểu, không tự thay đổi bố cục.
- Test visual regression desktop/tablet/mobile, navigation, dialog, filters, budget slider, Safe Area và reduced-motion trước khi merge.
- Cập nhật PROJECT_MAP.md, AGENTS.md, docs trong cùng PR.
- Chỉ lưu tên, đường dẫn nguồn chính thức của bài nhạc; không scrape, tải hoặc nhúng lại bản ghi có bản quyền.

## Prompt Codex Cloud — Phase B0

Repository: litequang/Luca-Drum-Quest, branch main. READ ONLY / DOCUMENTATION ONLY. Read AGENTS.md, PROJECT_MAP.md, docs/BACKEND_HANDOFF.md, docs/04_WEBSITE_AND_PRIVACY.md and inspect index.html, styles.css, app.js, data.js. The frontend has already been designed. Do not redesign it, write backend code, deploy, or enable payments. Prepare an architecture decision proposal for private family login, role-based access, protected child video storage, teacher skill approval workflow, lessons and an audited manual budget ledger. Compare cPanel/CloudLinux + Node/MariaDB feasibility with alternatives, and propose media storage/backup strategy. Deliver API contract, data model, threat model, access matrix, estimated operating cost, migration risks and Go/No-Go gates. Use only mock data. Commit documentation on a separate branch and raise a PR; do not auto-merge.

**Model khuyến nghị:** Codex Medium cho B0 kiến trúc; High cho các phần B1/B2 về auth, phân quyền và media riêng tư. Review thủ công trước production.
