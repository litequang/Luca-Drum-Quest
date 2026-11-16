# 03 — Skill Map, rubric PASS và bằng chứng học tập

**Status:** PROPOSED v0.1. Chưa phải bộ kỹ năng A–Z cuối cùng; phải xin ý kiến giáo viên trước khi triển khai làm chuẩn đánh giá.

## Mục tiêu

Gia đình không phụ thuộc hoàn toàn vào nhận xét “hôm nay học tốt”. Mỗi kỹ năng có đầu vào, cách tập, dấu hiệu tiến bộ, loại lỗi cần giáo viên sửa, bằng chứng phù hợp và tiêu chí chuyển bài. Tuy nhiên không biến mỗi buổi thành một kỳ thi.

## Bốn trạng thái (đề xuất)

1. **LEARNING** — chưa hiểu hoặc cần người lớn hướng dẫn nhiều.
2. **PRACTICING** — đang luyện, làm được một phần hoặc chưa ổn định.
3. **HOME READY** — bố mẹ thấy Luca tự làm được tương đối ổn ở nhà (gợi ý: ít nhất hai ngày khác nhau).
4. **TEACHER PASS** — giáo viên kiểm tra xác nhận kỹ thuật/độ sẵn sàng cho kỹ năng phụ thuộc.

**Quan trọng:**
- “HOME READY” không đồng nghĩa “đúng chuyên môn”; bố mẹ chỉ ghi nhận hiện tượng.
- “TEACHER PASS” không có nghĩa kỹ năng được miễn ôn vĩnh viễn.
- Kỹ năng có thể ôn song song, dạy vòng lại; không yêu cầu PASS 100% mọi kỹ năng rồi mới được chơi nhạc.
- Nếu kẹt hoặc kỹ thuật sai, **vẫn nên gặp thầy để được sửa**. Hoãn buổi chỉ khi phù hợp và được thống nhất.

## Đề xuất cấu trúc một Skill Card

```yaml
id: B-02
title: Cam dui thoai mai
axis: B
status: proposed
prerequisites: [B-01]
learning_goal: ...
teacher_demo_url: null
home_games: []
observables: []
common_errors: []
stop_conditions: [pain, distress, hearing_discomfort]
home_evidence: optional_short_video
home_ready_rule: demonstrated_on_two_separate_days
teacher_assessment: pending
next_skill_ids: []
notes: ...
```

Các URL, video và trường riêng tư **không được dùng dữ liệu thật** trong public GitHub repo.

## Danh mục nhóm kỹ năng v0.1 (để mở rộng thành A–Z)

| ID | Trục | Skill / hành vi quan sát | Điều kiện đầu vào gợi ý |
|---|---|---|---|
| A-01 | Cảm nhịp | Chơi/dừng theo tín hiệu âm nhạc | Không |
| A-02 | Cảm nhịp | Vỗ tay lặp lại 2 tiếng | A-01 |
| A-03 | Cảm nhịp | Lặp mẫu 2–4 tiếng | A-02 |
| A-04 | Cảm nhịp | Theo mạch phách đều 8 tiếng có dẫn | A-02 |
| A-05 | Cảm nhịp | Nhanh/chậm, mạnh/nhẹ, im lặng | A-01 |
| A-06 | Cảm nhịp | Nghe chuyển câu/chỗ dừng | A-04 |
| B-01 | Tư thế | Biết cách ngồi an toàn, tư thế thoải mái | Không |
| B-02 | Tư thế | Cầm và đặt dùi phù hợp tay bé | B-01 |
| B-03 | Tay | Gõ một tay 4 tiếng thoải mái | B-02 |
| B-04 | Tay | Gõ từng tay còn lại | B-02 |
| B-05 | Tay | Luân phiên hai tay đơn giản | B-03, B-04 |
| B-06 | Tay | Điều chỉnh nhẹ/mạnh có kiểm soát | B-03 |
| C-01 | Phối hợp | Di chuyển cơ thể theo nhịp | A-01 |
| C-02 | Phối hợp | Một tay trên hai bề mặt | B-03 |
| C-03 | Phối hợp | Chân đạp kick có kiểm soát | B-01 |
| C-04 | Phối hợp | Tay + chân luân phiên | C-03, B-03 |
| C-05 | Phối hợp | Tay + chân đồng thời theo mẫu đơn giản | C-04 |
| D-01 | Bộ trống | Nhận biết snare, hi-hat, kick | B-01 |
| D-02 | Bộ trống | Kick + snare đơn giản | D-01, C-04 |
| D-03 | Bộ trống | Hi-hat đều theo phách | D-01, A-04 |
| D-04 | Bộ trống | Kết hợp groove tối giản | D-02, D-03 (linh hoạt) |
| D-05 | Bộ trống | Dừng/khởi động lại đúng hiệu lệnh | D-04, A-01 |
| D-06 | Bộ trống | Fill 1–2 tiếng và quay về groove | D-04 |
| E-01 | Ngôn ngữ | Nhận biết nhóm 4 phách qua trò chơi | A-03 |
| E-02 | Ngôn ngữ | Dùng hình ảnh để nhớ mẫu nhịp | A-03 |
| E-03 | Ngôn ngữ | Nhận biết câu/đoạn trong bài quen | A-06 |
| E-04 | Ngôn ngữ | Ký hiệu tiết tấu đơn giản khi sẵn sàng | E-02 |
| F-01 | Sáng tạo | Tự gõ mẫu 2–4 tiếng | A-02 |
| F-02 | Sáng tạo | Hỏi–đáp nhịp với bố mẹ | A-03 |
| F-03 | Sáng tạo | Chơi cùng đoạn nhạc bé thích | A-04 |
| F-04 | Sáng tạo | Thể hiện một đoạn ngắn cho người thân | F-03 |
| F-05 | Sáng tạo | Chơi bài có mở đầu/kết thúc | F-04, D-05 (linh hoạt) |

**Không có thứ tự bắt buộc 32 kỹ năng = 32 buổi.** Mọi tiền đề đều là dự thảo có thể thay sau khi giáo viên đánh giá.

## Mẫu đầy đủ: B-02 — Cầm dùi cơ bản

**Mục tiêu:** Luca cầm dùi hai tay thoải mái, không siết mạnh, đánh nhẹ lên pad với kiểm soát sơ bộ. **Không ép hình dáng ngón tay hoàn hảo kiểu người lớn.**

**Điều kiện:** B-01, giới thiệu an toàn khi cầm dùi.

**Gợi ý hoạt động tại nhà:**
- “Chào bạn dùi”: tự lấy/đặt dùi, bố mẹ quan sát.
- “4 giọt mưa”: gõ 4 tiếng nhẹ bằng một tay, nghỉ, rồi đổi tay nếu thoải mái.
- “Đóng băng”: dừng và thả lỏng khi nghe hiệu lệnh.

**HOME READY (đề xuất):**
- Tự lấy và cầm dùi sau một nhắc ngắn.
- Có thể gõ 4 tiếng có chủ đích.
- Cơ thể và tay trông thoải mái, không đau/căng rõ ràng.
- Thể hiện lại ở hai ngày khác nhau, không liên tục chỉnh bằng tay của bố mẹ.

**Bằng chứng:** video khoảng 20–30 giây *nếu thuận tiện*, hoặc nhận xét ngắn. Giáo viên cần quan sát trực tiếp hay video trước khi TEACHER PASS.

**Lỗi dành cho giáo viên:** siết tay quá mạnh; vai nhô/cứng; ghế, độ cao pad hoặc dùi không vừa; dùng cổ tay quá căng; gõ đau. Khi đau/dấu hiệu căng, dừng và nhờ thầy điều chỉnh.

## Rubric đánh giá mẫu

| Câu hỏi | Cách ghi |
|---|---|
| Luca có muốn tham gia không? | thích / bình thường / không thích |
| Có tự làm được khi nhắc ngắn không? | tự làm / có dẫn / chưa |
| Làm được vào ít nhất hai ngày? | có / chưa / không áp dụng |
| Có dấu hiệu khó chịu, mất tư thế? | có / không / không rõ |
| Có video tùy chọn? | đã quay / không quay |
| Giáo viên đã xem/kiểm tra? | chưa / đạt / cần chỉnh |
| Bước tiếp theo? | lặp lại / điều chỉnh bài / tăng độ khó / nghỉ |

Có thể tham khảo ngưỡng “3/4 lần đúng” cho một số trò chơi nhịp có kết quả rõ, nhưng đó **chỉ là thước đo nội bộ thử nghiệm**, không phải tiêu chuẩn lứa tuổi.

## Kỹ năng âm nhạc gắn bài thờ phượng Nissi United

- **A-04:** gõ theo phách một đoạn đã nghe nhiều lần.
- **A-06 / E-03:** nghe chỗ dừng/chuyển đoạn.
- **F-02:** bố mẹ gõ trước, Luca đáp lại trên nền bản nhạc quen.
- **F-03:** chơi cùng bài hát nhưng đơn giản hóa về một bề mặt hoặc một tiếng mỗi phách.
- **D-04 / F-05:** về sau ghép groove đơn giản khi đã đủ nền, không cố bắt chước bản thu.

**OPEN:** lựa chọn bài hát/đoạn/tốc độ cụ thể, có xác nhận của thầy; danh sách chưa được cung cấp.

## Chất lượng giáo trình

Khi bổ sung thẻ kỹ năng: phải có `id`, `axis`, `goal`, `prerequisites`, `home_games`, `observable evidence`, `teacher review`, `safety considerations`, `status: proposed|approved`. Không chốt bằng AI một mình.
