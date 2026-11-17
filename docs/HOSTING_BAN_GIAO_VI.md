# Bàn giao hosting — Luca Drum Quest

Ngày: 17/11/2026. Bản mã nguồn: nhánh `codex/local-backend-admin-pilot`.

## Bản sửa tiếng Việt thành dấu `?` — thực hiện trước các hướng dẫn cũ

**Bản phục hồi từ SQL owner cung cấp:** Đã tạo riêng trên PC `C:\Users\litequang\Downloads\giaouocc_luca_NHAP_FILE_NAY.sql` để Import vào database hiện tại, không cần xóa bảng hay nhập lại từng mục. File sửa 124 chuỗi trong 22 bản ghi theo nội dung seed gốc, chỉ cập nhật khi giá trị còn khớp snapshot; giữ tài khoản/ID/tiến độ và audit cũ, thêm audit phục hồi. Dump host dùng MyISAM nên file cũng chuyển 12 bảng sang InnoDB để transaction hoạt động. Đã kiểm tra nhập thực tế trên hai database `_test` tạm, JSON hợp lệ, nhập lặp an toàn và giữ nội dung sửa mới hơn; đã xóa các database kiểm tra. File SQL chứa dữ liệu riêng, không nằm trong repository/ZIP. Trong cPanel Stop App → phpMyAdmin chọn đúng database → Import file trên với UTF-8 → Start/Restart App. Không xóa database/bảng và không import lại dump gốc. Bản `giaouocc_luca_DA_SUA_UTF8.sql` là full dump đã sửa dành cho database trống, không dùng để nhập đè database hiện tại. Cần giữ bản ứng dụng mới đã ép kết nối utf8mb4. Các bước nhập tay phía dưới là phương án khi không dùng file phục hồi.

API công khai của host trả HTTP 200/UTF-8 nhưng nội dung đã chứa `h?c tr?ng...`. Kết nối cũ không chỉ định charset nên có thể kế thừa `latin1` từ host; các cột nội dung cũng kế thừa charset database. Gói mới ép kết nối `utf8mb4`; migration `004_unicode_content.sql` chuyển các cột nội dung/JSON/nhận xét/nhãn/audit sang `utf8mb4`. Không đổi khóa ngoại hoặc tài khoản. Hướng dẫn này bổ sung migration cho bản sửa 503 phía dưới.

1. Backup database, giữ nguyên `.env` và ảnh riêng. Trong cPanel, **Stop App**, upload/giải nén gói `luca-host.zip` mới nhất vào `/home/giaouocc/luca` (không lồng `release/`).
2. Mở Terminal và chạy:

   ```sh
   source /home/giaouocc/nodevenv/luca/24/bin/activate && cd /home/giaouocc/luca
   npm run db:migrate
   ```

   Chỉ tiếp tục khi lệnh báo `Completed`. Nếu host chưa dùng gói WASM trước đó, chạy `npm install --omit=dev --include=optional` trước migration. Không build TypeScript trên host, không chạy lại setup hay seed.
3. Chọn **Start App/Restart**. Đăng nhập tại `https://luca.giaouoc.com/admin/login`, mở thông tin dự án, dán lại và lưu hai trường:

   **Mô tả:** Hành trình học trống bài bản để chơi nhạc thờ phượng Chúa.

   **Giới thiệu:** Vòng 1: 24 tháng học tập; quà tặng tự nguyện, không phải đầu tư hoặc hoàn vốn.

4. Tải lại trang và kiểm tra `/api/v1/public/project`: hai dòng phải còn đủ dấu. Các chữ đã lưu thành `?` không thể tự khôi phục; nhập lại từ bản gốc/backup nếu cần. Giáo trình được seed qua kết nối cũ cũng có thể bị ảnh hưởng. Không xóa dữ liệu/reseed để sửa, không sửa audit lịch sử.

Nếu chưa tạo Admin, dùng gói mới trước rồi mở `/setup` như mục 6: migration chạy trước seed. Kiểm thử trên Windows bao gồm nâng cấp cột latin1, tiếng Việt/emoji/Unicode tổ hợp và API lưu/đọc sau restart. Chưa thực hiện cập nhật database hoặc kiểm tra kết quả sau sửa trên host.

**Bản sửa 503 mới nhất:** runtime đã chuyển phần thực thi Argon2id sang WebAssembly (`hash-wasm`), giữ PHC và các tham số cũ. Không cần build Argon2 bằng GCC/Python trên host. `argon2` native chỉ còn là dependency kiểm thử ở PC; `sharp` vẫn cần bản Linux và đã được chủ dự án kiểm tra `sharp: OK`. Các bước build native trong mục 8 là lịch sử chẩn đoán của gói cũ.

Để cập nhật host đang lỗi: backup cấu hình/database, upload và giải nén **gói `luca-host.zip` mới nhất** vào đúng Application root để cập nhật `dist/`, `package.json`, `package-lock.json`, `app.cjs`; giữ nguyên `.env` và thư mục ảnh. Chọn **Run NPM Install** trong Setup Node.js App (gói có `.npmrc` đặt `omit=dev`), sau đó **Restart** và mở lại `/setup`. Nếu dùng Terminal trong đúng Node environment, dùng `npm install --omit=dev --include=optional`. Không chạy tiếp các lệnh rebuild Argon2 cũ. Bản vá này không cần migration hay thay mật khẩu/khởi tạo lại Admin trên database đã cài; host vẫn cần được kiểm tra thực tế sau cập nhật.

Phần cài công cụ, dependencies, kiểm tra và biên dịch được thực hiện trên PC. Bạn chỉ cần làm các bước dưới đây trên hosting. Kết quả kiểm tra cụ thể nằm trong [WINDOWS_BUILD_REPORT.md](WINDOWS_BUILD_REPORT.md).

## 1. Các file dùng để triển khai

- `luca-host.zip`: bản đã biên dịch, giải nén trực tiếp vào thư mục ứng dụng trên host. Có cả `.npmrc`, `.env.example`, `app.cjs`, `dist/`, `admin/`, `migrations/` và các tài nguyên frontend.
- `.env.host-private` ở thư mục dự án trên PC: file cấu hình riêng đã tạo sẵn khóa `SETUP_TOKEN`. Upload riêng file này, đổi tên thành `.env` trên host rồi điền thông tin hosting. Không đưa file này vào Git, ZIP công khai hoặc gửi qua chat.
- `HOST_SETUP_VI.md` trong ZIP: bản hướng dẫn này. Không cần upload `node_modules`, `work/`, toàn bộ source, database hay `.env` dùng kiểm thử ở PC.

Không phải build TypeScript trên hosting. Hosting vẫn cần cài dependencies Linux vì `sharp` có thành phần native theo hệ điều hành. Mật khẩu dùng Argon2id WASM trong worker, không cần compiler/GCC cho Argon2.

## 2. Chuẩn bị domain và thư mục

1. Vào cPanel → **Domains**, tạo/chọn domain hoặc subdomain riêng cho dự án; dùng ứng dụng tại `/`, ví dụ `https://drum.example.com`, không dùng `/luca`.
2. Trỏ DNS theo địa chỉ hosting cung cấp; bật SSL/AutoSSL và kiểm tra HTTPS hoạt động.
3. Trong **File Manager → Settings**, bật **Show Hidden Files (dotfiles)**.
4. Tạo thư mục ứng dụng `/home/TEN_CPANEL/luca-app` và thư mục ảnh `/home/TEN_CPANEL/luca-private-media`, ngoài `public_html` và mọi document root.
5. Upload `luca-host.zip` vào `luca-app`, chọn **Extract** ngay tại đó. `app.cjs` và `package.json` phải nằm trực tiếp trong `luca-app`, không bị lồng thêm `release/`.
6. Upload riêng `.env.host-private` vào `luca-app`, đổi tên thành `.env`. Đặt quyền file `0600` và thư mục ảnh `0700` nếu hosting hỗ trợ. Xóa ZIP khỏi host sau khi giải nén.

## 3. Tạo database

Trong **MySQL Databases / Manage My Databases** hoặc **Database Wizard**:

1. Tạo database mới chỉ dành cho ứng dụng, ví dụ `TEN_CPANEL_luca`.
2. Tạo user mới, ví dụ `TEN_CPANEL_lucauser`, dùng mật khẩu riêng và lưu trong trình quản lý mật khẩu.
3. **Add User To Database**, cấp quyền trên đúng database này. Cài đặt ban đầu cần SELECT, INSERT, UPDATE, DELETE, CREATE, ALTER, INDEX, REFERENCES. cPanel có thể dùng **ALL PRIVILEGES** trên database riêng này để khởi tạo.
4. Ghi lại tên database/user đầy đủ có tiền tố cPanel và địa chỉ DB server. MariaDB 10.11+ là mục tiêu; không mặc định phiên bản MySQL bất kỳ là tương thích.

Chưa cần import SQL bằng phpMyAdmin: `/setup` sẽ chạy migrations và tạo giáo trình dự thảo trên database đã cấu hình. Database mới chưa có tài khoản Admin hoặc dữ liệu học tập thật.

## 4. Sửa `.env` trực tiếp trên hosting

Thay các giá trị `CHANGE_ME` trong file đã upload:

```dotenv
HOST=127.0.0.1
PORT=3000
APP_ORIGIN=https://CHANGE_ME.example.com
COOKIE_SECURE=true
DB_HOST=localhost
DB_PORT=3306
DB_USER=CHANGE_ME_cpanel_database_user
DB_PASSWORD=CHANGE_ME_database_password
DB_NAME=CHANGE_ME_cpanel_database
MEDIA_DIR=/home/CHANGE_ME_cpanel/luca-private-media
SESSION_HOURS=8
SETUP_TOKEN=<giữ nguyên khóa riêng đã được tạo trong file>
```

`APP_ORIGIN` phải đúng HTTPS domain, không có dấu `/` cuối, không thêm đường dẫn. `DB_*` là tài khoản máy chủ database; email/mật khẩu đăng nhập website sẽ tạo riêng ở bước 6. Nếu mật khẩu DB chứa `#` hoặc khoảng trắng, đặt giá trị trong dấu nháy kép theo cú pháp dotenv.

Giữ `PORT` do trình quản lý Node cấp nếu có. Nếu cũng khai báo biến trong giao diện cPanel, giá trị ở đó được ưu tiên hơn `.env`; tránh để hai nơi khác nhau. Chọn **Restart** sau mỗi lần đổi cấu hình.

## 5. Tạo Node application

Vào **Software → Setup Node.js App → Create Application**:

| Trường | Giá trị |
|---|---|
| Node.js version | **24.x** |
| Application mode | **Production** |
| Application root | `luca-app` tương ứng `/home/TEN_CPANEL/luca-app` |
| Application URL | domain HTTPS ở bước 2, đường dẫn `/` |
| Application startup file | **app.cjs** |

Chọn **Create**, rồi **Run NPM Install**. File `.npmrc` trong gói đặt `omit=dev`. Nếu dùng Terminal/SSH, sao chép **chính lệnh activate environment** mà cPanel hiển thị cho ứng dụng, chạy nó, chuyển vào thư mục ứng dụng và chạy:

```sh
node --version
npm ci --omit=dev
```

`node --version` phải là `v24.x`. Sau khi cài dependencies thành công, chọn **Restart**. Không chạy thêm `npm start` trong Terminal song song với Passenger.

HawkHost có hướng dẫn chính thức cho [Setup Node.js App](https://www.hawkhost.com/kb/programming/nodejs/how-to-create-a-nodejs-application/) và liệt kê [Node 24](https://www.hawkhost.com/kb/programming/nodejs/available-nodejs-versions/). Tuy nhiên, runtime, routing, tài nguyên và native modules vẫn cần kiểm tra trên tài khoản cụ thể. Nếu không thấy Node 24 hoặc Setup Node.js App, nhờ hosting bật/hỗ trợ đúng runtime; upload vào host PHP/static không chạy được backend này.

## 6. Tạo Admin lần đầu

1. Mở `https://DOMAIN_CUA_BAN/setup`.
2. Sao chép giá trị `SETUP_TOKEN` từ `.env` riêng trên host vào **Khóa cài đặt**. Không đưa khóa vào URL.
3. Điền email Admin và mật khẩu riêng từ 14–128 ký tự, nhập lại mật khẩu, chọn **Khởi tạo tài khoản Admin**.
4. Hệ thống tự chạy migrations, tạo giáo trình dự thảo và một tài khoản phụ huynh. Đăng nhập ở `/admin/login`, vào quản trị tại `/admin`.
5. Xóa dòng `SETUP_TOKEN` khỏi `.env` và cả biến tương ứng trong cPanel nếu có; **Restart**. Cơ chế khóa trong database ngăn khởi tạo lại ngay cả khi còn khóa cũ.

Không nhập dữ liệu thật trước khi hoàn tất kiểm tra quyền riêng tư và backup dưới đây. Nếu cài đặt báo lỗi database, kiểm tra cấu hình/quyền/log trước; không xóa bảng hoặc dùng root để thử lại. Setup không phải chức năng quên mật khẩu; tính năng tự khôi phục mật khẩu chưa có, cần giữ kỹ thông tin Admin.

## 7. Kiểm tra trên host

- `/` mở được; không có lỗi tải CSS/JS hoặc API. `/admin` khi chưa đăng nhập phải chuyển đến trang đăng nhập.
- Sau khi tạo Admin, `/setup` chuyển về đăng nhập. Đăng nhập, sửa phần giới thiệu bằng nội dung thử, lưu rồi tải lại để kiểm tra database hoạt động.
- Thử lời mời gia đình và giáo viên với tài khoản thử; giáo viên chỉ thấy bài/kỹ năng được gán. Thu hồi quyền rồi kiểm tra tài khoản không còn truy cập được nội dung riêng.
- Dùng ảnh tạo thử để kiểm tra tải lên/xóa/quyền xem; thử YouTube trên PC, điện thoại và iPad. Link YouTube unlisted có thể bị sao chép ngoài website.
- `/.env`, `/.env.host-private`, `/package.json`, `/server/config.ts`, `/private-media/` phải không tải được nội dung. Kiểm tra cả Apache/LiteSpeed, không chỉ Node; không cấu hình static alias tới thư mục ứng dụng/ảnh riêng.
- Không cấu hình cache cho `/api/`, `/admin`, `/family`, `/teacher`, `/setup` hoặc ảnh riêng. Kiểm tra cookie session có Secure/HttpOnly và HTTPS không lặp chuyển hướng.
- Sao lưu database + thư mục ảnh nhất quán vào nơi riêng có mã hóa; thử khôi phục vào database/thư mục thử tách biệt trước khi nhập dữ liệu thật. Bảo vệ `.env` riêng và đặt thời hạn giữ backup/audit. Các phần còn mở xem tài liệu pilot trong repository.

## 8. Xử lý lỗi thường gặp

### Trạng thái mới nhất: Python đã đạt, compiler C++ quá cũ

Log build mới xác nhận Python **3.11.18** tại `/opt/alt/python311/bin/python3` hoạt động; phần C của Argon2 đã biên dịch. Phần C++ dừng vì `g++` không hiểu `-std=gnu++20`. Chưa có binary dùng được và chưa xác nhận website phục hồi. Cần toolchain C++20 mới hơn; không tiếp tục lặp build bằng compiler mặc định này.

Trong đúng Node environment và Application root, khối dưới dò GCC Toolset 12–14 nếu được hosting cung cấp rồi build bằng CC/CXX tường minh. Đây là các vị trí ứng viên, không khẳng định toolset tồn tại trên tài khoản:

```bash
LUCA_BUILD_CXX=
for p in /opt/rh/gcc-toolset-{14,13,12}/root/usr/bin/g++; do
  if [ -x "$p" ] && [ -x "${p%/*}/gcc" ]; then
    LUCA_BUILD_CXX="$p"
    break
  fi
done
if [ -n "$LUCA_BUILD_CXX" ]; then
  "$LUCA_BUILD_CXX" --version
  CC="${LUCA_BUILD_CXX%/*}/gcc" CXX="$LUCA_BUILD_CXX" \
    npm exec --yes --package=node-gyp@11.5.0 -- node-gyp rebuild \
      --directory=node_modules/argon2 --jobs=1 --python=/opt/alt/python311/bin/python3 &&
    node -e "require('argon2'); console.log('argon2: OK')"
else
  echo 'Khong tim thay GCC Toolset 12-14 tai cac vi tri da kiem tra. Can hosting cung cap compiler C++20.'
fi
```

Nếu chưa có toolset hoặc compiler bị chặn trong CageFS, chủ dự án gửi support hosting yêu cầu cung cấp đường dẫn GCC/G++ hỗ trợ C++20 cho Node 24, Python 3.11 và bản Argon2 được build tương thích glibc của máy chủ. Nếu build xong nhưng kiểm tra nạp module báo thiếu GLIBCXX/runtime library, cũng cần nhà cung cấp xác nhận runtime/toolchain phù hợp. Chỉ Restart sau khi kiểm tra nạp đạt. [Node 24 build requirements](https://github.com/nodejs/node/blob/v24.x/BUILDING.md).

### Đã xác định Argon2 yêu cầu `GLIBC_2.34`, còn `sharp: OK`

Kết quả owner cung cấp trong đúng Node environment/thư mục ứng dụng ngày 17/11/2026 xác nhận binary `argon2/prebuilds/linux-x64/argon2.glibc.node` không tương thích thư viện hệ thống của host. Sharp nạp được. Chưa xác nhận host phục hồi; bước sửa là biên dịch **riêng Argon2 đang cài** từ source ngay trên host, giữ nguyên version/thuật toán mật khẩu.

Trong Terminal đã activate environment của ứng dụng và đứng tại Application root:

```sh
npm_config_build_from_source=true npm rebuild argon2 --foreground-scripts
node -e "require('argon2'); console.log('argon2: OK')"
```

Nếu kiểm tra vẫn báo đường dẫn `prebuilds/linux-x64/argon2.glibc.node`, chưa có bằng chứng bản source build được tạo/nạp. Giữ lại output của lệnh build, không chỉ stack trace của `require`. Có thể gọi trực tiếp node-gyp để tránh install script bị bỏ qua. Trong đúng environment/Application root, chạy:

```sh
npm exec --yes --package=node-gyp@11 -- node-gyp rebuild --directory=node_modules/argon2 --jobs=1
```

Lệnh tải công cụ build vào npm cache và biên dịch version Argon2 hiện có, không sửa manifest/lockfile ứng dụng. Chờ kết quả `gyp info ok`; nếu lỗi, gửi các dòng cuối từ `gyp ERR!` và lỗi compiler phía trên trước khi thử tiếp. Nếu thành công mới chạy kiểm tra `require('argon2')` ở trên rồi Restart. Chưa xác minh lệnh build thành công trên tài khoản hosting.

**Log tiếp theo đã xác nhận thêm:** `npm rebuild` bị npm bỏ qua install script vì chưa có allowScripts. Lệnh trực tiếp `node-gyp@11.5.0` đã chạy nhưng chọn Python 3.6.8, dừng ở `SyntaxError` tại toán tử `:=`; chưa đến bước C/C++ compilation. Trong đúng Node environment/Application root, đoạn dưới tự tìm một Python 3.9+ trong các vị trí thông dụng rồi truyền `--python` tường minh:

```bash
LUCA_BUILD_PY=
for p in /opt/alt/python{311,312,310,39}/bin/python3 /usr/bin/python3.{11,12,10,9}; do
  if [ -x "$p" ] && "$p" -c 'import sys; sys.exit(not ((3,9) <= sys.version_info[:2] < (4,0)))' 2>/dev/null; then
    LUCA_BUILD_PY="$p"
    break
  fi
done
if [ -n "$LUCA_BUILD_PY" ]; then
  "$LUCA_BUILD_PY" --version
  npm exec --yes --package=node-gyp@11.5.0 -- node-gyp rebuild --directory=node_modules/argon2 --jobs=1 --python="$LUCA_BUILD_PY"
else
  echo 'Khong tim thay Python 3.9+ tai cac vi tri da kiem tra; can hosting cung cap duong dan Python moi hon.'
fi
```

Đây là dò các vị trí thông dụng, không khẳng định Python mới tồn tại trên tài khoản. Nếu không tìm thấy, hỏi hosting đường dẫn Python tương thích được cấp cho tài khoản; không cài lại Python hệ thống. Nếu lỗi tiếp theo đến từ compiler thì cần lấy đúng output mới trước khi chọn toolchain. Chưa có xác nhận build/website đã thành công. Cách chỉ định Python: [node-gyp configuring Python](https://github.com/nodejs/node-gyp#configuring-python-dependency).

Chỉ khi build thành công và dòng kiểm tra in `argon2: OK`, chọn **Restart** trong Setup Node.js App rồi mở lại `/setup`. Lệnh chỉ build dependency; không thay `.env`, database hoặc khởi tạo Admin. Không chạy `npm ci` ngay sau đó vì có thể thay bản binary vừa biên dịch bằng prebuild cũ. Các lần cài dependencies sạch sau này trên host cũng phải xử lý lại yêu cầu native tương ứng.

Build cần Python được node-gyp hỗ trợ, make và C/C++ compiler mà hosting cho phép chạy. Nếu thiếu toolchain, compiler bị chặn, hết tài nguyên hoặc build lỗi, giữ nguyên log và gửi đoạn lỗi cuối để xử lý tiếp; không tự thay thư viện glibc hệ thống hay dùng sudo. Có thể cần nhờ nhà cung cấp bật toolchain hoặc cung cấp binary tương thích. Tham khảo [Argon2 source build](https://github.com/ranisalt/node-argon2#before-installing) và [node-gyp Unix requirements](https://github.com/nodejs/node-gyp#on-unix).

### Log mới báo `ERR_DLOPEN_FAILED`

Log host được cung cấp ngày 17/11/2026 đã xác nhận Node `v24.22.3` không nạp được native addon. Dự án dùng `argon2` và `sharp`; mã lỗi đơn lẻ chưa xác định module, thư viện hệ thống hay phiên bản glibc gây lỗi. Không đổi mật khẩu/khởi tạo lại database để xử lý mã lỗi này.

Trong cPanel Terminal/SSH, chạy **đúng lệnh activate environment và chuyển thư mục ứng dụng mà Setup Node.js App hiển thị**, rồi chạy lệnh chỉ đọc dưới đây. Lệnh không nạp `.env`, không kết nối database và không in cấu hình riêng:

```sh
node -e "for (const m of ['argon2','sharp']) { try { require(m); console.log(m + ': OK'); } catch (e) { console.error(m + ': ' + e.code + '\n' + e.message); process.exitCode = 1; } }"
```

Gửi kết quả module lỗi để chọn biện pháp phù hợp. Có thể cài lại dependencies đúng Linux/runtime hiện tại bằng `npm ci --omit=dev --include=optional` rồi chạy lại lệnh kiểm tra; lệnh này chỉ thay dependencies, không xóa database/.env. Chỉ Restart khi kiểm tra module đã đạt. Nếu báo thiếu `GLIBC_*`, `GLIBCXX_*` hoặc thư viện `.so`, cài lại có thể không giải quyết được; cần phiên bản hệ điều hành/thư viện tương thích hoặc build module theo toolchain được hosting hỗ trợ. Không tự hạ thuật toán mật khẩu hoặc bỏ xử lý ảnh an toàn để né lỗi.

Tham khảo: [Node error codes](https://nodejs.org/api/errors.html#err_dlopen_failed), [argon2 prebuilt requirements](https://github.com/ranisalt/node-argon2#prebuilt-binaries), [sharp installation](https://sharp.pixelplumbing.com/install/).

### 503 nhưng `stderr.log` chỉ lặp thông báo chung

Nếu log chỉ có `Unable to start Luca Drum Quest...`, file khởi động cũ đã che lỗi gốc. Thay **chỉ** `app.cjs` trong Application root bằng bản mới từ `hosting/app.cjs` trên PC (hoặc `app.cjs` trong gói ZIP mới), giữ nguyên `.env` và dữ liệu, rồi Restart. Không cần chạy lại setup/migrations hoặc xóa database.

Sau khi mở lại `/setup`, lấy dòng mới nhất bắt đầu `[luca-startup]` trong `stderr.log` ở thư mục ứng dụng. Bản mới chỉ ghi mã lỗi/tên trường cấu hình, không in giá trị, stack hoặc SQL. Ví dụ `INVALID_ENVIRONMENT` kèm `invalidFields` cho biết biến sai; `ERR_MODULE_NOT_FOUND`/`MODULE_NOT_FOUND` cần kiểm tra dependencies và file runtime; `ER_ACCESS_DENIED_ERROR` là quyền/tài khoản DB; `ECONNREFUSED` là kết nối/địa chỉ DB; `INVALID_APP_ORIGIN` cần bỏ dấu `/` cuối và dùng đúng origin HTTPS. Nếu không xuất hiện dòng mới, kiểm tra đúng Application root/startup file và log của tiến trình Node đang được cPanel quản lý.

Sự cố tại `https://luca.giaouoc.com/setup` ngày 17/11/2026: HTTP trực tiếp cho thấy `/` và `/app.js` trả 200, còn `/setup`, `/admin/login`, `/api/v1/public/project` trả 503 HTML LiteSpeed. Ảnh cPanel cho thấy Node 24 và startup `app.cjs`; log được cung cấp chỉ có thông báo chung cũ. Chưa đủ bằng chứng xác định lỗi DB/module/config cụ thể; bản ghi log mới phục vụ bước chẩn đoán tiếp theo, chưa phải xác nhận đã sửa được 503 trên host.

| Hiện tượng | Kiểm tra |
|---|---|
| 503 / Passenger error | Node 24, startup `app.cjs`, đúng application root, NPM install, DB và private error log. Không gửi log có secrets lên repo. |
| Cannot find module / native binding | Chạy lại installer trong environment Linux của cPanel; không dùng `node_modules` từ Windows. |
| Access denied / Unknown database | Tên DB/user đầy đủ có tiền tố, mật khẩu, Add User To Database và DB_HOST của hosting. |
| Invalid origin / đăng nhập lỗi | `APP_ORIGIN` đúng domain đang mở; HTTPS, không thêm `/` cuối; restart sau khi sửa. |
| `/setup` chuyển sang login khi chưa cài | Kiểm tra SETUP_TOKEN là 64 ký tự hex viết thường; environment cPanel có đè cấu hình không; database có Admin/marker từ lần cài trước không. |
| Ảnh lỗi ghi file | MEDIA_DIR là đường dẫn riêng tồn tại, thuộc user chạy Node và có quyền ghi. |
| Upload hoặc login bị 429 | Đợi cửa sổ rate limit; không tự tắt cơ chế bảo vệ. Pilot dùng rate limit theo process/IP, cần kiểm tra khi chạy qua proxy/Passenger. |
| YouTube không phát | Quyền video, cho phép embed, trình duyệt và mạng; website không vượt qua quyền YouTube. |

## 9. Cập nhật lần sau

Backup trước. Upload gói build mới, giữ nguyên `.env`, ảnh riêng và dữ liệu trên host. Cài dependencies nếu manifest thay đổi; dùng environment Node của ứng dụng chạy `npm run db:migrate`, sau đó Restart. Không chạy lại setup hoặc tạo Admin mới; không chép cấu hình kiểm thử từ PC lên host.
