# 06 — Roadmap, nhật ký quyết định và câu hỏi cần chốt

**Trạng thái:** LOCAL BACKEND + ADMIN PILOT implemented; no production deployment or payment integration. See [LOCAL_PILOT_REPORT.md](LOCAL_PILOT_REPORT.md) for implementation scope, actual test results and remaining gates. Earlier B0-only instructions below are historical and superseded for local development by D-015.

| Ngày | Mã | Trạng thái | Nội dung |
|---|---|---|---|
| 2026-11-16 | D-015 | CONFIRMED | Owner explicitly authorized Node 24/TypeScript/Fastify/MariaDB local backend, secure Admin Dashboard, API integration, audited manual finance and a branch/commit/push/PR; no production deployment, real child data or payments |
| 2026-11-16 | D-016 | IMPLEMENTED LOCAL | Parent sessions/CSRF/rate limits; season/project/finance/lesson/skill/practice/journal forms; published public projections; single-use invited family access and revocation; sanitized private images |
| 2026-11-16 | D-017 | OPEN / PRODUCTION BLOCKER | Target-host private-media/security review, production backups, account recovery, real-device/YouTube playback checks, hosting and full budget/schedule approval |
| 2026-11-16 | D-018 | CONFIRMED | Owner requested continuation and specified YouTube embedding only for video; no video file storage/transcoding implementation |
| 2026-11-16 | D-019 | IMPLEMENTED LOCAL | YouTube link validation/click-to-load player; explicit TEACHER invitations and skill/practice grants; authenticated feedback history; private practice images and scoped revocation; synthetic encrypted local backup/restore drill passed |

## Local pilot implementation checklist (current)

- [x] Persistent MariaDB migrations and idempotent draft-curriculum seed, no fabricated events or future seasons.
- [x] Secure one-time admin initialization, login/logout, absolute session expiry, server role checks and CSRF/origin protection.
- [x] Parent management of project, explicit seasons, targets/budgets, gifts/expenses with transactional audit, stages, skills/history, lessons, practice and journal visibility.
- [x] Existing public frontend reads live approved data; finance totals separated from spending; public HTML/CSS retained.
- [x] Protected generated-image upload, metadata stripping, quotas/deletion, no unrestricted media folder.
- [x] Single-use family invitations, expiry/revocation/regrant and read-only shared journal.
- [x] Invited teacher workspace with explicit skill/practice grants, feedback/status history and private practice images.
- [x] YouTube-only video links in journal/practice; protected disclosure and click-to-load player. Video uploads excluded by owner choice.
- [x] Synthetic encrypted database/image backup and restore into isolated local MariaDB; token purge, image hash, private access and revoked-account checks.
- [ ] Real-browser/real-device YouTube playback, target-host backup rotation/restore, teacher lesson feedback and per-member family ACLs.
- [ ] Windows/native builds, browser visual regression and physical PC/iPad/mobile verification.
- [ ] Encrypted backup/restore drill, retention/privacy review, production hosting and deployment approval.

The original roadmap below remains as historical product/education planning; it does not revoke D-015.

## Quy ước trạng thái

- **CONFIRMED:** chủ dự án đã xác nhận.
- **PROPOSED:** khuyến nghị đang bàn, chưa phê duyệt.
- **OPEN:** cần quyết định.
- **FUTURE:** không nằm trong scope hiện tại.

## Quyết định đã được ghi nhận

| Ngày | Mã | Trạng thái | Nội dung |
|---|---|---|---|
| 2026-11-16 | D-001 | CONFIRMED | Website vui về hành trình Luca 4 tuổi học trống, cập nhật video và kêu gọi hỗ trợ người thân |
| 2026-11-16 | D-002 | CONFIRMED | **Season/Vòng 1 kéo dài trọn 2 năm**, thay cho ý tưởng một năm ban đầu |
| 2026-11-16 | D-014 | CONFIRMED | **Luca Drum Quest là dự án gồm nhiều vòng**; Vòng 1 gồm 24 tháng và quỹ trọn gói học phí + bộ trống. Không chia Vòng 1 thành nhiều vòng nhỏ; Vòng 2+ chưa chốt nội dung/kinh phí/thời hạn |
| 2026-11-16 | D-003 | CONFIRMED | Dự kiến 1 buổi với giáo viên/tuần; ngân sách tham khảo 500–700 nghìn VND/buổi |
| 2026-11-16 | D-004 | CONFIRMED | Có bài học/kỹ năng chi tiết, luyện ở nhà trước khi tăng độ khó; giáo viên dạy kỹ năng mới và sửa lỗi |
| 2026-11-16 | D-005 | CONFIRMED | Luca thường nghe nhạc thờ phượng Nissi United và gõ theo |
| 2026-11-16 | D-006 | CONFIRMED | Dự án lưu trên GitHub `litequang/Luca-Drum-Quest`; cần bản đồ dễ hiểu cho AI khác |
| 2026-11-16 | D-007 | PROPOSED | Dùng 6 trục kỹ năng, 8 chặng ba tháng, 12 tuần đầu là pilot phương pháp |
| 2026-11-16 | D-008 | PROPOSED | Hệ thống LEARNING/PRACTICING/HOME READY/TEACHER PASS |
| 2026-11-16 | D-009 | PROPOSED | Website chia Family View và Parent Learning Dashboard, video mặc định riêng tư |
| 2026-11-16 | D-010 | CONFIRMED | Học **bài bản 24 tháng để chơi/đệm nhạc thờ phượng Chúa**; không phải chương trình đào tạo chuyên nghiệp để hành nghề |
| 2026-11-16 | D-011 | CONFIRMED | ChatGPT tự làm frontend trên main; Codex phụ trách backend theo đề bài riêng, không redesign UI |
| 2026-11-16 | D-012 | PROPOSED | Nội dung giáo trình ưu tiên kỹ thuật căn bản + timing/groove/dynamics + theo người dẫn, qua bài nhạc thờ phượng |
| 2026-11-16 | D-013 | OPEN | Chi tiết bài nhạc và giáo trình A–Z, lưu trữ, auth/hosting cho backend chưa chốt |

## Lộ trình ưu tiên

### P0 — Khóa phương pháp và khảo sát thực tế (NEXT)

- [ ] Trao đổi với một hoặc nhiều giáo viên có kinh nghiệm dạy trẻ 4–6 tuổi; xác nhận cách đánh giá ban đầu.
- [ ] Xác định thời lượng buổi dạy, lịch bắt đầu, chính sách dời/học bù, phí thực tế.
- [ ] Chốt định hướng giáo trình (đề xuất phối hợp cảm âm + kỹ thuật).
- [ ] Chọn 1–3 bài Nissi United Luca đã quen; chỉ lưu tên/link nguồn hợp pháp, làm bài mẫu theo từng cấp độ.
- [ ] Nhờ thầy gợi ý setup dụng cụ có kích thước phù hợp, tiếng ồn và an toàn.
- [ ] Chốt danh mục kỹ năng đầu kỳ và rubric với thầy (không dùng AI như người kiểm định duy nhất).

### P1 — Bộ giáo án thử nghiệm 12 tuần (NEXT AFTER P0)

- [ ] Viết phiếu từng tuần: mục tiêu, trò chơi 5–10 phút, lỗi cần cảnh giác, video tùy chọn.
- [ ] Thử quy trình thầy bàn giao bài và phụ huynh báo cáo tại nhà.
- [ ] Thu thập ý kiến sau 4 tuần; đánh giá sau 12 tuần.
- [ ] Điều chỉnh trục kỹ năng / mốc 24 tháng theo phản ứng thực tế.

### P2 — Website MVP (local implementation above; historical planning checklist below)

- [x] Tạo frontend tĩnh responsive, landing Season 1, timeline 8 chặng, Skill Cards, journal demo và ngân sách minh họa.
- [ ] Chốt domain, hosting, stack, backend storage; Codex lập đề xuất kiến trúc trước khi code.
- [ ] Tạo Practice Log, Teacher Notes, quản lý buổi học với quyền riêng tư và API; không tự sửa lại UI.
- [ ] Backend riêng tư: video phân quyền, chia sẻ mời, xóa dữ liệu và bảo vệ trẻ (xem BACKEND_HANDOFF.md).
- [x] Frontend máy tính học phí demo 500–700k/buổi, 104 buổi lập ngân sách Vòng 1. Hướng dữ liệu tương lai phải hỗ trợ nhiều vòng.
- [ ] Backend sổ thu chi thực và mục tiêu hỗ trợ được gia đình duyệt, không có thanh toán tự động.
- [ ] Test thực tế mobile, bảo mật media và thao tác của bố mẹ.

### P3 — Nâng cấp sau pilot (FUTURE)

- [ ] Theo dõi thói quen chơi nhạc và gợi ý hoạt động sáng tạo.
- [ ] Gamification nhẹ: huy hiệu, các cột mốc.
- [ ] Tích hợp nhận xét giáo viên trực tiếp nếu thầy đồng ý.
- [ ] Chọn tính năng thông báo nhắc luyện tập theo hướng không gây áp lực.
- [ ] Báo cáo cuối Vòng 1; nếu gia đình quyết định tiếp tục, xác định mục tiêu/chương trình/ngân sách của Vòng 2 và tạo vòng mới độc lập. Không tự giả định ngày mở hoặc số tiền.

## Giao việc tiếp theo cho Codex

Đọc docs/BACKEND_HANDOFF.md. Đầu tiên làm B0 tài liệu kiến trúc và threat model, chưa viết backend hay thay UI. Sau khi owner duyệt mới sang B1/B2.

## Các câu hỏi chưa giải quyết

1. Ngày bắt đầu Vòng 1? Chưa biết nên tài liệu không cam kết cụ thể “2026–2028”.
2. Học 30/45/60 phút? Chính sách nghỉ, dời lịch, số buổi thực tế?
3. Pad, trống điện, trống acoustic? Mức chi thiết bị?
4. Tên ca khúc Nissi United Luca hay gõ theo? Đoạn nào con thích?
5. Giáo viên có thể xác nhận Skill Cards và nhận xét video mỗi tuần không?
6. Website chỉ gia đình hay có landing page công khai?
7. Cơ chế ủng hộ tự ghi nhận hay có thu tiền online?
8. Ưu tiên build với stack nào, lưu video ở đâu, đăng nhập ra sao?
9. Chi tiết mức độ phụ huynh muốn yêu cầu PASS: điều kiện tăng độ khó hay điều kiện tiếp tục học? (Đề xuất không dùng PASS làm rào cản cứng.)

## Quy tắc giao việc cho Codex / AI

- Luôn đọc `PROJECT_MAP.md` và `AGENTS.md` trước.
- Không tự tuyên bố đã làm phần chưa làm.
- Khi được giao một phase, triển khai đúng phase; **không thay giao diện frontend đã làm**, đừng tự thêm payment integration hay đăng video trẻ em công khai.
- Nếu phát hiện mâu thuẫn, ưu tiên quyết định **CONFIRMED mới nhất** và báo cáo rõ.
- Sau khi chốt vấn đề mới, cập nhật docs và map trong cùng PR/commit.
