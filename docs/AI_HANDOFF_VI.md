# Bàn giao cho AI phát triển tiếp — 17/11/2026

## Đọc trước và chọn đúng nhánh

1. `AGENTS.md`: phạm vi được duyệt, bảo mật, giữ giao diện, yêu cầu kiểm thử.
2. `PROJECT_MAP.md`: quyết định mới nhất; các ghi chú cũ B0-only đã được thay thế cho local pilot.
3. Tài liệu này, `LOCAL_PILOT_ARCHITECTURE.md`, `06_ROADMAP_AND_DECISIONS.md`.
4. `WINDOWS_BUILD_REPORT.md` cho bằng chứng kiểm tra; `HOSTING_BAN_GIAO_VI.md` cho thao tác owner trên host.

Repository: https://github.com/litequang/Luca-Drum-Quest. Nhánh đang phát triển: **`codex/local-backend-admin-pilot`**. Không mặc định `main` có các bản sửa. Dùng `git log -1` và so sánh remote để biết commit hiện tại; không coi SHA nguồn ban đầu `26077bd` là bản cuối.

Owner yêu cầu hoàn tất trên PC, owner tự cập nhật hosting. Owner đã thao tác trên một host thực và gửi lỗi/log/SQL; agent chỉ đọc endpoint công khai, sửa/build/test tại PC và tạo file bàn giao. Không có bằng chứng đã import bản SQL phục hồi hoặc hoàn tất xác minh quyền/backup trên host. Push mã nguồn không đồng nghĩa deploy hay merge.

## Mã hiện có

- Node **24**, TypeScript, Fastify, MariaDB; frontend vanilla JS và admin riêng. Giữ `index.html`, `styles.css`, bố cục, typography và navigation công khai.
- `server/app.ts`: API public/admin và danh sách route public tường minh. Không phục vụ toàn bộ checkout bằng static server.
- `server/setup.ts`, `server/cli.ts`: first-admin riêng, seed giáo trình dự thảo, khóa khởi tạo bền vững; không đăng ký công khai, không reset Admin bằng setup.
- `server/auth.ts`, `server/access.ts`: session/CSRF/Origin/rate limit, lời mời, thu hồi quyền. TEACHER chỉ được cấp từng skill/practice, không truy cập toàn mùa hay tài chính.
- `server/password.ts`, `password-worker.ts`: **hash-wasm 4.13.0** chạy Argon2id trong worker; giữ PHC `v=19,m=65536,t=3,p=4`, salt ngẫu nhiên 16 byte, digest 32 byte; so sánh constant-time; 1 job hoạt động và tối đa 8 job chờ. Native `argon2` chỉ là devDependency kiểm tra tương thích hai chiều.
- `server/db.ts`: pool ép **utf8mb4**. `migrations/004_unicode_content.sql` nâng charset các cột nội dung mà không đổi khóa ngoại hay nội dung cũ. Không sửa migrations 001–003 đã phát hành.
- `hosting/app.cjs`: bridge Node 24, nạp `.env` riêng và báo lỗi startup theo mã/field allowlist; không log raw error/stack/SQL/secrets. Bridge chưa chứng minh Passenger phù hợp mọi hosting.
- `scripts/package-host.mjs`: tạo `release/` gồm compiled runtime, public assets, migrations, manifests và hướng dẫn. Runtime cài dependencies Linux trên host; không upload Windows `node_modules`.
- YouTube chỉ nhận link video HTTPS trực tiếp. Nhật ký công khai hiển thị iframe `youtube-nocookie` trực tiếp 16:9 khi mở trang/bài, lazy load, không tự phát; bấm Play của YouTube để phát trong trang. Admin xem thử URL ở form trước khi lưu. Family/teacher dùng chung player, giữ phân quyền hiện có. Admin/family/teacher giữ click-to-load; public journal kết nối YouTube khi iframe được tải; không thêm upload video. Video YouTube phải cho phép nhúng. Tiến độ/ngân sách chưa biết để null; không tự mở vòng mới hoặc PASS kỹ năng.

## Sự cố đã xử lý và bằng chứng

1. **503 / native Argon2:** host báo prebuilt cần GLIBC_2.34; Python mới chạy được nhưng compiler cũ không hỗ trợ C++20, các đường dẫn GCC Toolset đã thử không có. Runtime chuyển sang WASM cùng thuật toán/tham số để tránh phụ thuộc compiler. Sharp vẫn native; owner từng xác nhận `sharp: OK`. Không lặp lệnh rebuild Argon2 lịch sử trong guide cũ.
2. **Mất dấu:** API công khai trả JSON HTTP 200 với header UTF-8 nhưng các chuỗi đã chứa `?`. Pool cũ không chỉ định charset; schema cũ phụ thuộc default database. Đã thêm cấu hình utf8mb4 và migration 004. Đổi charset không tự khôi phục ký tự đã mất.
3. **SQL riêng owner cung cấp:** đã tạo patch cập nhật có điều kiện theo giá trị snapshot để khôi phục **124 chuỗi / 22 bản ghi** từ nội dung seed gốc (project, Season 1 objective, 8 stages, 12 skills). Không đoán nội dung riêng; giữ ID/tài khoản/tiến độ/audit cũ, thêm audit phục hồi. Kiểm tra import full dump, patch, nhập lặp và bảo vệ sửa đổi mới hơn trên database `_test` tạm đạt; database tạm đã dọn. File riêng chỉ có trên PC của owner, không có trong Git hay ZIP. Chưa xác nhận owner đã import.

**Kết quả mới nhất tại PC:** typecheck **0**, build **0**, full `npm test` **30 pass / 0 fail, exit 0**; package:host **0**; production audit **0** tại lần kiểm tra đã ghi. 5 kiểm thử frontend là **JSDOM**, không phải browser render/điện thoại thật. Suite có kiểm tra SQL latin1 → utf8mb4, JSON constraints, hash cũ/mới, queue, setup/concurrency, quyền, tài chính, media và YouTube.

Gói production-only cài ngoài checkout trên Windows đã chạy setup/login/admin/lưu/đọc/restart, xác nhận không có native Argon2/tsx, giữ khóa setup và chặn file riêng qua HTTP. Gói mới cũng chạy compiled migration 004 và đọc tiếng Việt/emoji qua HTTP trên database synthetic có sẵn. Các kết quả Windows không thay thế kiểm tra Linux/Passenger, browser playback và thiết bị thật. Chi tiết và baseline 24/29 tests lịch sử ở WINDOWS_BUILD_REPORT.md.

## Chạy và kiểm tra từ checkout mới

```powershell
git fetch origin
git switch codex/local-backend-admin-pilot
node --version  # phải là 24.x
npm ci
npm run typecheck
npm run build
```

Tạo `.env` riêng theo `.env.example`; tạo database/user local theo LOCAL_PILOT_WINDOWS.md. Để chạy toàn bộ suite, cần **database dùng một lần đã tạo sẵn, tên kết thúc `_test`**, cấu hình DB_HOST/PORT/USER/PASSWORD đúng database server local và quyền tương ứng. Suite dùng TEST_DB_NAME đè DB_NAME rồi xóa/tạo các bảng ứng dụng. Tuyệt đối không trỏ tới host/pilot/production.

```powershell
$env:TEST_DB_NAME = 'luca_development_test'
try { npm test } finally { Remove-Item Env:TEST_DB_NAME -ErrorAction SilentlyContinue }
npm run package:host
```

`package:host` tạo thư mục **release/**, không tự tạo file ZIP. Archive các file bên trong release ở cấp gốc, giữ dotfiles `.npmrc`/`.env.example`, dùng tên entry có `/` và kiểm tra không chứa cấu hình riêng. `luca-host.zip` hiện tại là artifact local bị Git bỏ qua; clone mới phải build/đóng gói lại. Không cần test lại SQL private của owner trong CI hay trên máy AI khác.

PC owner hiện có Node/MariaDB portable trong `work/tools`, DB local port 3308, đường dẫn Node ở `work/node-directory.txt`. Đây là tiện ích local, không phải thành phần repository; đừng giả định chúng tồn tại trên máy mới. Không sửa dịch vụ Node/MySQL hệ thống hoặc in secrets từ `.env`/work ra log.

## Việc tiếp theo và điều chưa xác nhận

- **Ưu tiên: engine và foreign keys trên host.** Dump owner gửi dùng MyISAM, không có FK như schema local mong đợi. Patch SQL riêng đã chuẩn bị chuyển 12 bảng sang InnoDB, nhưng việc import chưa xác nhận và patch không bổ sung các FK thiếu. Migrations 001–003 hiện không ép ENGINE nên setup trên host mặc định MyISAM vẫn là khoảng trống. AI tiếp quản cần đề xuất/triển khai migration tiếp theo có kiểm tra orphan/constraints và test với server default MyISAM; không coi migration 004 là bản sửa engine, không tự sửa dữ liệu production hay đánh dấu migration đã chạy. Giữ audit/reference checks trong transaction.
- Owner kiểm tra host đã dùng bản runtime UTF-8/WASM và import patch chưa; thử lưu tiếng Việt, tải lại và đăng nhập. Không cần hỏi hoặc xử lý credentials qua chat; owner giữ cấu hình riêng.
- Kiểm tra HTTPS/cookie, proxy/rate limit, private-media/ảnh, teacher grants và thu hồi sessions trên host; kiểm tra cả LiteSpeed/static routing và Node. Không mở static alias vào repo/media.
- Xác minh backup/restore nhất quán database + media vào nơi riêng, bảo vệ khóa và retention; luồng khôi phục tài khoản chưa có.
- Kiểm tra render và YouTube thực tế trên PC/điện thoại/iPad; JSDOM không chứng minh layout hoặc playback.
- Giáo trình/kỹ năng/PASS vẫn là dự thảo để giáo viên xác nhận; ngân sách, lịch bắt đầu và vòng tiếp theo chưa chốt. Không biến dữ liệu minh họa thành thành tích của trẻ.

## Dữ liệu riêng và cách bàn giao thay đổi

`.env`, `.env.host-private`, `work/`, `release/`, `node_modules/`, ảnh riêng, ZIP, SQL backup/patch và logs host **không đưa lên Git**. Không sao chép SQL trong Downloads vào migrations hay tests. Public migrations chỉ chứa schema, tests chỉ dùng dữ liệu giả và email example.invalid.

Mỗi thay đổi chức năng: đọc docs liên quan → sửa nhỏ trong phạm vi owner yêu cầu → typecheck/build và test phù hợp trên DB `_test` → cập nhật map/decision log/report → rà soát staged diff để loại dữ liệu riêng → commit/push đúng nhánh. Ghi rõ exit codes và những bước host/device chưa chạy. Không merge/deploy chỉ vì đã push.
