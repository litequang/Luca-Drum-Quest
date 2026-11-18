# 06 — Roadmap, nhật ký quyết định và câu hỏi cần chốt

**Trạng thái:** LOCAL BACKEND + ADMIN PILOT implemented; no production deployment or payment integration. See [LOCAL_PILOT_REPORT.md](LOCAL_PILOT_REPORT.md) for implementation scope, actual test results and remaining gates. Earlier B0-only instructions below are historical and superseded for local development by D-015.

| Ngày | Mã | Trạng thái | Nội dung |
|---|---|---|---|
| 2026-11-17 | D-032 | CONFIRMED REQUEST / LOCAL HANDOFF | Owner yêu cầu cập nhật các bản sửa lên GitHub và tài liệu để AI khác tiếp tục. Rà soát/commit/push nhánh hiện tại; thêm AI_HANDOFF_VI.md, thống nhất trạng thái mới nhất 30 tests/UTF-8/WASM và ghi rõ khoảng trống InnoDB/FK trên host. Không đưa SQL/config/media/logs riêng vào Git; push không phải merge/deploy |
| 2026-11-17 | D-031 | CONFIRMED REQUEST / IMPLEMENTED LOCAL | Owner cung cấp SQL riêng và yêu cầu bản sửa sẵn nhập lại. Tạo guarded UPDATE patch riêng ở Downloads: phục hồi 124 chuỗi nguồn đã biết/22 bản ghi, không đoán nội dung riêng; giữ tài khoản/ID/tiến độ/audit lịch sử, thêm audit mới; đổi 12 bảng MyISAM trong snapshot sang InnoDB. Kiểm tra import full dump và patch, nhập lặp và giữ sửa đổi mới hơn trên MariaDB `_test` tạm đạt; đã dọn DB tạm. Không commit/package SQL riêng, chưa import host |
| 2026-11-17 | D-030 | IMPLEMENTED LOCAL / HOST VERIFICATION OPEN | Owner báo tiếng Việt thành dấu ?. API công khai xác nhận payload đã mất dấu, HTTP UTF-8 đúng. Ép pool utf8mb4 và thêm migration 004 chuyển các cột nội dung/JSON/audit/nhãn/nhận xét sang utf8mb4, giữ nguyên khóa ngoại/tài khoản/nội dung cũ. Hướng dẫn owner backup/cập nhật/migrate và nhập lại hai câu gốc; không reseed hay đoán nội dung đã mất. Chưa thao tác DB/deploy trên host |
| 2026-11-16 | D-015 | CONFIRMED | Owner explicitly authorized Node 24/TypeScript/Fastify/MariaDB local backend, secure Admin Dashboard, API integration, audited manual finance and a branch/commit/push/PR; no production deployment, real child data or payments |
| 2026-11-16 | D-016 | IMPLEMENTED LOCAL | Parent sessions/CSRF/rate limits; season/project/finance/lesson/skill/practice/journal forms; published public projections; single-use invited family access and revocation; sanitized private images |
| 2026-11-16 | D-017 | OPEN / PRODUCTION BLOCKER | Target-host private-media/security review, production backups, account recovery, real-device/YouTube playback checks, hosting and full budget/schedule approval |
| 2026-11-16 | D-018 | CONFIRMED | Owner requested continuation and specified YouTube embedding only for video; no video file storage/transcoding implementation |
| 2026-11-16 | D-019 | IMPLEMENTED LOCAL | YouTube link validation/click-to-load player; explicit TEACHER invitations and skill/practice grants; authenticated feedback history; private practice images and scoped revocation; synthetic encrypted local backup/restore drill passed |
| 2026-11-17 | D-020 | CONFIRMED | Owner requested first-admin browser setup and PC-build/host database/environment workflow; no actual production deployment |
| 2026-11-17 | D-021 | IMPLEMENTED LOCAL | Private-key /setup with durable lock, auto migration/draft seed after key authorization, migration 003 legacy protection; compiled runtime package and app.cjs bridge |
| 2026-11-17 | D-022 | CONFIRMED | Chủ dự án yêu cầu cập nhật đúng nhánh tại PC, hoàn tất cài đặt/kiểm tra/build/đóng gói ở máy; chỉ bàn giao thao tác hosting cho chủ dự án. Không thao tác hosting trong nhiệm vụ này. Xem HOSTING_BAN_GIAO_VI.md và WINDOWS_BUILD_REPORT.md |
| 2026-11-17 | D-023 | IMPLEMENTED LOCAL | Windows x64: Node 24.22.3/MariaDB 11.4.14 riêng; cài dependencies/typecheck/build, 24 tests đạt; gói runtime độc lập chạy setup/login/lưu dữ liệu/restart và kiểm tra HTTP file riêng đạt. ZIP và cấu hình host riêng được chuẩn bị; Chrome visual check không thực hiện được do công cụ không xác định URL. Chưa deploy |
| 2026-11-17 | D-024 | OPEN / IMPLEMENTED LOCAL DIAGNOSTICS | Owner báo 503 trên host và cung cấp log/ảnh cPanel. Bridge cũ che nguyên nhân; bản mới ghi mã lỗi/field an toàn, không raw error/stack/secrets. Typecheck/build và 3 packaging tests đạt (exit 0); cần log mới sau khi owner thay app.cjs/restart để xác định lỗi thực tế. Chưa xác nhận khắc phục 503 |
| 2026-11-17 | D-025 | OBSERVED / OPEN HOST FIX | Log mới từ owner xác nhận Node v24.22.3 báo ERR_DLOPEN_FAILED khi import backend. Lỗi nạp native addon; chưa xác định argon2/sharp, binary hay system library cụ thể. Đã thêm lệnh kiểm tra từng module không đọc .env/DB trong hướng dẫn; lệnh chạy local Windows đạt cả hai, không chứng minh Linux host tương thích |
| 2026-11-17 | D-026 | OBSERVED / PROPOSED HOST FIX | Owner kiểm tra trong đúng Node environment/Application root: Argon2 prebuilt báo thiếu GLIBC_2.34, sharp OK. Hướng dẫn build riêng version Argon2 đang cài từ source trên host; cần toolchain Python/make/C++. Chưa có kết quả build hoặc xác nhận hết 503; không đổi thuật toán/hash/DB |
| 2026-11-17 | D-027 | OPEN HOST VERIFICATION | Owner gửi tiếp stack trace vẫn nạp Argon2 prebuild, chưa cung cấp output của lệnh rebuild. Bổ sung cách gọi trực tiếp node-gyp@11 cho module hiện có để tránh phụ thuộc install script; chờ log build thực tế, chưa kết luận compiler bị chặn hay đã build thành công |
| 2026-11-17 | D-028 | OBSERVED / OPEN HOST FIX | Log đầy đủ xác nhận npm rebuild bị allowScripts bỏ qua; direct node-gyp 11.5.0 đã tải headers nhưng chọn Python 3.6.8, lỗi cú pháp := trước khi compile. Bổ sung dò Python 3.9+ và --python tường minh; chưa biết Python/toolchain khác trên tài khoản và chưa xác nhận host phục hồi |

## Local pilot implementation checklist (current)

**D-029 — 2026-11-17 — IMPLEMENTED LOCAL / PROPOSED HOST FIX:** Sau khi owner xác nhận không tìm thấy GCC Toolset tại các vị trí đã kiểm tra, chuẩn bị bản local dùng hash-wasm 4.13.0 cho Argon2id trong worker, giữ nguyên PHC v19/m65536/t3/p4, salt 16 bytes và digest 32 bytes; native argon2 chuyển dev-only để kiểm tra hai chiều. Hàng đợi giới hạn, một derivation hoạt động và so sánh timingSafeEqual; không đổi password/DB/UI. Typecheck/build, 29 tests và production-only runtime HTTP/restart checks đạt; audit production 0 reported vulnerabilities. Owner thực hiện hosting update; chưa xác nhận host phục hồi và không coi implementation choice này là quyết định production đã duyệt.

**D-029 — 2026-11-17 — IMPLEMENTED LOCAL / HOST VERIFICATION OPEN:** Owner's host cannot find GCC Toolset 12–14 at checked paths. Prepared a local compatibility fix: hash-wasm 4.13.0 replaces the runtime native Argon2 binding while retaining Argon2id v19/m65536/t3/p4 and PHC format. Native argon2 remains dev-only for two-way interoperability tests. Derivation runs in isolated bounded workers and compares digests with timingSafeEqual. No DB migration/password reset, backend stack/UI change or automatic hosting deployment. Validation and host upload remain recorded separately.

**Host incident update, 2026-11-17 (OBSERVED / OPEN):** Python 3.11.18 đã chạy và phần C của Argon2 biên dịch được; C++ compiler mặc định không hỗ trợ `-std=gnu++20`. Cần toolchain C++20 được nhà cung cấp cho phép (đã thêm dò GCC Toolset 12–14 và CC/CXX tường minh trong hướng dẫn). Chưa có kết quả compiler mới hoặc phục hồi 503; không đổi auth/DB/stack.

- [x] Persistent MariaDB migrations and idempotent draft-curriculum seed, no fabricated events or future seasons.
- [x] Secure one-time admin initialization, login/logout, absolute session expiry, server role checks and CSRF/origin protection.
- [x] Parent management of project, explicit seasons, targets/budgets, gifts/expenses with transactional audit, stages, skills/history, lessons, practice and journal visibility.
- [x] Existing public frontend reads live approved data; finance totals separated from spending; public HTML/CSS retained.
- [x] Protected generated-image upload, metadata stripping, quotas/deletion, no unrestricted media folder.
- [x] Single-use family invitations, expiry/revocation/regrant and read-only shared journal.
- [x] Invited teacher workspace with explicit skill/practice grants, feedback/status history and private practice images.
- [x] YouTube-only video links in journal/practice; protected disclosure and click-to-load player. Video uploads excluded by owner choice.
- [x] Synthetic encrypted database/image backup and restore into isolated local MariaDB; token purge, image hash, private access and revoked-account checks.
- [x] First-admin browser setup with private key, concurrency protection and durable initialized marker; CLI remains available.
- [x] Runtime upload package tested outside the source checkout with Linux production dependencies only, plus compiled CLI and restart checks.
- [ ] Actual HawkHost plan/Node/Passenger/HTTPS/Apache routing verification and owner approval before deployment.
- [ ] Real-browser/real-device YouTube playback, target-host backup rotation/restore, teacher lesson feedback and per-member family ACLs.
- [x] Windows native dependency installation, typecheck/build, 24 automated tests and isolated packaged-runtime HTTP/restart verification; see WINDOWS_BUILD_REPORT.md.
- [ ] Browser visual regression and physical PC/iPad/mobile verification; computer-use could not determine the Chrome URL during Windows verification.
- [ ] Target-host encrypted backup/restore drill, retention/privacy review, production hosting and deployment approval.

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

**2026-11-18 — CONFIRMED / merge integration:** Owner yêu cầu hợp nhất backend pilot và những bản sửa frontend vào main. Main là nguồn chuẩn; giữ nhánh pilot lịch sử, không deploy tự động. Kiểm thử sau merge và host xác nhận riêng.
