# Kế hoạch chuẩn hoá logic hiển thị trang chủ UpNext

> Phiên bản: 1.0
> Ngày lập: 2026-07-31
> Phạm vi: Trang chủ public, candidate chưa đăng nhập/đã đăng nhập, API public và phối hợp FE–BE.

## 1. Mục tiêu

Trang chủ phải trả lời đúng ba câu hỏi của người dùng:

1. Có việc nào phù hợp để xem hoặc ứng tuyển ngay không?
2. Có cơ hội nào sắp hết hạn cần chú ý không?
3. Thị trường và các nhà tuyển dụng đang hoạt động hiện ra sao?

Mọi nhãn như “mới”, “sắp hết hạn”, “phù hợp”, “được quan tâm” hoặc “đang tuyển nhiều” phải có tiêu chí dữ liệu rõ ràng. Không sử dụng mock data, số liệu suy diễn hoặc gán nhãn theo vị trí trong mảng.

## 2. Hiện trạng và vấn đề đã xác nhận

Snapshot staging hiện có khoảng 204 job và 100 công ty.

### 2.1. Tuyển gấp

- Đang lọc job còn hạn trong 30 ngày, nhưng dữ liệu thực tế không có job dưới 7 ngày.
- Nhiều job được gắn chấm đỏ nhấp nháy giống nhau dù không có tín hiệu khẩn cấp.
- Mapper có các field giả như applicants, views, competition, progress và deadlineTone.
- 90 item cho một carousel trang chủ là quá nhiều.

### 2.2. Việc làm nổi bật / Cơ hội đang được quan tâm

- Đang lấy toàn bộ job, không sort hoặc filter theo tiêu chí nổi bật.
- Badge được gán theo `index % 5` nên có thể sai thực tế.
- `verified` bị hardcode cho mọi công ty.
- Job bị lặp lại với section Tuyển gấp.
- `viewCount` hiện chưa có trong dữ liệu staging, nên chưa thể gọi là “được quan tâm”.

### 2.3. Công ty tiêu biểu

- Công ty được chọn theo phần tử đầu mỗi chunk, không theo số việc hoặc tiêu chí biên tập.
- `activeJobsCount` hiện chỉ có ba mức chính nên cần tie-break ổn định.
- Cover company đôi khi phải gọi detail riêng, tạo waterfall khi chuyển slide.

### 2.4. Trust strip

- Số ứng viên đang được tạo bằng công thức tự nghĩ, không phải dữ liệu thật.
- Danh sách công ty marquee đang hardcode.

### 2.5. Giới hạn contract hiện tại

`PublicJob` chưa có `status`, `isHidden` và `moderationStatus`. FE chưa thể tự xác minh điều kiện public hợp lệ. Cho đến khi BE bổ sung field, API phải cam kết chỉ trả job `PUBLISHED + APPROVED + visible`.

## 3. Thứ tự section mục tiêu

```text
Hero / Tìm kiếm
→ Số liệu thật + nhà tuyển dụng đang hoạt động
→ Khối hành động cá nhân (chỉ khi cần)
→ Gợi ý phù hợp hoặc Việc làm mới nhất
→ Sắp hết hạn ứng tuyển (chỉ khi có dữ liệu)
→ Nhà tuyển dụng đang tuyển nhiều
→ Toàn cảnh thị trường việc làm IT
→ Cẩm nang nghề nghiệp
```

Urgency không được đặt làm nội dung chính mặc định vì dữ liệu staging chưa chứng minh có job thật sự khẩn cấp. Section sắp hết hạn vẫn quan trọng nhưng là lớp ưu tiên phụ.

## 4. Logic hiển thị theo trạng thái người dùng

### 4.1. Khách chưa đăng nhập

Hiển thị:

- Hero với tìm kiếm từ khóa và địa điểm.
- Trust strip dùng số liệu thật.
- “Việc làm mới nhất”.
- “Sắp hết hạn ứng tuyển” nếu có job còn tối đa 14 ngày.
- “Nhà tuyển dụng đang tuyển nhiều”.
- Job Market và Cẩm nang nghề nghiệp.

Không gọi section là “Dành cho bạn”. Sau section job có CTA nhẹ:

> Đăng nhập và cập nhật sở thích để nhận gợi ý phù hợp hơn.

### 4.2. Candidate đã đăng nhập nhưng chưa đủ tín hiệu

Candidate được xem là chưa đủ tín hiệu khi chưa có ít nhất hai nhóm dữ liệu độc lập trong các nhóm sau:

- Kỹ năng.
- Vị trí mong muốn.
- Mô hình làm việc.
- Cấp bậc.
- Khoảng lương.
- Lịch sử lưu job hoặc theo dõi công ty đủ lớn để suy ra sở thích.

Hiển thị:

- “Việc làm mới nhất” thay vì “Gợi ý cho bạn”.
- Khối nhỏ “Hoàn thiện sở thích việc làm” nếu profile thiếu dữ liệu.
- CTA tới profile/preferences hoặc CV builder.

Không dùng ngôn ngữ chắc chắn như “job phù hợp với bạn” khi hệ thống chưa có đủ tín hiệu.

### 4.3. Candidate có đủ tín hiệu

Hiển thị section chính:

> Gợi ý phù hợp với bạn

Chỉ dùng tên này khi có tối thiểu 6 job đạt ngưỡng phù hợp. Nếu không đủ, fallback toàn section thành “Việc làm mới nhất”. Không trộn job không đủ điểm vào danh sách rồi vẫn gọi là recommendation.

Mỗi gợi ý nên có lý do kiểm chứng được:

- Khớp React và TypeScript.
- Phù hợp mô hình Hybrid.
- Đúng cấp bậc Middle.
- Mức lương nằm trong khoảng mong muốn.

Không hiển thị phần trăm phù hợp nếu chưa có mô hình recommendation được hiệu chỉnh.

### 4.4. Candidate không tìm việc

Nếu `jobSearchStatus=NOT_LOOKING`:

- Không dùng CTA thúc ép như “Ứng tuyển ngay”.
- Vẫn cho phép xem job và thị trường.
- Ưu tiên bài viết, market insight và cập nhật công ty đang theo dõi.
- Có thể hiển thị CTA cập nhật trạng thái tìm việc khi người dùng chủ động muốn nhận gợi ý.

## 5. Logic từng section

### 5.1. Trust strip

Ba số liệu đề xuất:

1. Việc làm đang mở.
2. Nhà tuyển dụng đang có việc làm.
3. Việc làm mới trong 7 ngày.

Bỏ số “ứng viên đã tin tưởng” cho đến khi BE cung cấp số thật.

Marquee đổi nhãn thành:

- Tiếng Việt: `Nhà tuyển dụng đang hoạt động trên UpNext`.
- English: `Employers hiring on UpNext`.

Danh sách lấy từ các công ty có `activeJobsCount > 0`, sort theo số job đang tuyển, không hardcode.

### 5.2. Việc làm mới nhất

Điều kiện:

- Job public hợp lệ.
- Chưa hết hạn.
- Chưa ứng tuyển bởi candidate hiện tại.

Sort và giới hạn:

- `publishedAt DESC`.
- Tối đa 12 item desktop; responsive vẫn dùng cùng tập item, chỉ thay đổi số cột.

Badge hợp lệ:

- `Mới đăng`: `publishedAt <= 7 ngày`.
- `Làm việc từ xa`: có location `workingModel=REMOTE`.
- Không đạt điều kiện thì không hiển thị badge.
- Không dùng `Remote`, `Nổi bật`, `Tuyển gấp` theo index.
- Tránh badge “Lương tốt” vì mang tính chủ quan; mức lương đã có trên card.

### 5.3. Sắp hết hạn ứng tuyển

Điều kiện:

- Job public hợp lệ.
- `expiredAt > now`.
- `expiredAt <= now + 14 ngày`.
- Chưa ứng tuyển.

Sort và giới hạn:

- `expiredAt ASC`.
- Tối đa 8 item.
- Không có item thì ẩn toàn bộ section, không để khoảng trắng.
- Loại các ID đã được dùng ở section job chính.

Deadline tone:

- `<= 3 ngày`: đỏ.
- `4–7 ngày`: hổ phách.
- `8–14 ngày`: trung tính.
- Chỉ dùng animation/pulse cho mức thực sự khẩn cấp; tôn trọng `prefers-reduced-motion`.

Không hiển thị applicants, views, competition hoặc progress nếu API chưa cung cấp dữ liệu thật.

### 5.4. Gợi ý phù hợp với bạn

Giai đoạn FE đầu dùng selector có thể giải thích được:

| Tín hiệu                                 | Trọng số đề xuất |
| ---------------------------------------- | ---------------: |
| Kỹ năng khớp                             |               40 |
| Desired position/category/specialization |               25 |
| Working model                            |               10 |
| Cấp bậc                                  |               10 |
| Khoảng lương giao nhau, cùng currency    |               10 |
| Công ty đang theo dõi                    |                5 |

Quy tắc:

- Job đã ứng tuyển bị loại.
- Job đã lưu vẫn được hiển thị với trạng thái đã lưu.
- Công ty đang theo dõi chỉ được boost nhẹ.
- Không dùng `profile.address` làm địa điểm mong muốn.
- Cần thêm `preferredLocationIds` vào job preference để cá nhân hoá địa điểm đúng nghĩa.

### 5.5. Khối hành động cá nhân

Chỉ render khi có dữ liệu, tối đa ba hành động:

1. Ứng tuyển đã được xem, shortlist hoặc chuyển sang phỏng vấn.
2. Job đã lưu còn tối đa 7 ngày.
3. Job mới trong 7 ngày từ công ty đang theo dõi.
4. Chưa có CV.
5. Thiếu kỹ năng hoặc job preference.

Ưu tiên theo thứ tự trên. Nếu không có hành động, không render panel.

### 5.6. Nhà tuyển dụng đang tuyển nhiều

Tên section dùng được:

> Nhà tuyển dụng đang tuyển nhiều

Sort:

1. `activeJobsCount DESC`.
2. Job mới nhất của công ty `DESC`.
3. Tên công ty `ASC`.

Điều kiện:

- Card thường cần logo, tên và ít nhất một job đang mở.
- Hero panel ưu tiên company có logo, cover và description.
- Hero company không lặp lại trong card.
- Tối đa 8 company.
- API list phải trả cover cần thiết; không gọi detail waterfall cho từng item.

Verification badge chỉ hiển thị nếu `verificationStatus` thực sự phân biệt được công ty. Nếu 100% đều `VERIFIED`, badge không tạo giá trị xếp hạng và nên được giảm vai trò trong dense card.

### 5.7. Cơ hội đang được quan tâm

Tạm thời không sử dụng section này.

Để sử dụng trung thực trong tương lai, BE cần trả engagement theo cửa sổ thời gian:

```ts
engagement: {
  views7d: number;
  saves7d: number;
  applications7d: number;
}
```

Không dùng tổng view lifetime để gọi là “đang được quan tâm” vì job cũ luôn có lợi thế. Nếu là job trả phí, dùng badge `Tài trợ`; nếu là lựa chọn biên tập, dùng `Được chọn bởi UpNext`.

### 5.8. Toàn cảnh thị trường việc làm IT

Section này luôn là dữ liệu thị trường chung, không cá nhân hoá.

- Tổng số job public đang mở.
- Job mới trong 24 giờ hoặc 7 ngày.
- Công ty đang tuyển.
- Xu hướng job theo tuần.
- Phân bố lương theo dữ liệu có lương công khai.

Giai đoạn đầu có thể dùng selector FE; sau đó chuyển sang aggregate snapshot API để tránh tải toàn bộ job.

### 5.9. Cẩm nang nghề nghiệp

Giữ nội dung chung cho đến khi post có taxonomy/tag đủ tin cậy. Không gọi là “bài viết dành cho bạn” chỉ vì trùng một keyword.

## 6. Quy tắc chống trùng lặp

Logic phải nằm trong một module trung tâm, không để mỗi section tự lọc riêng.

```text
1. Loại job không hợp lệ, hết hạn và đã ứng tuyển.
2. Chọn nhóm sắp hết hạn để giữ trước tối đa 8 ID.
3. Chọn recommendation hoặc latest, loại ID đã giữ.
4. Các action panel chỉ tham chiếu item, không render lại card đầy đủ.
5. Công ty hero không lặp trong danh sách card.
```

Đề xuất module:

```text
src/features/public/home/
├── home-job-selectors.ts
├── home-company-selectors.ts
├── home-personalization.ts
├── home-section-model.ts
└── *.test.ts
```

API của selector trung tâm:

```ts
selectHomeSections({
  jobs,
  companies,
  candidateContext,
  now,
});
```

`candidateContext` gồm session state, profile signals, saved job IDs, followed company IDs và applied job IDs.

## 7. Kế hoạch phối hợp FE và BE

### Giai đoạn 1 — FE: dữ liệu trung thực và logic nền

Deliverables:

- Bỏ mock fallback trong production.
- Đổi “Tuyển gấp” thành “Sắp hết hạn ứng tuyển”.
- Đổi “Cơ hội đang được quan tâm” thành “Việc làm mới nhất”.
- Sửa sort/filter/cap/deadline tone.
- Xóa dead fields và badge giả.
- Sửa verification đọc từ API.
- Sửa company ranking và loại duplicate hero/card.
- Sửa trust strip, bỏ số ứng viên giả.
- Tạo selector trung tâm và unit test.
- Có skeleton, empty state, error state và retry rõ ràng.

### Giai đoạn 2 — FE: cá nhân hoá bằng dữ liệu hiện có

Deliverables:

- Phân biệt guest, session resolving, candidate thiếu profile và candidate đủ tín hiệu.
- Tải session/profile/CV/saved/follows/applications song song.
- Thêm action panel cá nhân có điều kiện.
- Thêm recommendation có lý do giải thích được.
- Loại job đã ứng tuyển khỏi recommendation.
- Fallback về latest khi chưa đủ dữ liệu.
- Giữ layout skeleton ổn định, không flash guest rồi đổi sang candidate.
- Test `NOT_LOOKING` và profile chưa hoàn thiện.

### Giai đoạn 3 — BE: làm song song với Giai đoạn 1 và 2

Yêu cầu bắt buộc:

1. `/job-posts` hỗ trợ `page`, `limit`, `sort`, `q`, `expiredBefore`, `expiredAfter`, `workingModel` và salary filters.
2. Trả `{items, meta}`.
3. Contract chỉ trả job public hợp lệ hoặc trả trạng thái để FE kiểm tra.
4. `/companies` hỗ trợ sort theo `activeJobsCount`.
5. `/companies` trả cover trong list response.
6. Thêm `preferredLocationIds`.
7. Cân nhắc aggregate endpoint `/public/home`.
8. Thêm engagement theo 7 ngày.
9. Thêm editorial/sponsored flags.
10. Về lâu dài, tạo recommendation endpoint trả `reason codes`.

### Giai đoạn 4 — kiểm thử và kiểm chứng

Giai đoạn này không đợi đến cuối mới bắt đầu. Unit test viết từ Giai đoạn 1; contract test bắt đầu khi BE có API mới.

Checklist cuối:

- Guest.
- Candidate thiếu profile.
- Candidate đủ profile.
- Candidate `NOT_LOOKING`.
- Session đang resolve.
- API loading.
- API error và retry.
- API trả empty.
- Job hết hạn trong lúc đang mở trang.
- Job đã lưu/đã ứng tuyển.
- Company hero/card duplicate.
- Desktop, tablet và mobile.
- Keyboard navigation.
- Focus state.
- Reduced motion.
- Screen reader label và live region cho trạng thái tải/lỗi.
- Không layout shift khi API trả dữ liệu.
- Không request detail waterfall theo từng company.

## 8. Acceptance criteria

### Dữ liệu

- Không còn số ứng viên hoặc views hardcode.
- Không còn badge theo index.
- Không có section job trùng ID.
- Không có company hero xuất hiện lại trong card.
- Không render mock data khi API lỗi hoặc đang loading.

### Logic

- Job mới nhất sort đúng `publishedAt DESC`.
- Job sắp hết hạn sort đúng `expiredAt ASC`, tối đa 14 ngày.
- Section sắp hết hạn tự ẩn khi không có item.
- Job đã ứng tuyển không xuất hiện trong recommendation.
- Gợi ý candidate luôn có lý do giải thích.
- Guest không bị gọi là “dành cho bạn”.

### UX/UI

- Skeleton giữ đúng kích thước gần bằng content thật.
- Empty section không để khoảng trắng thừa.
- Deadline màu đúng theo số ngày thực tế.
- Không animation gây nhiễu hoặc không thể dừng.
- Card hoạt động tốt trên mobile.

### Hiệu năng

- Không tải toàn bộ job cho từng section khi API đã hỗ trợ query.
- Không có request detail tuần tự cho company card.
- Query key dùng nhất quán và cache được tái sử dụng.
- Các request độc lập chạy song song.

## 9. Thứ tự công việc thực tế

```text
FE Giai đoạn 1 ───────────────┐
                              ├─→ FE tích hợp BE Giai đoạn 3
FE Giai đoạn 2 ───────────────┘                  │
                                                 └─→ Regression + staging QA
BE Giai đoạn 3 ────────────────────────────────┘

Unit/Accessibility/Responsive test: thực hiện xuyên suốt.
```

Kết luận vận hành:

- FE bắt đầu Giai đoạn 1 ngay.
- FE tiếp tục Giai đoạn 2 bằng dữ liệu hiện có.
- BE triển khai Giai đoạn 3 song song, không cần chờ FE xong toàn bộ.
- Khi BE hoàn tất, FE tích hợp API mới.
- Giai đoạn 4 được thực hiện xuyên suốt và chốt bằng kiểm thử staging.
