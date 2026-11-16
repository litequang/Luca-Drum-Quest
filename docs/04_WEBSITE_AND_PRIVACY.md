# 04 — Website idea, phân quyền và quyền riêng tư

**Status: PROPOSED v0.1**, chưa phải UI/technical spec đã duyệt. **CONFIRMED:** website để cập nhật hành trình, video, tiến độ và gọi hỗ trợ tài chính chủ yếu trong gia đình.

## Giọng điệu và định vị

**Luca Drum Quest — hành trình nhiều Vòng (Season)**: giọng vui, ấm áp, nhưng dùng đúng khái niệm **gây quỹ hỗ trợ tự nguyện** thay vì gọi vốn/đầu tư. **Vòng 1 = 24 tháng và huy động đủ học phí + mua trống/phụ kiện trong cùng một chiến dịch**, không chia thành các vòng nhỏ để xin lặp lại. **Vòng 2+** có thể được khởi động sau, chưa có ngân sách hoặc lịch cụ thể. Không biến con thành nghĩa vụ tạo thành tích hay làm người thân cảm thấy bắt buộc đóng góp.

**Người xem:** ông bà, cô chú, bạn bè thân được mời. **Quản trị:** bố mẹ. **Người đồng hành chuyên môn:** giáo viên (quyền tùy chọn, chưa chốt).

## Cấu trúc đề xuất

### A. Family View / Nhật ký gia đình

- **Hero**: giới thiệu Luca Drum Quest, dự án có nhiều vòng; **Vòng 1 = 24 tháng**, mục tiêu chơi trống thờ phượng Chúa bài bản, gây quỹ đủ cho vòng đầu tiên.
- **Progress Timeline**: các chặng 3 tháng, milestone, ảnh/clip *có quyền chia sẻ*, huy hiệu minh họa.
- **Video Diary**: video tập ngắn theo ngày/chặng/kỹ năng. Tùy chọn đặt video “chỉ bố mẹ”, “gia đình được mời”, hoặc “có thể chia sẻ bằng link”.
- **Support the Quest**: giải thích kinh phí học trống + dụng cụ; hỗ trợ tùy tâm; có thể ủng hộ tiền hoặc tặng thiết bị.
- **Budget Transparency**: đã nhận (tổng hợp), đã chi, dự toán, mốc sắp tới, không phơi bày danh tính và chi tiết chuyển tiền.
- **Messages / Khen thưởng**: lời động viên người thân sau khi đăng nhập; cần kiểm duyệt.

### B. Parent Dashboard / Quản lý chương trình

- **Skill Map**: các trục A–F, từng Skill Card, trạng thái LEARNING/PRACTICING/HOME READY/TEACHER PASS.
- **Weekly Plan**: mục tiêu tuần và gợi ý hoạt động tại nhà (5–10 phút khởi điểm thử, không ép).
- **Practice Log**: ghi ngày, trò chơi đã làm, cảm xúc/hứng thú, ghi chú; video là tùy chọn.
- **Teacher Notes**: kỹ thuật mới, điều cần sửa, bài về nhà, đánh giá ngắn sau lớp.
- **Video Evidence**: liên kết clip với kỹ năng đã tập, mốc thời gian và quyền riêng tư.
- **Finance**: dự toán học phí, dụng cụ, khoản chi thực tế và cập nhật công khai phù hợp.
- **Privacy Control**: quản lý người được mời, quyền xem, xóa dữ liệu/video.

### C. Teacher Workspace (FUTURE/OPEN)

Có thể chỉ dùng form nhận xét 1 phút hoặc link phản hồi an toàn; **không mặc định thầy sẽ đồng ý dùng ứng dụng hoặc tạo tài khoản**. Ưu tiên giải pháp nhanh mà thầy thấy thuận tiện.

## Nội dung có cấu trúc (conceptual data model)

```text
Project (multi-round / multi-season)
  ├─ Rounds (Season 1: 24 months; Season 2+ not yet planned)
  │    ├─ FundingGoals / BudgetEntries (per round)
  │    └─ Stages (Season 1: 8 stages, proposed)
  │    ├─ Milestones
  │    └─ Updates
  ├─ Skills (axis, prerequisites, rubric)
  │    ├─ PracticeSessions
  │    ├─ EvidenceVideos (access control)
  │    └─ TeacherAssessments
  ├─ Lessons (optional)
  ├─ FamilySupport (permissioned)
  └─ MusicReferences (song title, lawful link, teaching notes)
```

**Đây là model logic, không phải schema SQL hay quyết định stack.**

## Quyền riêng tư & bảo mật — bắt buộc trước triển khai

1. Repo GitHub đang **PUBLIC**: không commit dữ liệu thật, kể cả video Luca, danh tính người hỗ trợ, địa chỉ, ngày sinh chính xác, trường/lịch cố định, số tài khoản và secrets.
2. Video trẻ em **private by default**. Trước khi publish phải xác định xác thực, phân quyền, link được mời/hết hạn, chống liệt kê public, khả năng xóa.
3. Không dùng “unlisted URL” làm bảo mật duy nhất nếu đó là hình ảnh/video cá nhân có độ nhạy cảm cao.
4. Có thể trích xuất và xóa ảnh/video/nhật ký; phân quyền thay đổi theo tuổi và sự đồng thuận của gia đình.
5. Không dùng tên họ đầy đủ, vị trí thời gian thực, lịch học cố định, số điện thoại trong trang công khai.
6. Hạn chế lưu metadata vị trí trong file (EXIF) và giới hạn quyền lưu/tải video nếu cần.
7. Có thể công khai **số tổng thu/chi** nếu gia đình đồng ý, nhưng chi tiết giao dịch và tên người đóng góp mặc định ẩn.
8. Tên/link bài hát Nissi United dùng làm tham chiếu học tập; không tải lại audio, lyrics, artwork, MV có bản quyền. Video của Luca đánh theo bản nhạc có nhạc nền cũng cần rà soát quyền trước khi công khai.

## Phạm vi MVP đề xuất

Chỉ khi gia đình yêu cầu triển khai:
1. Landing page + giới thiệu Vòng 1.
2. Timeline/chặng + các bài cập nhật, video riêng tư.
3. Phụ huynh quản trị Skill Cards và nhật ký.
4. Trang ngân sách tổng hợp + mục tiêu hỗ trợ (có thể ghi nhận offline trước, không cần payment integration).
5. Quyền xem nội dung nhạy cảm.

Các tính năng sau nên để sau: AI tự nhận xét kỹ thuật bằng video, gamification phức tạp, bình luận công khai, leaderboard, thanh toán tự động, social features.

## Questions to resolve

- Website mở công khai phần giới thiệu hay chỉ qua link mời?
- Có bao nhiêu người thân cần xem? Cần đăng nhập hay mật khẩu/link mời?
- Video lưu ở đâu và ai được tải, có giới hạn lưu trữ/chi phí?
- Thầy sẽ cung cấp phản hồi trực tiếp trên web hay phụ huynh nhập lại?
- Thiết kế/brand, domain, hosting, stack, mobile-first/PWA có cần không?
- Hình thức đóng góp: cập nhật thủ công, chuyển khoản, hay tích hợp thanh toán?

Đừng tự trả lời các câu hỏi này bằng code khi chủ dự án chưa chốt.
