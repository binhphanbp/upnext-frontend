# Thiết kế trình soạn thảo bài viết chuẩn SEO cho Admin

## 1. Mục tiêu

Làm lại hoàn toàn trải nghiệm tạo và chỉnh sửa bài viết trong Admin UpNext theo hướng rõ ràng, an toàn khi soạn nội dung dài và hỗ trợ SEO thực chất. Phạm vi gồm giao diện Admin, API và dữ liệu bài viết, cùng cách trang bài viết public xuất metadata; không chỉ thay giao diện của form hiện có.

Kết quả cần đạt:

- Admin có thể tạo nháp, tự động lưu, xem trước, xuất bản và lưu trữ bài viết.
- Form cung cấp hướng dẫn SEO có thể giải thích được thay vì một điểm số không rõ nguồn gốc.
- Metadata, canonical, Open Graph, Twitter card và structured data của trang public lấy đúng từ từng bài viết.
- Dữ liệu cũ tiếp tục đọc được; các trường mới có giá trị mặc định hoặc fallback rõ ràng.
- Trải nghiệm bám theo style Admin hiện tại: nền workspace xám nhạt, card trắng, bo góc lớn, emerald làm màu hành động chính, Slate cho chữ và Phosphor Icons.

## 2. Phạm vi và các quyết định đã chốt

### Trong phạm vi

- Làm lại route tạo bài và route chỉnh sửa bài bằng cùng một editor shell.
- Tách form hiện tại thành các đơn vị nhỏ, có trách nhiệm rõ ràng.
- Nâng cấp trình soạn thảo Tiptap phục vụ nội dung bài viết.
- Autosave, phục hồi bản nháp cục bộ và cảnh báo thay đổi chưa đồng bộ.
- Preview toàn bài và preview kết quả tìm kiếm/social.
- Bổ sung dữ liệu SEO, slug history, thời điểm xuất bản và validation nghiệp vụ ở backend.
- Sửa metadata động, JSON-LD và redirect slug cũ ở trang public.
- Unit, integration/component và Playwright coverage cho luồng chính.
- Đồng bộ chuỗi giao diện mới trong `messages/vi.json` và `messages/en.json`; nội dung bài viết vẫn chỉ có một phiên bản ngôn ngữ.

### Ngoài phạm vi

- Lên lịch xuất bản.
- Quy trình nhiều cấp duyệt bài.
- Phiên bản nội dung tiếng Việt/tiếng Anh cho cùng một bài.
- AI viết bài hoặc AI tạo metadata.
- Realtime collaborative editing và lịch sử phiên bản nội dung.
- Thay CMS hoặc đưa thêm một CMS ngoài vào hệ thống.
- Làm lại trang danh sách bài viết, ngoại trừ các điều chỉnh tối thiểu để route/action tương thích với workflow mới.

## 3. Workflow và trạng thái

Post giữ ba trạng thái hiện có:

- `DRAFT`: chưa xuất hiện trên public; được phép thiếu các trường bắt buộc khi xuất bản.
- `PUBLISHED`: hiển thị trên public và có metadata đầy đủ.
- `ARCHIVED`: giữ dữ liệu trong Admin nhưng không xuất hiện trên public.

Không có trạng thái chờ duyệt hoặc lên lịch. Chuyển trạng thái được quy định như sau:

- Bài mới được tạo dưới dạng `DRAFT`.
- `DRAFT` và `ARCHIVED` có thể xuất bản nếu vượt qua publish validation.
- `PUBLISHED` có thể chuyển sang `ARCHIVED`.
- Không dùng thao tác “đưa về nháp” cho bài đã public; lưu trữ thể hiện chính xác ý định gỡ bài khỏi public mà vẫn giữ lịch sử.
- `publishedAt` được gán ở lần xuất bản đầu tiên và không bị đổi khi chỉnh sửa hoặc xuất bản lại bài đã lưu trữ.
- `updatedAt` tiếp tục phản ánh lần cập nhật gần nhất.

## 4. Cấu trúc giao diện

### 4.1. Khung trang

Desktop dùng bố cục hai cột trong chiều rộng tối đa của Admin workspace:

- Cột chính rộng khoảng hai phần ba: tiêu đề, mô tả ngắn và editor nội dung.
- Sidebar rộng khoảng một phần ba: trạng thái xuất bản, phân loại, hình ảnh và SEO.
- Header sticky nằm dưới workspace header, chứa quay lại, trạng thái đồng bộ, xem trước, lưu nháp và xuất bản.
- Sidebar sticky độc lập khi đủ chiều cao viewport, nhưng không làm mất khả năng cuộn toàn trang.

Tablet/mobile chuyển thành một cột. Các section sidebar nằm sau nội dung chính; nhóm hành động quan trọng trở thành thanh sticky phía dưới. Không dùng modal toàn màn hình cho toàn bộ form.

### 4.2. Phong cách trực quan

- Giữ nền `#f4f6fa` hiện có của Admin và card trắng viền Slate nhẹ.
- Dùng emerald/primary cho CTA, trạng thái focus và mục SEO đạt yêu cầu.
- Dùng amber cho cảnh báo chất lượng và red/rose cho lỗi chặn xuất bản.
- Card bo góc `rounded-xl`/`rounded-2xl`, khoảng cách thoáng, heading rõ cấp bậc.
- Dùng Phosphor Icons; không thêm Lucide.
- Animation chỉ dùng cho trạng thái lưu, mở section và feedback ngắn; tôn trọng `prefers-reduced-motion`.

### 4.3. Các section

1. **Nội dung chính**
   - Tiêu đề.
   - Mô tả ngắn (`excerpt`) dùng ở card/list và làm fallback cho meta description.
   - Trình soạn thảo nội dung.
   - Word count và reading time tham khảo, không lưu thành dữ liệu nguồn.

2. **Xuất bản**
   - Badge trạng thái hiện tại.
   - Chỉ báo autosave.
   - Nút xem trước.
   - Nút lưu nháp/lưu thay đổi.
   - CTA xuất bản hoặc lưu trữ theo trạng thái.

3. **Phân loại**
   - Loại bài: Blog, Tin tức hoặc FAQ.
   - Một danh mục bắt buộc khi xuất bản.
   - Nhiều tags, có tìm kiếm và lựa chọn bằng keyboard.

4. **Hình ảnh**
   - Thumbnail và cover image.
   - Kéo thả hoặc chọn file, xem trước, thay thế và xóa.
   - Alt text riêng cho từng ảnh.
   - Hiển thị tỷ lệ ảnh khuyến nghị, định dạng và dung lượng tối đa trước khi upload.

5. **SEO theo trải nghiệm WordPress/Yoast**
   - Một meta box lớn dưới editor và bản tóm tắt điểm ở sidebar, đồng bộ cùng dữ liệu.
   - Bốn tab `SEO`, `Khả năng đọc`, `Mạng xã hội`, `Nâng cao` để người viết xử lý lần lượt, không dồn mọi field vào một card dài.
   - Focus keyphrase, permalink/slug, SEO title và meta description.
   - Google preview chuyển được giữa desktop/mobile và cho sửa snippet ngay tại khu vực preview.
   - Phân tích realtime theo hệ đèn `Tốt` (xanh), `Cần cải thiện` (cam) và `Vấn đề` (đỏ); chưa nhập keyphrase dùng màu xám.
   - Từng nhận xét giải thích nguyên nhân và hành động cụ thể; bấm nhận xét sẽ focus field hoặc cuộn tới vùng nội dung liên quan khi có thể.
   - Tab khả năng đọc dùng các kiểm tra phù hợp tiếng Việt, không áp dụng máy móc công thức chỉ có ý nghĩa cho tiếng Anh.
   - Social title, social description và social image với preview Facebook/LinkedIn/X; field trống fallback về SEO data.
   - Canonical URL, `index` và `follow` nằm trong tab nâng cao, mặc định canonical tự tham chiếu và hai robots flag đều bật.

## 5. Trình soạn thảo nội dung

Tiếp tục dùng Tiptap để tránh đưa thêm editor framework. `RichTextEditor` dùng chung hiện tại không được mở rộng thành component chuyên bài viết quá lớn; tạo một article editor chuyên biệt và tái sử dụng các primitive toolbar phù hợp.

Editor hỗ trợ:

- Paragraph, H2, H3 và H4; không cho H1 vì tiêu đề bài là H1 duy nhất trên trang public.
- Bold, italic, underline, strike, inline code và code block.
- Bullet list, ordered list, blockquote và horizontal rule.
- Link với URL validation, tùy chọn mở tab mới và đánh dấu `nofollow`.
- Ảnh trong nội dung, upload qua file service, bắt buộc alt text trước khi chèn.
- Undo/redo, xóa định dạng và chế độ toàn màn hình.
- Keyboard shortcuts và tooltip cho toolbar.

HTML đầu ra phải được sanitize ở backend bằng allowlist tương ứng với các node/mark trên. Không cho `script`, event handler, iframe, inline style tùy ý hoặc URL dùng protocol nguy hiểm. Frontend render nội dung chỉ sau khi backend đã trả HTML được sanitize.

## 6. Dữ liệu và API

### 6.1. Mở rộng `Post`

Giữ các field hiện có và bổ sung:

- `excerpt: String? @db.VarChar(500)`.
- `focusKeyword: String? @db.VarChar(120)`.
- `canonicalUrl: String? @db.VarChar(500)`.
- `isIndexable: Boolean @default(true)`.
- `isFollowable: Boolean @default(true)`.
- `thumbnailAlt: String? @db.VarChar(255)`.
- `coverImageAlt: String? @db.VarChar(255)`.
- `socialImageFileId: String? @db.Uuid` cùng relation `FileAsset`.
- `socialImageAlt: String? @db.VarChar(255)`.
- `socialTitle: String? @db.VarChar(255)`.
- `socialDescription: String? @db.VarChar(500)`.
- `publishedAt: DateTime?`.

`metaKeywords` được giữ để tương thích dữ liệu/API cũ nhưng không còn xuất hiện như trường SEO chính trong giao diện mới và không tham gia SEO checklist. Google không sử dụng meta keywords làm tín hiệu xếp hạng; focus keyword chỉ là dữ liệu hỗ trợ kiểm tra nội dung nội bộ.

### 6.2. Slug history

Thêm model `PostSlugHistory` gồm `id`, `postId`, `slug`, `createdAt`, unique trên `slug` và index trên `postId`. Khi slug của bài đã từng xuất bản thay đổi:

1. Slug cũ được ghi vào history trong cùng transaction cập nhật bài.
2. Slug mới phải không trùng cả `Post.slug` lẫn `PostSlugHistory.slug`.
3. Request public vào slug cũ nhận redirect vĩnh viễn tới canonical slug hiện tại.

### 6.3. Hợp đồng API Admin

- `POST /admin/posts`: tạo draft; chấp nhận dữ liệu chưa đủ điều kiện xuất bản, sanitize HTML nếu có.
- `PATCH /admin/posts/:id`: lưu thay đổi/autosave; dùng optimistic concurrency qua `updatedAt` gửi từ client. Nếu bản server mới hơn, trả `409 Conflict` cùng snapshot tối thiểu để UI yêu cầu reload thay vì ghi đè im lặng.
- `POST /admin/posts/:id/publish`: chạy publish validation và chuyển sang `PUBLISHED`.
- `POST /admin/posts/:id/archive`: chuyển `PUBLISHED` sang `ARCHIVED`.
- `GET /admin/posts/slug-availability?slug=...&excludePostId=...`: kiểm tra slug với debounce, nhưng endpoint publish vẫn là nguồn xác thực cuối cùng.
- `GET /admin/posts/:id/preview`: trả dữ liệu preview đã normalize; route Admin preview vẫn yêu cầu admin session.

Client không được phép gửi hoặc sửa `viewCount`, `adminId`, `publishedAt`, `createdAt` hay `updatedAt`. Create/update DTO bỏ `viewCount`; response vẫn trả số lượt xem.

### 6.4. API public

- `GET /posts/by-slug/:slug` chỉ trả bài `PUBLISHED`.
- Nếu slug thuộc history, backend trả canonical slug hoặc redirect response có thể được Next route chuyển thành `permanentRedirect`.
- Dữ liệu trả về bao gồm author, category, tags, ảnh, alt text, `publishedAt` và `updatedAt` để render metadata/JSON-LD.

## 7. Validation

### 7.1. Lưu nháp

Draft được lưu khi có ít nhất một trong hai trường: tiêu đề có ký tự hoặc nội dung editor có text/ảnh thực. Các field đã nhập vẫn phải đúng kiểu, giới hạn độ dài, UUID và URL. Slug trống được backend sinh từ tiêu đề khi có tiêu đề; nếu cả hai trống thì slug nội bộ tạm thời dùng `draft-<uuid>` và không public.

### 7.2. Xuất bản

Xuất bản bị chặn nếu thiếu hoặc sai một trong các điều kiện:

- Tiêu đề từ 10 đến 255 ký tự.
- Slug hợp lệ, dài tối đa 200 ký tự và duy nhất trên slug hiện tại lẫn lịch sử.
- Excerpt từ 50 đến 500 ký tự.
- Nội dung sau khi bỏ HTML rỗng có ít nhất 300 từ.
- Có đúng một danh mục hợp lệ.
- Có thumbnail và cover image hợp lệ.
- Thumbnail alt và cover alt không rỗng.
- Meta title từ 30 đến 70 ký tự.
- Meta description từ 120 đến 180 ký tự.
- Canonical URL, nếu có, là URL `https` tuyệt đối.

Tags, focus keyword và social image riêng không bắt buộc. Social image fallback về cover hoặc thumbnail.

Backend là nguồn validation chính. Frontend dùng cùng ngưỡng để feedback sớm, map lỗi API về đúng field và focus field lỗi đầu tiên sau khi submit.

## 8. SEO kiểu WordPress/Yoast và preview

Trải nghiệm lấy cảm hứng từ Yoast SEO trong WordPress: feedback realtime, traffic light, search appearance và social appearance. UpNext không sao chép thương hiệu, câu chữ hoặc thuật toán độc quyền của plugin; toàn bộ rule của UpNext được công khai trong code và test.

### 8.1. SEO analysis

Checklist không quyết định quyền xuất bản ngoài các publish validation ở trên. Mỗi mục hiển thị `Tốt`, `Cần cải thiện`, `Vấn đề` hoặc `Chưa có dữ liệu`:

- Focus keyword xuất hiện tự nhiên trong title.
- Focus keyword xuất hiện trong slug.
- Focus keyword xuất hiện trong meta description.
- Focus keyword xuất hiện trong đoạn mở đầu.
- Focus keyword xuất hiện trong ít nhất một H2/H3.
- Focus keyword không bị lặp với mật độ bất thường; rule chỉ cảnh báo, không khuyến khích nhồi từ khóa.
- Meta title và description nằm trong khoảng khuyến nghị.
- Nội dung có ít nhất 600 từ để đạt mức khuyến nghị; 300–599 từ chỉ là cần cải thiện.
- Tất cả ảnh trong nội dung có alt text.
- Nội dung có ít nhất một internal link hợp lệ thuộc domain UpNext.
- Nội dung có outbound link khi chủ đề cần dẫn nguồn; không chặn xuất bản nếu không có.
- Slug ngắn gọn, không quá 75 ký tự và không có từ rỗng lặp lại.

Điểm tổng hợp dùng rule xác định, không dùng AI: đỏ khi còn lỗi publish hoặc nhiều vấn đề chính, cam khi đủ xuất bản nhưng còn khuyến nghị, xanh khi không còn vấn đề chính, xám khi chưa có đủ dữ liệu phân tích. UI luôn ưu tiên danh sách nhận xét cụ thể hơn con số tổng.

### 8.2. Readability analysis

Tab khả năng đọc phân tích realtime bằng các heuristic có thể áp dụng cho nội dung tiếng Việt:

- Đoạn văn quá dài, mặc định cảnh báo khi vượt 150 từ.
- Câu quá dài, mặc định cảnh báo khi vượt 30 từ; không dùng điểm Flesch tiếng Anh.
- Section dưới một heading quá dài, cảnh báo khi vượt 300 từ mà không có heading phụ.
- Tỷ lệ câu liên tiếp mở đầu bằng cùng một cụm từ.
- Có đoạn mở đầu, heading phân cấp đúng và danh sách khi nội dung liệt kê nhiều ý.
- Phát hiện H2/H3/H4 nhảy cấp và heading rỗng.
- Phát hiện link text mơ hồ lặp lại như “xem tại đây” để khuyến nghị mô tả rõ hơn.

Các heuristic chỉ là trợ giúp biên tập, không chặn xuất bản và mỗi rule có giải thích ngắn ngay trong UI.

### 8.3. Search appearance

Google snippet preview hiển thị favicon/site name, breadcrumb URL, SEO title và description. Có nút chuyển desktop/mobile giống workflow quen thuộc của Yoast. Các field có thanh báo độ dài trực quan, nhưng ghi rõ Google có thể tự tạo title link hoặc snippet khác từ nội dung trang.

SEO title hỗ trợ các biến giới hạn `%title%`, `%site_name%` và `%separator%`; nút “Chèn biến” thêm token tại vị trí con trỏ. Giá trị preview và metadata public được resolve bằng cùng một pure function để không lệch nhau.

Permalink hiển thị ngay dưới title theo dạng `upnext.works/posts/<slug>`. Slug tự sinh cho đến lần admin sửa thủ công; sau đó không tự đổi theo title nữa. Đổi slug của bài đã xuất bản mở confirmation giải thích redirect 301 sẽ được tạo.

### 8.4. Social appearance và nâng cao

Social preview có khung desktop cho Facebook/LinkedIn và compact card cho X. Fallback:

- Social title → SEO title đã resolve → title bài.
- Social description → meta description → excerpt.
- Social image → social image riêng → cover → thumbnail.

Tab nâng cao chứa robots index/follow và canonical URL. Mặc định không nhập canonical tùy chỉnh; frontend/public tự xuất self-referencing canonical. Canonical tùy chỉnh phải là URL HTTPS tuyệt đối và UI cảnh báo khi domain khác UpNext, nhưng không chặn nếu admin xác nhận.

Preview là mô phỏng để biên tập, không cam kết Google hoặc mạng xã hội sẽ render giống tuyệt đối.

## 9. Autosave và phục hồi

### 9.1. Bài chưa có ID

- Lưu snapshot cục bộ bằng key theo admin account và route create.
- Debounce 1 giây sau thay đổi; không upload lại file đã upload thành công.
- Khi mở lại trang create và snapshot còn hạn 7 ngày, hiển thị banner cho phép khôi phục hoặc bỏ bản cục bộ.
- Sau lần admin bấm “Lưu nháp” thành công, xóa snapshot create và chuyển sang autosave server theo ID.

### 9.2. Bài đã có ID

- Debounce 2 giây sau thay đổi cuối cùng rồi PATCH dữ liệu dirty.
- Chỉ có một request autosave đang chạy; thay đổi phát sinh trong lúc request chạy được gom vào lượt kế tiếp.
- Trạng thái UI: `Đã lưu`, `Đang lưu…`, `Chưa đồng bộ`, `Xung đột dữ liệu`.
- Khi offline hoặc request lỗi mạng, lưu snapshot cục bộ và thử lại khi nhận sự kiện online.
- Snapshot cục bộ có `postId`, `updatedAt` server gần nhất và timestamp client.
- Nếu server trả `409`, dừng tự động ghi, giữ snapshot và yêu cầu admin reload bản server hoặc sao chép nội dung cục bộ; không tự merge HTML.
- `beforeunload` chỉ cảnh báo khi còn dirty data chưa có trong local snapshot hoặc server.

Autosave không tự đổi trạng thái và không tự xuất bản. Nút lưu thủ công flush ngay các thay đổi đang chờ.

## 10. Metadata và render public

Route `posts/[slug]` phải fetch bài ở server trong `generateMetadata` thay vì dùng metadata tĩnh hiện tại.

Fallback:

- SEO title: resolve các biến trong `metaTitle`, sau đó fallback về `title`.
- Description: `metaDescription || excerpt`.
- Open Graph image: social image, sau đó cover, sau đó thumbnail.
- Open Graph/Twitter title: social title, sau đó SEO title.
- Open Graph/Twitter description: social description, sau đó meta description/excerpt.
- Canonical: `canonicalUrl` nếu được cấu hình, nếu không là URL bài hiện tại theo canonical slug.
- Robots: kết hợp `isIndexable` và `isFollowable`.

Trang chi tiết thêm JSON-LD:

- Dùng `NewsArticle` cho type `NEWS`, còn lại dùng `Article`.
- Có headline, description, image, author, publisher UpNext, `datePublished`, `dateModified` và canonical URL.
- Thêm `BreadcrumbList` cho Trang chủ → Bài viết → Danh mục → Bài hiện tại.

Slug không tồn tại, draft hoặc archived trả `notFound()`. Slug history dùng `permanentRedirect` tới canonical slug. Nội dung public chỉ có một H1 là tiêu đề bài; editor chỉ sinh H2–H4.

## 11. Biên giới component và file

Form không tiếp tục sống trong một `article-form.tsx` lớn. Cấu trúc dự kiến dưới `features/admin/components/content/articles/editor/`:

- `article-editor-page.tsx`: orchestration query/mutation, route mode và layout.
- `article-editor-header.tsx`: navigation, sync status và primary actions.
- `article-content-fields.tsx`: title, excerpt, word count và article editor.
- `article-rich-text-editor.tsx`: Tiptap instance và article-specific extensions.
- `article-taxonomy-panel.tsx`: type, category và searchable tags.
- `article-media-panel.tsx`: thumbnail, cover, social image và alt text.
- `article-seo-panel.tsx`: meta box bốn tab, traffic lights và điều phối các panel SEO.
- `article-search-preview.tsx`: snippet editor/preview desktop-mobile và chèn biến title.
- `article-readability-analysis.ts`: pure functions cho heuristic tiếng Việt.
- `article-social-preview.tsx`: social fields, fallback và preview card.
- `article-publish-panel.tsx`: status transitions và confirmation.
- `article-preview-dialog.tsx`: preview responsive trước xuất bản.
- `article-form-schema.ts`: draft schema, publish schema và payload mapping.
- `article-seo-analysis.ts`: pure functions cho checklist, word count và fallback.
- `article-draft-storage.ts`: local snapshot và expiry.
- `use-article-autosave.ts`: state machine/debounce/retry/conflict handling.

Các API types/functions tiếp tục nằm trong `features/admin/api/posts.ts` hoặc được tách thành `features/admin/api/posts/` nếu file vượt quá trách nhiệm hợp lý. Shared editor hiện tại không bị thay đổi hành vi cho consumer khác.

Backend giữ module `posts`, tách pure validation/slug/sanitization khỏi service chính để có thể unit test độc lập. Migration phải backfill `publishedAt` của bài `PUBLISHED` từ `createdAt`; các field nullable mới không làm hỏng dữ liệu hiện có.

## 12. Xử lý lỗi và quyền truy cập

- Mutation dùng TanStack Query, lấy `getAdminSession()` bên trong `mutationFn` như convention repo.
- `401`: xóa admin session và chuyển về admin login.
- `403`: hiển thị thông báo không đủ quyền, không làm mất snapshot cục bộ.
- `400/422`: map field errors từ backend vào form; lỗi tổng quát dùng chính `ApiError.message`.
- `409`: chuyển autosave sang conflict state và bảo toàn bản local.
- `5xx`/offline: báo chưa đồng bộ, cho retry, không thông báo thành công giả.
- Upload ảnh lỗi độc lập với autosave form; asset chỉ được gắn vào bài sau khi upload thành công.

Tiếp tục yêu cầu admin session hiện có. Nếu hệ thống permission đã có permission quản lý content thì route/API dùng permission đó; nếu chưa có, phạm vi này bổ sung `posts:manage` và seed cho role admin mặc định, không tạo thêm session helper.

## 13. Accessibility

- Tất cả field có label, mô tả và error liên kết bằng `aria-describedby`.
- Lỗi xuất bản được tổng hợp ở đầu form và focus tới field lỗi đầu tiên.
- Toolbar editor dùng button thật, `aria-pressed`, tooltip và keyboard shortcuts.
- Tag selector, upload, dialog preview và confirmation thao tác được hoàn toàn bằng keyboard.
- Focus trap và trả focus đúng trigger khi đóng dialog.
- Không dùng màu làm tín hiệu trạng thái duy nhất; luôn có icon và text.
- Hit target tối thiểu 40px trong Admin UI; mobile ưu tiên 44px.
- Kiểm tra contrast, zoom 200%, reduced motion và screen-reader announcement cho autosave status.

## 14. Kiểm thử và tiêu chí hoàn thành

### Frontend

- Unit test draft/publish schema, SEO analysis, slug normalization và local draft expiry.
- Hook test autosave debounce, serialized requests, offline retry, flush thủ công và conflict.
- Component test editor sections, field error mapping, image alt requirement, slug availability, preview và status actions.
- Playwright: tạo local draft → phục hồi → lưu draft → autosave → preview → publish → xem public → archive.
- Playwright kiểm tra keyboard navigation và mobile sticky actions cho các trạng thái chính.

### Backend

- Unit test sanitizer allowlist, slug uniqueness/history, draft validation và publish validation.
- Service/controller test create draft, PATCH với optimistic concurrency, publish, archive, unauthorized/forbidden và validation errors.
- Integration test migration/backfill và transaction cập nhật tags/slug history.
- Public API test chỉ trả published post và resolve slug history đúng canonical.

### Public SEO

- Test `generateMetadata` với dữ liệu đầy đủ và từng fallback.
- Test robots, canonical, Open Graph/Twitter fields và JSON-LD Article/NewsArticle.
- Test `notFound` cho draft/archived/unknown và permanent redirect cho slug cũ.

### Quality gate

- Frontend: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test`, `pnpm build` và Playwright specs liên quan.
- Backend: `pnpm typecheck`, `pnpm lint`, `pnpm format:check`, `pnpm test` và `pnpm build`.
- Chạy browser verification thực tế và accessibility review trước khi kết luận hoàn thành.

## 15. Triển khai và tương thích

1. Deploy migration/backend trước; field mới nullable/default nên frontend cũ vẫn hoạt động trong cửa sổ triển khai.
2. Backfill `publishedAt = createdAt` cho post đang `PUBLISHED`.
3. Deploy frontend Admin mới và metadata public mới sau khi API mới sẵn sàng.
4. Không xóa `metaKeywords` trong đợt này; việc dọn legacy field là thay đổi riêng sau khi xác nhận không còn consumer.
5. Theo dõi lỗi autosave, conflict rate, publish validation failures và metadata fetch sau rollout.

Không cần feature flag vì route chỉ dành cho Admin và API mới tương thích ngược ở mức đọc. Nếu deployment không thể đảm bảo backend trước frontend, frontend phải feature-detect các field/endpoint mới và giữ nút publish disabled với thông báo hệ thống chưa sẵn sàng.
