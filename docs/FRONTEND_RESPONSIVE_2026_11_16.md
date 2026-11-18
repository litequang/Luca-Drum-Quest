# Frontend responsive refinement — 2026-11-16

## Đã làm

- Giảm typography **toàn site**: hero/section/page headings, heading trong bài học và finance card, có scale khác nhau theo màn hình.
- Trên smartphone (<= 600px): hero và minh họa bớt cao; khoảng cách các section nhỏ hơn; nội dung chữ dễ đọc hơn; Skill Card đầy đủ một cột; lọc nhóm kỹ năng cuộn ngang thay vì xuống nhiều hàng; vùng chạm >= 42–44px với các điều khiển chính.
- Trên tablet portrait (<= 900px): hero và bài viết một cột, tiêu đề gọn, bố cục stage/diary 2 cột, Finance dạng một cột tránh ô bị ép hẹp.
- Trên iPad landscape / tablet (<= 1100px): 4 mục điều hướng nằm trong dock kính mờ ở dưới, chiều rộng giới hạn 580px; Header vẫn giữ logo; trang học có bố cục linh hoạt.
- Tôn trọng `env(safe-area-inset-top/bottom)` và `viewport-fit=cover`, tránh dock đè nội dung footer.
- Mobile và desktop nav cập nhật `aria-current=page` chính xác; dialog và bàn phím có khoảng cách phù hợp; hỗ trợ prefers-reduced-motion.
- Không sửa backend, không đưa dữ liệu riêng tư của Luca hoặc người ủng hộ lên GitHub. Không tự thay nội dung học/tài chính.
- Điều chỉnh trong **styles.css**, **index.html**, **app.js**. App vẫn là static HTML/CSS/ES modules, không cần build.

## Manual QA — ưu tiên thiết bị thật

Dùng `python -m http.server 5173` trên PC, sau `git pull`, mở `http://localhost:5173`.

| Viewport tham chiếu | Check |
|---|---|
| Android/iPhone 360–430px portrait | H1 không lấn nhau; CTA nằm trong khung; minh họa không gây scroll ngang; dock 4 nút chạm được |
| iPhone landscape 667–932px | Dock không che nội dung; không có scroll ngang; dialog hiển thị/nút đóng chạm được |
| iPad mini 768/1024 | Portrait một cột nội dung, stage/diary 2 cột; Landscape không quá hẹp |
| iPad 820/1180, 834/1194 | Ở bề rộng > 1100 desktop nav có thể trở lại trên iPad lớn; toàn bộ chức năng giữ nguyên |
| iPad Pro 1024/1366 | Heading dễ đọc; ở landscape > 1100 desktop nav thay cho dock; không trùng nav |
| PC 1280–1920 | Không có dock; top nav, bố cục 2 cột và cards không thay đổi bất thường |

### Chức năng test ở 4 trang

1. Hành trình: CTA Giáo trình/Nhật ký/Đồng hành, nav desktop/dock, click logo trở về.
2. Giáo trình: 8 chặng bấm được; thẻ kỹ năng lọc được, dialog đóng bằng nút/ESC/chạm backdrop.
3. Nhật ký: filters chạy, card demo mở thông báo video không có thật.
4. Quỹ âm nhạc: thanh chọn giá 500–700k, tính ví dụ 104 buổi và không ngụy tạo số tiền đã nhận.
5. Đổi chiều dọc/ngang khi đang mở tab học; thử sau reload; thanh dock không đè nội dung ở cuối trang.
6. iOS Safari: trên tab Safari và Add to Home Screen nếu có, kiểm tra Safe Area và bàn phím/VoiceOver. Chrome Android: test bottom nav và reduced motion nếu thiết bị bật.

## Giới hạn xác minh

Code responsive đã được cập nhật và kiểm tra cấu trúc, **chưa có bằng chứng screenshot thực tế** từ iPhone/iPad hoặc hệ thống chạy trên trình duyệt người dùng. Cần người nhà chụp màn hình/kiểm tra thực tế để sửa lệch đặc thù iOS/Safari.

## Giao Codex

Codex backend **không được tự ý thay đổi** thiết kế, CSS, hệ thống navigation hoặc breakpoints. Nếu backend cần chỉnh DOM, trao đổi rõ và giao phần UI về luồng frontend thay vì viết đè.
---

## v0.3 — sửa UX điện thoại theo phản hồi mới (16/11/2026)

**Tình trạng:** đã cập nhật CSS/JS/HTML trên main; cần xác nhận lại trên thiết bị thật.

- Rút gọn 3 lớp media query cũ chồng chéo và phần patch v0.2, thay bằng **một hệ breakpoint chính** 1100 / 920 / 680 / 390px. Không đổi màu thương hiệu hoặc cấu trúc trang.
- Điện thoại: giảm chiều cao hero/minh họa, thu gọn khoảng trắng, tăng cỡ chữ nội dung quan trọng, tránh chữ nhỏ 10–11px trên thẻ chính.
- Phần giáo trình: 8 chặng chuyển thành **dải cuộn ngang** trên điện thoại, giữ vị trí cuộn sau khi chọn; chi tiết chặng được đưa vào vùng nhìn thấy (với reduced motion vẫn hoạt động).
- Nhật ký: trên điện thoại chuyển **card ảnh lớn** sang danh sách ảnh nhỏ bên trái + nội dung bên phải, giúp xem nhiều cập nhật hơn.
- Bottom dock trên phone và iPad: đổi ký tự trang trí thành **SVG icons nhất quán**, active highlight nhẹ, 4 nút dễ chạm; chú ý Safe Area.
- iPad vẫn dùng bố cục riêng; card kỹ năng, bảng ngân sách, filter, dialog giữ đầy đủ.
- Không thêm backend, thanh toán, nhận quỹ thực hay nội dung cá nhân.

### Kiểm tra thực tế (ưu tiên)

1. iPhone/Android 360px, 375px, 390px, 414px; test cả màn hình dài và thiết bị thấp.
2. Safari iPhone: kiểm tra dock và nút bấm với thanh địa chỉ hiện/ẩn, Safe Area trên máy tai thỏ.
3. Giáo trình: vuốt hết 8 chặng, chọn chặng cuối, kiểm tra vẫn thấy đúng chi tiết; thử lọc nhóm kỹ năng và mở/đóng chi tiết kỹ năng.
4. Nhật ký: 3 bài demo đều hiển thị, không bị chữ cắt hoặc tràn ngang.
5. Quỹ Luca: nhập số tiền thiết bị ước tính, kéo học phí 500–700k; xác minh mục tiêu chỉ là ước tính, không hiển thị số tiền nhận giả.
6. Xoay màn hình điện thoại và iPad; không có nội dung bị dock che hay nút chạm quá sát mép.

**Giới hạn:** chưa có ảnh chụp hoặc báo cáo từ thiết bị thật; nếu còn lỗi theo model máy, cần ảnh + kích thước màn hình để sửa chính xác.

## v0.4 — Giáo trình mobile (18/11/2026)

- Đặt min-width:0 cho các grid items và minmax(0,1fr) cho cột đơn; giới hạn stage rail vào chiều rộng vùng nội dung, bỏ margin âm. Giữ vuốt ngang và hiện gợi ý trên phone.
- Bộ lọc kỹ năng tự xuống dòng, nút chạm 44px; Skill Cards một cột, nhãn và nội dung được phép xuống dòng. Khối phương pháp đặt sau giáo trình trên phone.
- Cập nhật trạng thái chọn chặng và lọc trên DOM hiện có thay vì render lại các nút; không auto-scroll viewport khi chọn chặng (thay cho hành vi v0.3).
- Kiểm tra Chromium bằng fixture tái hiện layout, không phải toàn bộ website: 10 widths 320/360/375/390/414/680/768/820/1024/1280px đều không tràn trang, filter và card nằm trong cột, rail cuộn đến chặng cuối trên phone. Chưa kiểm thử toàn site trên Safari hoặc thiết bị thật.


## v0.5 — Thứ tự danh mục Giáo trình (18/11/2026, 20261118-r3)
- Danh mục kỹ năng public sắp xếp theo mã tăng dần, với thứ tự số tự nhiên, trước khi lọc nhóm. Không đổi mã, dữ liệu DB, giáo trình hoặc thứ tự chặng. API MariaDB không đảm bảo thứ tự rows, frontend tự sắp xếp.
- Giới hạn riêng layout Giáo trình trên phone bằng block, wrap bộ lọc và nội dung card; giữ dải chặng cuộn ngang. Cập nhật version cả 4 asset để tránh tải lẫn bản cache.
- Test fixture đảo ngược thứ tự catalogue và assert danh mục toàn bộ/nhóm B. Chưa chạy full test hoặc browser thật sau cập nhật này.


## v0.6 — Scroll chrome đồng bộ (20261118-r4)
- Header và bottom dock dùng chung trạng thái: cuộn xuống ẩn, cuộn lên hiện, đứng yên giữ nguyên trạng thái; không timer auto-show. Đầu trang và chuyển tab hiện lại. Ngưỡng hướng 18/12px, clamp bounce iOS, transform không đổi layout, reduced motion.
- Áp dụng public site; desktop chỉ có header, mobile/iPad có cả dock theo breakpoint hiện có. Giữ nguyên responsive, màu, safe area, API và DB. Keyboard focus khôi phục điều hướng.
- Tham chiếu UX sivn.app theo yêu cầu owner; chưa xác minh trực tiếp animation của trang tham chiếu bằng trình duyệt. Test logic độc lập và thêm DOM regression; chưa kiểm thử thiết bị thật.
