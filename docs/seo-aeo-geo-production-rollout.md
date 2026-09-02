# Kế hoạch SEO, AEO/GEO và phát hành domain production

**Trạng thái:** Kế hoạch triển khai — chưa được deploy
**Ngày audit:** 2026-09-02
**Phạm vi:** `upnext-frontend`, `upnext-backend`, `upnext-infra`, nội dung/publication
**Vị trí tài liệu:** `upnext-frontend/docs` vì đây là nơi triển khai phần SEO public chính; các hạng mục Infra/Backend vẫn có owner riêng bên dưới.
**Domain production mục tiêu:** `https://upnext.works`
**Domain staging:** `https://staging.upnext.works`

---

## 1. Quyết định kiến trúc bắt buộc

Không dùng `staging.upnext.works` làm domain SEO lâu dài.

| Môi trường                | Mục đích                     | Lập chỉ mục                                   | Canonical                                                  | Sitemap                                           |
| ------------------------- | ---------------------------- | --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `staging.upnext.works`    | QA/UAT release candidate     | **Không** (`X-Robots-Tag: noindex, nofollow`) | Self-canonical để QA; không canonical chéo sang production | Có thể sinh để test, nhưng không advertise/submit |
| `preview.*` (nếu bổ sung) | Kiểm thử theo PR/release     | Không                                         | Self-canonical hoặc không có                               | Không advertise/submit                            |
| `upnext.works`            | Website công khai chính thức | Có, sau release gate                          | Chính nó                                                   | Sitemap production duy nhất                       |

### Lý do

1. Search engine cần một domain chủ đạo, ổn định và có URL bền vững.
2. Staging thay đổi liên tục, có thể chứa dữ liệu test, tính năng chưa duyệt và không phù hợp để tích luỹ tín hiệu tìm kiếm.
3. Nếu index staging trước rồi mới chuyển domain, đội ngũ phải xử lý migration, duplicate content, redirect và tín hiệu SEO bị phân tán.
4. `upnext.works` hiện phải được đưa từ placeholder sang đúng artifact đã qua staging; không mở index trước thời điểm này.

> Không dùng `robots.txt` để thực hiện `noindex`. Bot phải truy cập được trang để đọc `noindex`; vì vậy staging dùng HTTP header hoặc metadata được render từ server. Tham khảo: [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

---

## 2. Kết quả audit hiện trạng

Các kiểm tra HTTP công khai ngày 2026-09-02 ghi nhận:

| Hạng mục                    | `staging.upnext.works`                          | `upnext.works`           | Mức độ                       |
| --------------------------- | ----------------------------------------------- | ------------------------ | ---------------------------- |
| Trang chủ `/vi`             | 200, có title/description/H1                    | 200 nhưng là placeholder | Blocker production           |
| Jobs, companies, posts      | Có trên staging                                 | 404 trên production      | Blocker production           |
| `/robots.txt`               | 404                                             | 404                      | P0                           |
| `/sitemap.xml`              | 404                                             | 404                      | P0                           |
| `rel=canonical`             | Không có                                        | Không có                 | P0                           |
| JSON-LD                     | Không có                                        | Không có                 | P1                           |
| Metadata jobs/companies     | Dùng title/description chung                    | Không có route thật      | P1                           |
| HTML ban đầu jobs/companies | Không có H1/nội dung chính                      | —                        | P1                           |
| `hreflang`                  | Có HTTP Link cơ bản cho `vi`, `en`, `x-default` | Có ở homepage            | Cần hoàn thiện theo từng URL |
| Cache HTML                  | `s-maxage=31536000`                             | `s-maxage=31536000`      | P1 với dữ liệu động          |

### Phát hiện mã nguồn liên quan

- Cả `/` và `/vi` hiện trả cùng homepage 200. Nếu mở index như hiện trạng, đây là duplicate URL; production phải redirect vĩnh viễn `/` sang `/vi` (default locale) trước khi launch.
- Frontend mới có metadata ở layout chung, pricing và posts; jobs/company/detail hiện là client route.
- Job detail public hiện dùng UUID làm dữ liệu truy xuất, trong khi đường dẫn được gọi là `slug`; cần URL SEO bền vững và rõ nghĩa.
- API job public đã lọc tin `PUBLISHED`, `APPROVED`, không hidden, công ty active và chưa hết hạn. Đây là điều kiện nền tốt để dùng cho sitemap/read model.
- API company detail hiện có dữ liệu không cần thiết cho SEO/public rendering; không được dùng nguyên response đó cho server-render hay sitemap. Phải có public SEO DTO allowlist.
- Production và staging đang dùng tag image động; release SEO không được deploy từ một tag động không truy vết được commit/digest.

---

## 3. Mục tiêu, phạm vi và chỉ số thành công

### Mục tiêu

1. Người tìm việc tìm được job/company/article public qua Google và Bing trên `upnext.works`.
2. Job đang mở đủ điều kiện kỹ thuật để xuất hiện trong Google Jobs khi Google hỗ trợ tại thị trường phù hợp.
3. Không index CV, profile ứng viên, dashboard, dữ liệu tuyển dụng nội bộ, preview hoặc URL query không có giá trị.
4. Nội dung được render, crawl, cache và cập nhật đúng vòng đời job.
5. Website trả lời rõ các câu hỏi thật của ứng viên/nhà tuyển dụng (AEO/GEO) mà không tạo nội dung mỏng hoặc schema giả.

### Không nằm trong phạm vi

- Không cam kết vị trí từ khóa hoặc rich result cụ thể; Google/Bing quyết định hiển thị.
- Không mass-generate hàng nghìn trang role × city × skill chỉ để lấy traffic.
- Không đưa private recruiter/candidate data, CV hoặc contact details vào index/schema/sitemap.
- Không dùng FAQ schema cho câu hỏi không hiển thị hay nội dung không do UpNext kiểm chứng.

### KPI theo dõi

| Nhóm            | KPI                                                                                         | Mốc theo dõi                        |
| --------------- | ------------------------------------------------------------------------------------------- | ----------------------------------- |
| Crawl/index     | URLs valid trong sitemap, coverage errors, canonical mismatch, blocked/noindex ngoài ý muốn | Hằng tuần                           |
| Job SEO         | Valid JobPosting items, expired jobs removed đúng hạn, index/update latency                 | Hằng ngày sau launch, rồi hằng tuần |
| Organic         | Impressions, clicks, CTR, query cluster, landing-page conversion                            | Hằng tuần/tháng                     |
| Product         | Organic job-view → apply rate; company page → job click; article → job/company click        | Hằng tuần                           |
| Core Web Vitals | p75 LCP ≤ 2.5s, INP ≤ 200ms, CLS ≤ 0.1 cho mobile production                                | 28-day field data                   |
| Quality         | 404 rate, server 5xx, rich-result warnings, sitemap freshness                               | Hằng ngày                           |

---

## 4. URL và index policy

### 4.1 URL được index

- `/vi`, `/en`
- `/vi/jobs`, `/en/jobs`
- `/vi/jobs/{stable-slug}` và `/en/jobs/{stable-slug}` khi job public, approved và còn hạn
- `/vi/companies`, `/en/companies`
- `/vi/companies/{company-slug}` và `/en/companies/{company-slug}` khi company active/verified và đủ nội dung public
- `/vi/posts`, `/en/posts`
- `/vi/posts/{post-slug}` và `/en/posts/{post-slug}` khi bài đã xuất bản, có bản dịch tương ứng
- pricing, about, policy/editorial pages được duyệt
- Landing pages role/location được biên tập, có nhu cầu thực và số job đủ cao

### 4.2 URL không được index

- `/admin/**`, `/candidate/**`, `/recruiter/**`, `/conversations/**`
- login/register/callback/reset-password/email-verification
- preview, draft, import, create/edit, billing, analytics, notifications
- `/api/**`, asset private, CV/profile endpoint
- query results như `?keyword=`, `?position=`, `?sort=`, `?page=` nếu chưa được thiết kế thành landing page có nội dung thật
- job hết hạn, job hidden/rejected/deleted, company bị inactive

### 4.3 Quy tắc URL bền vững

1. Một thực thể public có đúng một canonical URL.
2. Job dùng slug bất biến, có hậu tố short ID để tránh trùng, ví dụ:
   `senior-backend-engineer-acme-a1b2`.
3. Nếu title đổi, giữ slug cũ hoặc tạo redirect 301 từ slug cũ tới slug mới.
4. URL UUID/legacy không được index; redirect 301 về canonical nếu có mapping, còn không trả 404.
5. Không canonical tất cả trang filter về `/jobs` một cách máy móc. Filter chỉ index nếu đó là landing page được quản trị, có canonical/self metadata và nội dung riêng.

---

## 5. Workstream A — Hạ tầng, domain và release

**Owner:** Infra + Release owner
**Ưu tiên:** P0

### A1. Biến môi trường và canonical host

Thêm cấu hình rõ ràng, server-side:

```text
PUBLIC_ORIGIN=https://upnext.works|https://staging.upnext.works
CANONICAL_ORIGIN=https://upnext.works        # chỉ được dùng khi production indexable
DEPLOY_ENV=production|staging
SEO_INDEXING_ENABLED=true|false
```

- Không suy luận production từ `NODE_ENV`.
- Staging phải có `SEO_INDEXING_ENABLED=false`.
- Production chỉ có `SEO_INDEXING_ENABLED=true` sau release gate.
- Staging dùng `PUBLIC_ORIGIN` của chính staging nếu cần self-canonical để QA; không được emit canonical production trong khi production còn placeholder hoặc nội dung không tương đương.
- Client không được tự thêm/xóa robots meta sau hydration; robots state phải có trong response HTML/header đầu tiên.

### A2. Nginx/header policy

- `staging.upnext.works`: gửi `X-Robots-Tag: noindex, nofollow` cho HTML và các file có nguy cơ index.
- Production placeholder: cũng gửi `noindex` cho đến ngày launch.
- Production launch: bỏ header site-wide `noindex`; giữ noindex theo route private từ Next response/layout.
- Không gửi header khác nhau cho bot bằng user-agent (không cloaking).
- HTTPS, host redirect và trailing-slash policy phải nhất quán; chỉ có một host public (`https://upnext.works`).
- Hoàn tất recovery Uptime Kuma, Beszel và agent restart trước release; release gate phải kiểm tra synthetic health, container health và alert delivery chứ không chỉ kiểm tra `docker ps`.
- Xác minh bằng Search Console liệu staging đã có URL/index/impression hay chưa. Nếu có, để crawler đọc `noindex`, theo dõi Page Indexing và dùng Removal tool khi cần khẩn cấp; chỉ dùng 301 staging → production khi staging thực sự được ngừng dùng làm môi trường test và có mapping URL tương đương.

### A3. Artifact promotion

1. Tạo release branch/tag từ commit đã code-freeze.
2. CI build frontend/backend với tag bất biến, ví dụ `sha-<commit>` và lưu image digest.
3. Deploy **cùng digest** đó lên staging.
4. Chạy quality gate và soak window.
5. Merge/fast-forward release commit vào `main` theo chiến lược không tạo source khác với artifact đã test; hoặc promote chính digest đã test qua release tag.
6. Deploy production đúng digest, không dùng `develop`, `main`, `latest`, `production` làm giá trị triển khai duy nhất.

### A4. Migration guard

- Restore backup production vào DB cô lập và chạy toàn bộ migration của release candidate.
- Ghi nhận migration nào destructive, lock lâu, backfill lớn hoặc không rollback được.
- Đảm bảo backend mới tương thích với frontend cũ trong giai đoạn deploy; nếu không, dùng maintenance plan rõ ràng.
- Backup production trước migration; test restore; có owner và thời hạn quyết định rollback.

### Acceptance A

- `curl -I https://staging.upnext.works/vi` có `X-Robots-Tag: noindex`.
- Production chỉ bỏ noindex sau khi product routes thật trả 200.
- Deploy log có commit SHA, image digest, tag hiện tại và tag rollback.
- Monitoring/alerting healthy trước release.

---

## 6. Workstream B — Technical SEO trong frontend

**Owner:** Frontend
**Ưu tiên:** P0/P1

### B1. Metadata framework tập trung

Tạo helper server-only, ví dụ `src/lib/seo/`, chịu trách nhiệm:

- đọc `PUBLIC_ORIGIN`, `CANONICAL_ORIGIN`, `DEPLOY_ENV`, `SEO_INDEXING_ENABLED`;
- sinh canonical URL tuyệt đối;
- sinh metadata locale-aware;
- sinh Open Graph/Twitter;
- sinh `robots` cho page public/private;
- kiểm tra dữ liệu trống/unsafe trước khi vào `<head>`.

Trong root locale layout:

- đặt `metadataBase` là `PUBLIC_ORIGIN`; canonical production chỉ sinh khi `SEO_INDEXING_ENABLED=true`;
- title template nhất quán, ví dụ `%s | UpNext`;
- `alternates.languages` gồm `vi`, `en`, `x-default` khi bản dịch thực sự tương đương;
- có Organization/WebSite schema tối thiểu ở domain production.

### B2. Metadata theo route

| Route              | Title/description                            | Canonical | Robots                                             |
| ------------------ | -------------------------------------------- | --------- | -------------------------------------------------- |
| Home               | Theo locale, value proposition rõ            | Self      | index, follow (production)                         |
| Jobs list          | `Việc làm IT tại Việt Nam – UpNext`          | Self      | index nếu trang gốc; filtered URL noindex mặc định |
| Job detail         | Job + company + location                     | Self      | index khi job đang mở                              |
| Companies list     | `Công ty công nghệ đang tuyển dụng – UpNext` | Self      | index trang gốc                                    |
| Company detail     | Company + việc làm/văn hóa                   | Self      | index khi đủ điều kiện                             |
| Post               | Tiêu đề/summary/author/date thật             | Self      | index khi published                                |
| Workspace/auth/API | Không cần social/meta công khai              | Không     | noindex, nofollow                                  |

Không dùng một title/description chung cho job/company/post detail.

### B2.1. Default locale và duplicate URL

- Với `localeDetection=false`, redirect HTTP **308** từ `/` tới `/vi` và giữ `/vi` là canonical default-locale URL.
- `x-default` phải trỏ tới URL ổn định đó (`/vi`), không trỏ tới một homepage duplicate.
- Chuẩn hoá slash, lowercase và legacy ID/slug redirects ở tầng application/Nginx bằng một redirect hop duy nhất.
- Test một bảng URL gồm `/`, `/vi`, `/en`, URL có slash cuối và legacy job URL để không tạo redirect chain/loop.

### B3. `robots.ts` và `sitemap.ts`

- Tạo route metadata ở root: `/robots.txt`, `/sitemap.xml` hoặc sitemap index.
- Sửa matcher i18n để các route đặc biệt này không bị coi là locale (`robots.txt`, `sitemap.xml`, manifest, favicon, `_next`, API).
- Production robots nêu rõ sitemap canonical. Chỉ `Disallow` các endpoint không-HTML/không cần crawl; với route HTML private dùng authentication/redirect hoặc HTTP/meta `noindex` **nhưng không đồng thời chặn bằng robots**, để bot có thể đọc noindex nếu URL đã từng bị phát hiện:

```text
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://upnext.works/sitemap.xml
```

- Không đưa staging URL vào sitemap production.
- Sitemap có thể là index chia `static`, `jobs`, `companies`, `posts` khi số URL lớn.

### B4. SSR/ISR thay cho client-only content

Các route indexable phải fetch read model ở Server Component và render:

- H1;
- nội dung chính/job description;
- link nội bộ có `href`;
- metadata;
- JSON-LD;
- trạng thái 404/expired.

Không chỉ dựa vào React Query/client hydration. Google có thể render JavaScript, nhưng SSR/ISR giúp metadata và nội dung chính có sẵn ngay từ response, ổn định hơn cho crawl và AEO.

Cache bắt buộc theo vòng đời dữ liệu:

- job detail/list: ISR ngắn (ví dụ 5–15 phút) + `revalidateTag` khi publish/update/expire;
- company: 30–60 phút + invalidation khi profile/job đổi;
- article: revalidate khi publish/update;
- không cache một năm HTML metadata/job có thể hết hạn.

### B5. Hreflang và translation integrity

- Mỗi URL `vi`/`en` phải link ngược đầy đủ tới chính nó và bản tương đương.
- `x-default` trỏ về route lựa chọn ngôn ngữ đã xác định.
- Nếu job, company hoặc article chưa có bản English thực, không khai báo nó là equivalent; có thể chỉ index một locale cho nội dung đó.
- Không redirect bot theo `Accept-Language`; URL locale phải cố định.

### Acceptance B

- Mỗi URL indexable có 1 title, 1 description, 1 canonical tuyệt đối, 1 H1 và 0 `noindex` trong production.
- HTML tải bằng `curl` cho 10 job/company/article mẫu đã có nội dung chính và metadata riêng.
- Route private có noindex trước hydration.
- `robots.txt` và sitemap đều 200 từ root domain, không bị i18n rewrite.

---

## 7. Workstream C — Public SEO read model và backend events

**Owner:** Backend
**Ưu tiên:** P1

### C1. Không tái sử dụng DTO nội bộ

Tạo endpoint/service chỉ đọc, anonymous-safe cho SSR/sitemap, ví dụ:

```text
GET /public/seo/jobs?cursor=&updatedSince=
GET /public/seo/jobs/:slug
GET /public/seo/companies?cursor=&updatedSince=
GET /public/seo/companies/:slug
GET /public/seo/posts?cursor=&updatedSince=
GET /public/seo/posts/:slug
```

Read model chỉ chứa field public cần thiết. Không trả recruiter account, member, CV, email, private location, internal moderation note, plan/subscription hay token.

### C2. Job lifecycle contract

Một job chỉ xuất hiện trong SEO endpoint và sitemap khi đồng thời:

- `PUBLISHED`;
- moderation `APPROVED`;
- company `ACTIVE`/đủ điều kiện public;
- không hidden/deleted;
- chưa `expiredAt`.

Khi job expire/hide/reject/delete:

1. bỏ khỏi SEO listing và sitemap;
2. invalidation page/list cache;
3. page trả 404/410 theo policy thống nhất hoặc render closed page `noindex` không có JobPosting;
4. gửi `URL_UPDATED`/`URL_DELETED` qua Google Indexing API nếu được uỷ quyền; API này chỉ dùng cho `JobPosting` hợp lệ, không dùng cho company/article/general pages.

Google chỉ cho JobPosting trên một trang đại diện cho đúng một job, phải có cách ứng tuyển, và yêu cầu xử lý job hết hạn nhanh. [Google JobPosting documentation](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

### C3. Slug và redirects

- Thêm/chuẩn hoá SEO slug unique, stable và được validate.
- Endpoint lookup theo slug.
- Lưu mapping legacy UUID/slug cũ để frontend/Nginx trả 301 chính xác.
- Không thay đổi URL theo title bất cứ khi nào recruiter sửa nội dung.

### C4. Revalidation events

Khi job/company/post đổi trạng thái public, backend phát event outbox/webhook có chữ ký tới frontend:

```text
job.published | job.updated | job.expired | job.hidden
company.updated | company.deactivated
post.published | post.updated | post.unpublished
```

Frontend xác thực chữ ký và gọi `revalidateTag`/`revalidatePath`. Không expose revalidation secret ra client.

### Acceptance C

- Không thể tìm thấy PII/private field trong response SEO API bằng contract test.
- Sitemap read model không trả job invalid/expired.
- Event test chứng minh cache metadata và sitemap đổi sau publish/expire.
- Slug conflict, legacy redirect và unknown URL có test.

---

## 8. Workstream D — Structured data

**Owner:** Frontend + Backend data owner
**Ưu tiên:** P1

### D1. Schema theo loại trang

| Trang      | Schema                                                                      |
| ---------- | --------------------------------------------------------------------------- |
| Home       | `Organization`, `WebSite` (có SearchAction nếu search URL contract ổn định) |
| Job detail | `JobPosting`, `BreadcrumbList`                                              |
| Company    | `Organization`, `BreadcrumbList`                                            |
| Article    | `Article` hoặc `BlogPosting`, `BreadcrumbList`                              |
| List       | `CollectionPage`/`ItemList` khi dữ liệu thực sự render                      |

### D2. `JobPosting` bắt buộc

Chỉ render khi job đang public. Giá trị schema phải trùng hoàn toàn với nội dung hiển thị và có:

- `title`, `description` đầy đủ;
- `datePosted`, `validThrough`;
- `hiringOrganization` có tên/logo hợp lệ;
- `jobLocation` hoặc `jobLocationType: TELECOMMUTE` với remote;
- `employmentType`, `identifier`;
- salary chỉ khi số tiền/currency/period được hiển thị thực;
- direct apply flow không bắt login chỉ để xem mô tả job.

Không đặt nhiều `JobPosting` trên list page. Không để schema tồn tại sau khi job hết hạn. Validate bằng Rich Results Test và URL Inspection trước launch. [Google JobPosting requirements](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

### D3. Schema safety

- JSON-LD serialize bằng safe JSON escaping, tránh user-generated `</script>` injection.
- Không dùng CV/candidate data trong schema.
- Có unit test schema required fields, null handling, expiry, locale và escaping.
- Schema là dữ liệu mô tả, không phải công cụ thao túng ranking.

---

## 9. Workstream E — Nội dung, information architecture và internal links

**Owner:** Content/Product/SEO owner
**Ưu tiên:** P2

### E1. Research trước khi tạo content

- Lập keyword map dựa trên query thực trong Search Console sau launch, lượng job supply, conversion apply và câu hỏi từ support/sales; không sao chép keyword của đối thủ một cách máy móc.
- Mỗi proposed landing page phải có business owner, mục đích tìm kiếm, nguồn dữ liệu, số job tối thiểu, internal-link plan, tiêu chí `noindex`/retire và KPI conversion.
- Duyệt content brief trước khi viết; SEO không tự phát hành content hay thay đổi title của job do recruiter đăng.

### E2. Taxonomy có kiểm duyệt

Khởi đầu bằng những hub có nhu cầu và dữ liệu thật:

- Role: Backend, Frontend, Mobile, Data, AI/ML, DevOps, QA.
- Location: Hồ Chí Minh, Hà Nội, Đà Nẵng, Remote.
- Company sector/size chỉ khi có danh sách công ty và job hữu ích.
- Career content: CV IT, phỏng vấn, mức lương, kỹ năng, roadmap.

Mỗi landing page phải có H1, intro được biên tập, selection logic minh bạch, job còn mở, links tới category/company/article liên quan và canonical riêng. Nếu không đủ nội dung/job, để `noindex` hoặc không tạo URL.

### E3. Article quality

- Title/description/slug/article body theo từng bài, không dùng metadata chung.
- Hiển thị author/editor, publish/updated date, nguồn dữ liệu và disclosure khi dùng AI hỗ trợ biên tập.
- Có editorial policy, correction policy, privacy policy, Terms, About, Contact.
- Chỉ cập nhật `dateModified` khi có thay đổi có ý nghĩa.
- Link từ article đến các job/company thật; không dùng keyword stuffing.

### E4. Internal link rules

- Mọi link indexable là `<a href>` crawlable, không chỉ `onClick`/router push.
- Breadcrumb có link thật.
- Không để expired job ở navigation/sitemap/related module.
- Có route 404 hữu ích, trả HTTP 404 thật, log broken internal link.

---

## 10. Workstream F — AEO/GEO

**Owner:** Content/Product/SEO owner
**Ưu tiên:** P2 sau P0/P1

Trong tài liệu này, GEO là **Generative Engine Optimization**, không phải local-SEO địa lý.

### F1. Nguyên tắc

- Ưu tiên câu trả lời chính xác, có ngữ cảnh và nguồn dữ liệu trước khi tối ưu định dạng.
- Đặt câu trả lời ngắn, trực tiếp ngay dưới H2/H3 có câu hỏi thật.
- Dùng headings, list, table, glossary và examples để máy/công cụ đọc hiểu tốt.
- Không tạo FAQ giả, không ẩn text, không làm hàng loạt page do AI sinh mà không có biên tập/dữ liệu.

### F2. Content ưu tiên

- `Cách viết CV Backend Developer`, `Lương Frontend Developer tại Việt Nam`, `Chuẩn bị phỏng vấn DevOps`.
- `Cách UpNext xác thực job/công ty`, `Cách ứng tuyển`, `Cách bảo vệ dữ liệu ứng viên`.
- Hướng dẫn nhà tuyển dụng về JD, quy trình phỏng vấn, tiêu chuẩn feedback, sử dụng sản phẩm.
- Market reports có methodology, timeframe, sample size, limitation và owner.

### F3. Thực thể/tín hiệu tin cậy

- Trang About/Organization, Contact, policy và editorial ownership dễ crawl.
- Company pages minh bạch trạng thái xác minh và thông tin public.
- Author pages khi có tác giả thật; không gán tác giả không tồn tại.
- `sameAs` Organization chỉ liên kết kênh chính thức đã được xác minh.

### F4. Những thứ không ưu tiên

- `llms.txt` có thể bổ sung sau khi public information architecture ổn định, nhưng không xem là ranking factor hay release blocker.
- `speakable`, AI-crawler tricks, prompt injection text, hidden FAQ: không triển khai.

---

## 11. Workstream G — Performance và trải nghiệm crawl

**Owner:** Frontend + Infra
**Ưu tiên:** P1

- Chạy Lighthouse mobile/desktop trong CI cho home, jobs list, job detail, company, post.
- Đo field data bằng Search Console/CrUX sau launch; lab result không thay thế field data.
- Tối ưu LCP: hero image/font, image dimensions, preload có chọn lọc, tránh client JS không cần thiết.
- Tối ưu INP: giảm hydration/client state ở public pages, code split, tránh long task.
- Tối ưu CLS: luôn dành chỗ cho logo/image/job card/loading state.
- Không chặn Googlebot khỏi CSS/JS cần render.
- Kiểm tra response HTML và rendered page bằng URL Inspection sau launch.

Google có thể render JavaScript, nhưng metadata/canonical/robots không nên phụ thuộc vào thay đổi sau client hydration. [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

---

## 12. Testing và quality gate

### Tự động trong CI

- Unit test SEO helper: canonical host, locale, noindex, escaped metadata/JSON-LD.
- Contract test SEO API: chỉ public fields, status filtering, pagination/cursor.
- Sitemap test: canonical URLs only, no query URL, no expired/hidden/private entity, correct `lastmod`.
- Route integration test: public HTML có title/description/canonical/H1/JSON-LD; private route noindex.
- Job lifecycle test: publish → sitemap/schema có; expire → sitemap/schema mất, page policy đúng.
- Link checker cho internal href và redirect map.
- Rich Result validation fixture cho `JobPosting`/`Article`/`Organization`.
- Accessibility test: heading hierarchy, one H1, link accessible name, language attr.

### Manual release gate

1. `curl -I` xác nhận status/redirect/canonical host/robots header.
2. Mở View Source, không chỉ DevTools Elements, để xác minh content/metadata ban đầu.
3. Rich Results Test cho ít nhất 10 job, 5 article, 5 company.
4. URL Inspection trên Search Console production cho home, list, detail, expired job, private route.
5. Validate sitemap XML và submit Search Console/Bing Webmaster.
6. Test ứng tuyển anonymous/public, login redirect và expired job.
7. Review snapshot trước/sau migration database và rollback rehearsal.

---

## 13. Runbook phát hành production

### Trước deploy

- [ ] Code freeze release candidate.
- [ ] Mọi CI/SEO test pass.
- [ ] Với release lớn hiện tại (chênh lệch hàng trăm commit/migration), staging chạy chính image digest sẽ promote tối thiểu **7 ngày**; thay đổi nhỏ đã phân loại rủi ro thấp mới có thể dùng soak 72 giờ theo error budget được duyệt.
- [ ] No P0/P1 error, no unexplained 5xx/404 spike, monitoring healthy.
- [ ] Backup production verified và migration rehearsal pass.
- [ ] Sitemap/canonical/robots validated ở release candidate nhưng staging vẫn noindex.
- [ ] Search Console/Bing ownership sẵn sàng.
- [ ] Rollback image tag/digest và incident owner được ghi rõ.

### Deploy

1. Deploy backend artifact và migration theo runbook có backup.
2. Xác nhận health, logs, DB migration state và synthetic public API.
3. Deploy frontend cùng release artifact.
4. Xác nhận `upnext.works` trả product routes thật, canonical production, robots/sitemap 200.
5. Bỏ production `noindex`; staging vẫn noindex.
6. Submit sitemap production; request inspection cho representative URLs, không bulk-submit vô tội vạ.

### Sau deploy

- Theo dõi 15/30/60 phút: health, 5xx, latency, job apply, login, payment, API error.
- Theo dõi 72 giờ đầu liên tục và review đầy đủ sau 7 ngày: crawl errors, sitemap fetch, canonical choice, JobPosting enhancement, Core Web Vitals, index coverage.
- Giữ staging noindex và tiếp tục phát triển trên artifact/branch kế tiếp.

### Rollback

- App rollback phải dùng image digest/tag đã xác minh và healthcheck.
- Không rollback database tự động nếu migration không reversible.
- Nếu cần rollback sau migration: dừng release, đánh giá compatibility, restore backup chỉ theo incident owner/runbook đã duyệt.
- Không re-enable index nếu product routes hoặc canonical chưa ổn định.

---

## 14. Thứ tự backlog đề xuất

| Thứ tự | Hạng mục                                                          | Repo/owner       | Blocker launch                  |
| ------ | ----------------------------------------------------------------- | ---------------- | ------------------------------- |
| 1      | Staging/placeholder production noindex header; monitoring healthy | Infra            | Có                              |
| 2      | Quy trình immutable artifact + migration rehearsal                | Infra/Backend    | Có                              |
| 3      | Production chạy đầy đủ public routes                              | FE/BE/Infra      | Có                              |
| 4      | Site config, metadataBase, canonical, route noindex               | Frontend         | Có                              |
| 5      | Root robots + sitemap index và i18n matcher                       | Frontend         | Có                              |
| 6      | Public SEO read model, stable job slug, lifecycle events          | Backend          | Có                              |
| 7      | SSR/ISR job/company/article + unique metadata/H1                  | Frontend/Backend | Có                              |
| 8      | JobPosting/Organization/Article/Breadcrumb schema                 | Frontend/Backend | Có                              |
| 9      | CI SEO tests, rich-result fixtures, link checks                   | FE/BE/QA         | Có                              |
| 10     | Search Console/Bing, analytics dashboard                          | SEO/Infra        | Có                              |
| 11     | Curated landing pages, editorial governance                       | Content/Product  | Không, nhưng ưu tiên sau launch |
| 12     | AEO/GEO content program                                           | Content/Product  | Không                           |

---

## 15. Tài liệu tham chiếu chính thức

- [Google: Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: Build and submit sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: Localized versions and hreflang](https://developers.google.com/search/docs/advanced/crawling/localized-versions)
- [Google: JobPosting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Site move with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)

---

## 16. Definition of Done

SEO production launch chỉ được đánh dấu hoàn thành khi:

1. `upnext.works` là website product thật, không còn placeholder/404 ở public routes.
2. Staging và preview đều noindex ở response đầu tiên; các private HTML route production cũng noindex hoặc không thể truy cập anonymous, nhưng không bị `robots.txt` chặn trước khi bot đọc noindex.
3. Production có robots, sitemap, canonical, hreflang đúng và Search Console xác nhận fetch được.
4. Public job/company/article được SSR/ISR với nội dung và metadata riêng trong HTML ban đầu.
5. Public SEO API không lộ PII/private data, có contract test.
6. Job lifecycle xử lý publish/update/expiry đúng trong page, sitemap, schema và cache.
7. JobPosting validation sạch với mẫu dữ liệu production thật.
8. Core Web Vitals, logs, alerting và rollback runbook hoạt động.
9. Release được deploy từ immutable artifact đã soak trên staging (7 ngày cho release lớn hiện tại) và migration rehearsal pass.
10. `/` redirect một hop tới `/vi`; không còn duplicate locale/legacy job URL indexable.
11. Dashboard theo dõi organic/crawl/conversion có owner chịu trách nhiệm vận hành.
