# Kiểm tra và build trên Windows — 17/11/2026

## Cập nhật sửa charset tiếng Việt

Gói production-only độc lập cũng chạy migration 004 thành công trên database synthetic có sẵn, trả đúng tiếng Việt/emoji/Unicode tổ hợp qua HTTP, giữ khóa setup và chặn đọc `.env`; exit 0. Chỉ chạy trên Windows, không cập nhật hosting.

Pool chỉ định utf8mb4 và migration 004 chuyển sáu nhóm cột nội dung sang utf8mb4_unicode_ci. Typecheck/build và **30 tests: 30 pass, 0 fail**, đều exit 0. Kiểm thử nâng cấp các cột latin1, giữ nguyên hash/khóa/nội dung cũ, chạy lại migration an toàn, giữ JSON_VALID; lưu/đọc tiếng Việt, emoji và Unicode tổ hợp qua SQL/API sau restart. Không tự khôi phục chữ đã thành dấu ?. Log ở `work/windows-unicode-tests.log` (ignored). API host được đọc để xác nhận nội dung đã hỏng nhưng chưa cập nhật host; các kết quả phía dưới là baseline trước bản sửa charset.

## Cập nhật sửa lỗi host không có compiler mới

Runtime Argon2id đã chuyển sang hash-wasm 4.13.0 trong worker, giữ v19/m65536/t3/p4 và PHC cũ. Native argon2 chỉ còn ở devDependencies để kiểm tra tương thích hai chiều. Không thay UI, thuật toán mật khẩu, database hoặc dữ liệu. Bản gói mới không cần compiler C++/Python cho mật khẩu trên host; Sharp Linux vẫn cần thiết và đã được owner kiểm tra nạp được. **29 tests đạt, 0 lỗi**; typecheck/build/audit production đều exit 0. Gói runtime được cài sạch 71 runtime packages ngoài source checkout; xác nhận native argon2/tsx không tồn tại, nhưng WASM hash/verify và HTTP setup/login/admin/lưu dữ liệu/quyền riêng tư đều đạt. Khởi động lại vẫn giữ nội dung và khóa setup. Đây là kiểm tra Windows, chưa xác nhận host hết 503. Bảng phía dưới là baseline trước bản vá.

Nhánh nguồn: `codex/local-backend-admin-pilot`, commit lấy về `26077bd`. Workspace: `E:\CODE\Luca-Drum-Quest`. Không thực hiện deploy hosting, merge hoặc upload dữ liệu thật.

Đã lấy đúng nhánh từ GitHub và hoàn tất cài dependencies, typecheck, build, kiểm thử MariaDB và kiểm tra gói runtime trên Windows x64. Source đầu vào: `26077bd` (chưa gồm các cập nhật tài liệu/đóng gói trong lần bàn giao này). Chưa thao tác hosting hoặc triển khai production.

## Môi trường thực tế

- Windows x64; Node **24.22.3**, npm **11.19.1** riêng trong `work/tools/`. Node mặc định của máy vẫn là 22.22.2.
- MariaDB **11.4.14** portable trong `work/tools/`, data trong `work/mariadb-data`, chỉ nghe `127.0.0.1:3308`; không sửa dịch vụ MySQL sẵn có.
- ZIP Node và MariaDB được xác minh SHA256 với checksum từ máy chủ chính thức trước khi chạy.
- Chỉ dữ liệu giả và email `example.invalid`; database `_test` riêng cho bộ kiểm thử có thao tác xóa/tạo lại bảng.

## Kết quả đã chạy trên máy

| Kiểm tra | Kết quả | Exit code |
|---|---|---|
| `npm ci` với lockfile gốc | Thành công trên Node 24 Windows | 0 |
| `npm run typecheck` | Đạt | 0 |
| `npm run build` | Biên dịch server runtime; không đưa tests vào dist | 0 |
| `npm test` với `TEST_DB_NAME=luca_windows_test`, DB port 3308 | **24 passed, 0 failed**, gồm 14 subtest integration và parent, 5 DOM tests, 2 packaging tests, 2 YouTube tests | 0 |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilities tại thời điểm kiểm tra | 0 |
| `npm run package:host` | Tạo release runtime, gồm hướng dẫn tiếng Việt và báo cáo này | 0 |
| Cài `npm ci --omit=dev` trong bản copy độc lập `work/runtime-check` | 82 runtime packages; không cài TypeScript/tsx; native Argon2/sharp hoạt động trong kiểm tra runtime/integration | 0 |
| Chạy `app.cjs` từ gói độc lập, database ban đầu rỗng | Setup migrations/draft seed/first Admin, login, cookie HttpOnly/SameSite, sửa và đọc lại nội dung công khai đạt | 0 |
| Kiểm tra HTTP gói runtime | Public assets 200; trang riêng chuyển login; `/.env`, `/.env.host-private`, `/package.json`, source/compiled source/migrations/private-media và hướng dẫn nội bộ đều 404 | 0 |
| Tắt/mở lại runtime | Nội dung đã lưu còn nguyên; `/setup` vẫn đóng, chuyển login | 0 |

Kiểm thử DOM không phải kiểm tra hình ảnh trên trình duyệt. Công cụ computer-use đã tìm thấy Chrome nhưng không xác định được URL cửa sổ để tiếp tục, nên không thực hiện được kiểm tra render bằng Chrome. Chưa xác minh layout bằng ảnh chụp, thiết bị thật hoặc playback YouTube thực tế; các mục này được giao kiểm tra trên hosting.

## File bàn giao

**Cập nhật chẩn đoán 503:** `hosting/app.cjs` được bổ sung log mã lỗi/field an toàn sau khi owner cung cấp log lỗi chung từ host. Đã chạy lại typecheck/build và 3 tests của `tests/packaging.test.ts`, tất cả exit 0; test mới kiểm tra lỗi DB/module/config không in giá trị bí mật. Gói ZIP được cập nhật bridge này. Đây là cải thiện chẩn đoán; chưa xác định nguyên nhân hoặc chứng minh đã hết 503 trên host, và không chạy lại bộ MariaDB 24 tests cho thay đổi chỉ ở bridge.

- `luca-host.zip`: runtime đã build, không chứa `.env`, `.env.host-private`, node_modules Windows, source TypeScript, dữ liệu DB, ảnh riêng hoặc backup. Có các dotfiles `.npmrc` và `.env.example` cần thiết.
- `.env.host-private`: file riêng bị Git bỏ qua, đã tạo SETUP_TOKEN khác với khóa thử local. Chủ dự án upload riêng, đổi tên `.env` và điền domain/DB/path trên hosting theo [hướng dẫn](HOSTING_BAN_GIAO_VI.md).
- `release/`: nội dung giải nén tương đương ZIP, chỉ dùng cho upload; không chứa dữ liệu runtime cài đặt.

Kiểm tra danh sách ZIP và dò chính các khóa/mật khẩu local trong toàn bộ file đóng gói được thực hiện trước khi bàn giao. Cấu hình riêng không được in ra chat/log. Các tiến trình Node/MariaDB tạo riêng để thử được dừng sau khi kiểm tra; không để thêm dịch vụ chạy nền.

## Phần còn lại trên hosting

Làm theo [HOSTING_BAN_GIAO_VI.md](HOSTING_BAN_GIAO_VI.md): DNS/HTTPS, Node 24 + Passenger, database/user, Linux runtime dependencies, cấu hình riêng, first Admin, kiểm tra Apache/LiteSpeed không lộ file riêng và backup/restore trên host. Build thành công trên Windows chưa chứng minh tương thích tài khoản hosting cụ thể. Chưa có password recovery/MFA hoặc rate limit dùng chung nhiều process; các giới hạn còn lại theo [LOCAL_PILOT_REPORT.md](LOCAL_PILOT_REPORT.md).

- Node riêng trong `work/tools/`, không thay phiên bản Node mặc định của máy.
- Database kiểm thử độc lập trong `work/`, chỉ bind loopback và không sử dụng MySQL sẵn có.
- `.env`, `.env.host-private`, `work/`, `release/`, `node_modules/`, `dist/` và ZIP bị Git bỏ qua.
- Cấu hình hosting riêng được tạo với SETUP_TOKEN ngẫu nhiên, không xuất khóa ra log/chat và không đóng vào gói upload.
