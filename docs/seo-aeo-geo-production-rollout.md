# Kế hoạch SEO, AEO/GEO và phát hành domain production

**Trạng thái:** Kế hoạch triển khai — **bị chặn bởi Phase 0**, chưa được deploy
**Ngày audit ban đầu:** 2026-09-02
**Ngày đối chiếu mã nguồn:** 2026-09-02 (xem §2.3 — một số dòng audit ban đầu đã được sửa)
**Phạm vi:** `upnext-frontend`, `upnext-be`, `upnext-infra`, nội dung/publication
**Vị trí tài liệu:** `upnext-frontend/docs` vì đây là nơi triển khai phần SEO public chính; các hạng mục Infra/Backend vẫn có owner riêng bên dưới.
**Domain production mục tiêu:** `https://upnext.works`
**Domain staging:** `https://staging.upnext.works`

> **Cách đọc tài liệu này.** Mỗi hạng mục actionable đều có đường dẫn file cụ thể và trạng thái
> hiện tại đã được kiểm chứng bằng mã nguồn. Nếu một dòng nói "chưa có", nghĩa là đã grep và
> không tìm thấy — không phải phỏng đoán. Những chỗ chưa kiểm chứng được bằng mã nguồn đều
> được đánh dấu **[cần đo lại]**.

---

## 0. Phase 0 — Ba điểm chặn phải gỡ trước khi bắt đầu bất kỳ workstream nào

Kế hoạch bản đầu không thể bắt đầu như đã viết. Ba mục dưới đây không phải "việc khó", mà là
**mâu thuẫn nội tại**: làm đúng theo tài liệu sẽ thất bại vì thực tế mã nguồn khác với giả định.

### P0-1. Quy trình "promote cùng image digest" hiện KHÔNG khả thi với frontend

**Giả định của kế hoạch (§5 A3 bước 3 và 6, DoD #9):** build một artifact, deploy digest đó lên
staging, soak, rồi deploy **chính digest đó** lên production.

**Thực tế:**

- `upnext-frontend/Dockerfile` dòng 10–19 nhận `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_API_BASE_URL`,
  `NEXT_PUBLIC_SOCKET_URL` làm **build ARG** và `ENV` trong stage `builder`.
- `.github/workflows/docker-publish.yml` truyền giá trị **khác nhau theo nhánh**:
  `develop` → `https://api-staging.upnext.works/api/v1`, `main` → `https://api.upnext.works/api/v1`.
- `NEXT_PUBLIC_*` được Next.js **inline vào client bundle lúc build**. Đặt lại chúng ở runtime
  qua `env_file` không có tác dụng với mã chạy trên trình duyệt.

Hệ quả: image staging và image production là **hai build khác nhau, từ hai commit khác nhau**.
Promote digest staging sang production sẽ khiến website production gọi API staging. Bước A3 và
DoD #9 không thể thực hiện được, và cũng không thể "đánh dấu hoàn thành" một cách trung thực.

**Quyết định bắt buộc — chọn một trước khi bắt đầu:**

**Phương án A (khuyến nghị): build một lần, cấu hình origin ở runtime.**

Codebase đã hỗ trợ sẵn phần lớn đường này:

- `src/shared/lib/env.ts` dòng 4 cho phép `NEXT_PUBLIC_API_BASE_URL` là **đường dẫn tương đối** và
  mặc định đúng bằng `/api/v1`. `.env.example` dòng 1 cũng dùng giá trị này.
- `next.config.ts` `rewrites()` đã map `/api/v1/:path*` → `API_PROXY_ORIGIN`, là biến **server-only,
  đọc lúc runtime**.

Việc cần làm:

1. Đổi build args trong `docker-publish.yml` và ARG mặc định trong `Dockerfile` thành
   `NEXT_PUBLIC_API_BASE_URL=/api/v1` và `NEXT_PUBLIC_SOCKET_URL=` (rỗng).
2. Đặt `API_PROXY_ORIGIN` trong `env/frontend.prod.env` và `env/frontend.staging.env`.
3. `getSocketBaseUrl()` (`src/features/chat/socket/chat-socket.ts`) đã fallback về
   `window.location.origin` khi `NEXT_PUBLIC_SOCKET_URL` rỗng — nên **nginx phải thêm
   `location /socket.io/` proxy sang backend** cho cả hai host. Hiện `location /` proxy toàn bộ
   sang frontend (:3000/:3100), nên nếu bỏ `NEXT_PUBLIC_SOCKET_URL` mà không thêm route này,
   **chat sẽ hỏng**. Đây là dependency cứng, không được bỏ qua.
4. Bỏ nhánh `if main / elif develop` sinh URL trong workflow; giữ nguyên phần sinh tag.

Chi phí: một PR frontend nhỏ + một PR infra (nginx). Đổi lại A3, DoD #9 và toàn bộ mô hình
release trở nên thực hiện được.

**Phương án B (fallback): bỏ yêu cầu cùng-digest cho frontend.**

Sửa A3 và DoD #9 thành: "cùng **commit SHA**, hai digest riêng cho staging/production, cả hai
digest đều được ghi lại trong deploy log". Rẻ hơn nhưng **soak trên staging không còn chứng minh
được artifact production** — client bundle khác nhau. Nếu chọn B, phải viết rõ giới hạn này vào
§16 thay vì để DoD hứa điều không kiểm chứng được.

**Không được chọn "để sau".** Mọi mốc release trong §13 phụ thuộc vào quyết định này.

### P0-2. Frontend KHÔNG có `middleware.ts` — hướng dẫn B3 tham chiếu thứ không tồn tại

**Giả định của kế hoạch (§6 B3):** "Sửa matcher i18n để các route đặc biệt này không bị coi là
locale (`robots.txt`, `sitemap.xml`, manifest, favicon, `_next`, API)."

**Thực tế:** không có `middleware.ts` hay `middleware.js` ở bất kỳ đâu trong repo
(`git ls-files | grep -i middleware` → rỗng). next-intl đang chạy **không có middleware**:

- `src/i18n/routing.ts` đặt `localeDetection: false`;
- phân giải locale bằng segment `[locale]` + `getRequestConfig` trong `src/i18n/request.ts`;
- `/` → `/vi` do `src/app/(root)/page.tsx` gọi `redirect()`, không phải middleware.

**Hệ quả tích cực:** `src/app/robots.ts` và `src/app/sitemap.ts` sẽ hoạt động ngay, **không cần
sửa matcher nào cả**. B3 nhẹ hơn kế hoạch mô tả.

**Hệ quả tiêu cực — quan trọng hơn:** dòng audit `hreflang: "Có HTTP Link cơ bản cho vi, en,
x-default"` **không thể do codebase này sinh ra**. Header `Link: <...>; rel="alternate";
hreflang="..."` là do **middleware của next-intl** phát; không có middleware thì không có header
đó. Dòng audit này hoặc đo nhầm, hoặc đo trên một deployment khác.

**[cần đo lại]** trước khi ai đó coi hreflang "đã có baseline". Lệnh kiểm chứng:

```bash
curl -sI https://staging.upnext.works/vi | grep -i '^link:'
curl -sI https://upnext.works/vi | grep -i '^link:'
```

Nếu rỗng: hreflang phải làm **từ đầu** bằng `alternates.languages` trong `generateMetadata`
(§6 B5), không có gì để "hoàn thiện".

### P0-3. Dòng audit `/` và `/vi` cùng trả 200 mâu thuẫn với mã nguồn

**Giả định của kế hoạch (§2):** "Cả `/` và `/vi` hiện trả cùng homepage 200. Nếu mở index như
hiện trạng, đây là duplicate URL."

**Thực tế:** `src/app/(root)/page.tsx` đã redirect:

```ts
export default function RootPage() {
  redirect(`/${routing.defaultLocale}`);
}
```

`redirect()` của Next App Router trả **HTTP 307 (tạm thời)**, không phải 200 và cũng không phải
**308 (vĩnh viễn)** mà §6 B2.1 yêu cầu.

Vấn đề vẫn có thật, nhưng bản chất khác: không phải "thiếu redirect" mà là **sai loại redirect**.
Sửa đúng là đổi sang `permanentRedirect()` từ `next/navigation` — một dòng, không phải một hạng
mục kiến trúc.

**[cần đo lại]** `curl -sI https://staging.upnext.works/` để xác nhận status thực tế trên
deployment đang chạy (có thể đang chạy image cũ hơn commit này).

---

## 1. Quyết định kiến trúc bắt buộc

Không dùng `staging.upnext.works` làm domain SEO lâu dài.

| Môi trường                | Mục đích                     | Lập chỉ mục                                   | Canonical                                                  | Sitemap                                           |
| ------------------------- | ---------------------------- | --------------------------------------------- | ---------------------------------------------------------- | ------------------------------------------------- |
| `staging.upnext.works`    | QA/UAT release candidate     | **Không** (`X-Robots-Tag: noindex, nofollow`) | Self-canonical để QA; không canonical chéo sang production | Có thể sinh để test, nhưng không advertise/submit |
| `preview.*` (nếu bổ sung) | Kiểm thử theo PR/release     | Không                                         | Self-canonical hoặc không có                               | Không advertise/submit                            |
| `upnext.works`            | Website công khai chính thức | Có, sau release gate                          | Chính nó                                                   | Sitemap production duy nhất                       |
| `www.upnext.works`        | Không phải host public       | Không (301 sang apex)                         | Không tự sinh canonical                                    | Không có sitemap riêng                            |

### Lý do

1. Search engine cần một domain chủ đạo, ổn định và có URL bền vững.
2. Staging thay đổi liên tục, có thể chứa dữ liệu test, tính năng chưa duyệt và không phù hợp để tích luỹ tín hiệu tìm kiếm.
3. Nếu index staging trước rồi mới chuyển domain, đội ngũ phải xử lý migration, duplicate content, redirect và tín hiệu SEO bị phân tán.
4. `upnext.works` hiện phải được đưa từ placeholder sang đúng artifact đã qua staging; không mở index trước thời điểm này.

> Không dùng `robots.txt` để thực hiện `noindex`. Bot phải truy cập được trang để đọc `noindex`; vì vậy staging dùng HTTP header hoặc metadata được render từ server. Tham khảo: [Google noindex guidance](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

---

## 2. Kết quả audit hiện trạng

### 2.1. Đo qua HTTP (2026-09-02)

| Hạng mục                    | `staging.upnext.works`              | `upnext.works`           | Mức độ                                           |
| --------------------------- | ----------------------------------- | ------------------------ | ------------------------------------------------ |
| Trang chủ `/vi`             | 200, có title/description/H1        | 200 nhưng là placeholder | Blocker production                               |
| Jobs, companies, posts      | Có trên staging                     | 404 trên production      | Blocker production                               |
| `/robots.txt`               | 404                                 | 404                      | P0                                               |
| `/sitemap.xml`              | 404                                 | 404                      | P0                                               |
| `rel=canonical`             | Không có                            | Không có                 | P0                                               |
| JSON-LD                     | Không có                            | Không có                 | P1                                               |
| Metadata jobs/companies     | Dùng title/description chung        | Không có route thật      | P1                                               |
| HTML ban đầu jobs/companies | Không có H1/nội dung chính          | —                        | P1                                               |
| `hreflang`                  | **[cần đo lại]** — xem P0-2         | **[cần đo lại]**         | Coi như chưa có                                  |
| Cache HTML                  | `s-maxage=31536000`                 | `s-maxage=31536000`      | P1 — xem 2.3, nguyên nhân khác với mô tả ban đầu |
| `/` → `/vi`                 | **[cần đo lại]** — mã nguồn trả 307 | **[cần đo lại]**         | P1, sửa 1 dòng                                   |

### 2.2. Đối chiếu mã nguồn — đã kiểm chứng

Mọi dòng dưới đây có đường dẫn file cụ thể và đã được grep xác nhận.

| Phát hiện                                                                                       | Bằng chứng                                                                                                                       |
| ----------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Không có `robots.ts`, `sitemap.ts`, và cũng không có `public/robots.txt`, `public/sitemap.xml`  | `find src -name "robots.*" -o -name "sitemap.*"` → rỗng; `ls public/` → chỉ có `manifest.webmanifest`                            |
| `generateMetadata` chỉ tồn tại ở **4 file**                                                     | `[locale]/layout.tsx`, `(public)/pricing/page.tsx`, `(public)/posts/page.tsx`, `(public)/posts/[slug]/page.tsx`                  |
| **0 chỗ** dùng `metadataBase`, `alternates`, hay canonical                                      | grep toàn `src/`                                                                                                                 |
| **0 chỗ** có JSON-LD                                                                            | grep `application/ld+json` toàn `src/`                                                                                           |
| Job detail là **client component** — không SSR nội dung lẫn metadata                            | `src/features/public/jobs/jobs-route.tsx` dòng 1: `"use client"`                                                                 |
| Route job truyền thẳng param xuống client                                                       | `src/app/[locale]/(public)/jobs/[slug]/page.tsx` → `<JobDetailRoute slug={slug} />` → `PublicJobDetailPage path={/jobs/${slug}}` |
| Không có `middleware.ts`                                                                        | `git ls-files \| grep -i middleware` → rỗng. Xem P0-2                                                                            |
| **Hai root layout cùng render `<html>`**                                                        | `src/app/[locale]/layout.tsx` (có `generateMetadata`) và `src/app/(root)/layout.tsx` (chỉ `metadata` tĩnh: icons). Xem §6 B1     |
| `/conversations/chat` có title/description nhưng **không có `robots: noindex`**                 | `src/app/(root)/conversations/chat/page.tsx` dòng 5. Trang riêng tư, hiện crawl được                                             |
| **Cả ba** loại trang chi tiết public đều là client component                                    | `jobs-route.tsx`, `companies-route.tsx`, `posts-page-content.tsx`, `post-detail-content.tsx` — đều `"use client"` ở dòng 1       |
| `generateMetadata` của posts detail trả **chuỗi tĩnh theo locale**, giống hệt nhau cho mọi bài  | `posts/[slug]/page.tsx` trả `postCopy[locale].metadata.detailTitle` — có metadata ≠ có metadata riêng cho từng bài               |
| Không có `(workspace)/layout.tsx`                                                               | chỉ có `admin/`, `candidate/`, `recruiter/layout.tsx` riêng lẻ. Ảnh hưởng chỗ đặt `noindex` — xem §6 B2                          |
| Job detail lấy id từ **segment thứ 2 của path** rồi gọi API                                     | `job-detail-page.tsx` `getJobId(path)` dòng 170 → backend validate UUID, nên segment đó là UUID chứ không phải slug              |
| Chỉ có 1 API route: proxy                                                                       | `src/app/api/v1/[...proxy]/route.ts`. **Chưa có endpoint revalidate** — xem §7 C4                                                |
| Không có `src/app/not-found.tsx` ở root, trong khi `experimental.globalNotFound: true` đang bật | chỉ có `src/app/[locale]/not-found.tsx`; `next.config.ts` dòng ~20                                                               |
| `public/mockServiceWorker.js` (artifact dev của MSW) được ship vào image production             | `Dockerfile` copy nguyên `public/`                                                                                               |

Backend:

| Phát hiện                                                                                               | Bằng chứng                                                                                                      |
| ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `GET /job-posts` (public list) **không có phân trang** — trả về toàn bộ job đã publish kèm full include | `job-posts.service.ts` `findAll()` không có `take`/`skip`; `PublicJobPostQueryDto` chỉ có `keyword`, `location` |
| `GET /job-posts/:id` dùng `ParseUUIDPipe` — **không có endpoint tra cứu theo slug**                     | `job-posts.controller.ts`                                                                                       |
| `GET /companies/:idOrSlug` **đã hỗ trợ slug**                                                           | `companies.controller.ts` dòng ~120–126                                                                         |
| Response company detail chứa field không nên dùng cho SEO/public render                                 | `companies.service.ts`, xem §7 C1                                                                               |

Infra:

| Phát hiện                                                                                                                                                                                                                                     | Bằng chứng                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `upnext.works` và `www.upnext.works` nằm **cùng một server block**, cùng proxy `:3000` → cả hai trả 200, không có redirect canonical                                                                                                          | `nginx/conf.d/upnext.works.conf` dòng 4                                                    |
| Conf trong repo chỉ có `listen 80` — bản chạy thật trên VPS đã được certbot ghi đè để thêm 443. **Sửa file trong repo không đồng nghĩa sửa file đang chạy**                                                                                   | so sánh `nginx/conf.d/*.conf` với `README.md` bước certbot                                 |
| Compose dùng **tag động**, không dùng digest                                                                                                                                                                                                  | `env/compose.env.example`: `FRONTEND_IMAGE_TAG=production`, `BACKEND_IMAGE_TAG=production` |
| `env/frontend.*.env.example` đang set `NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_API_URL` ở **runtime** — nhưng `NEXT_PUBLIC_*` inline lúc build và `src/shared/lib/env.ts` **không đọc** ba biến này. Đây là **dead config** | đối chiếu `env/frontend.prod.env.example` với `src/shared/lib/env.ts`                      |
| Không có `location /socket.io/` trong nginx                                                                                                                                                                                                   | grep toàn `nginx/` → rỗng. Xem P0-1 phương án A bước 3                                     |

### 2.3. Ba dòng audit ban đầu cần sửa cách hiểu

1. **`s-maxage=31536000` không phải lỗi cấu hình, và chỉ đúng với một nửa số trang.** Giá trị này
   không xuất hiện ở bất kỳ đâu trong `next.config.ts`, mã nguồn, hay nginx. Đây là
   **`Cache-Control` mặc định Next.js phát cho trang được prerender tĩnh**.

   Chạy `pnpm build` trên commit hiện tại cho thấy hai nhóm khác hẳn nhau:

   | Route                        | Chế độ build | Hệ quả cache hiện tại                     |
   | ---------------------------- | ------------ | ----------------------------------------- |
   | `/[locale]` (trang chủ)      | `●` SSG      | `s-maxage=31536000` — cache một năm       |
   | `/[locale]/jobs`             | `●` SSG      | như trên                                  |
   | `/[locale]/companies`        | `●` SSG      | như trên                                  |
   | `/[locale]/jobs/[slug]`      | `ƒ` Dynamic  | **không cache gì cả**, render mọi request |
   | `/[locale]/companies/[slug]` | `ƒ` Dynamic  | như trên                                  |
   | `/[locale]/posts/[slug]`     | `ƒ` Dynamic  | như trên                                  |

   Nghĩa là có **hai vấn đề ngược nhau**, không phải một: trang danh sách cache quá lâu, trang
   chi tiết không cache gì. Cả hai đều được ISR ở §6 B4 giải quyết, nhưng đừng mô tả chúng như
   cùng một triệu chứng.

   **Không được "sửa" bằng cách thêm `add_header Cache-Control` ở nginx**; làm vậy sẽ che triệu
   chứng và phá luôn cache của asset tĩnh.

2. **Slug không phải "chưa có".** Xem §7 C3 — trạng thái thực tế khác nhau theo từng entity, và
   phần việc thực sự hẹp hơn nhưng cụ thể hơn mô tả ban đầu.

3. **`/` không trả 200.** Xem P0-3.

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

- `/admin/**`, `/candidate/**`, `/recruiter/**`
- `/conversations/**` — lưu ý route thật là `/conversations/chat` **không có locale prefix**
  (`src/app/(root)/conversations/chat/page.tsx`), cùng nhóm với `/auth/callback`
- login/register/callback/reset-password/email-verification/portal-access
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

### 4.4 Quyết định hreflang cho nội dung do người dùng tạo

Kế hoạch bản đầu nêu nguyên tắc "không khai báo equivalent nếu chưa có bản dịch thật" nhưng
không ra quyết định. Quyết định:

- **Job và company: chỉ index locale `vi`.** JD do recruiter Việt Nam nhập, gần như luôn là tiếng
  Việt. Khai báo `/en/jobs/{slug}` là bản tương đương của `/vi/jobs/{slug}` trong khi nội dung
  y hệt tiếng Việt là khai báo sai. `/en/jobs/{slug}` vẫn truy cập được (UI tiếng Anh, nội dung
  gốc) nhưng đặt `robots: noindex` và **không** khai báo trong `alternates.languages`.
- **Post: index cả hai locale** chỉ khi bài thực sự có bản dịch; nếu không, chỉ index locale gốc.
- **Trang khung (home, jobs list, companies list, pricing): index cả `vi` và `en`**, hreflang đầy
  đủ hai chiều + `x-default` → `/vi`.

Quyết định này phải được phản ánh trong helper SEO (§6 B1), sitemap (§6 B3) và test (§12).

---

## 5. Workstream A — Hạ tầng, domain và release

**Owner:** Infra + Release owner
**Ưu tiên:** P0
**Phụ thuộc:** P0-1 phải được quyết định trước A3

### A1. Biến môi trường và canonical host

Thêm cấu hình rõ ràng, **server-only**:

```text
PUBLIC_ORIGIN=https://upnext.works|https://staging.upnext.works
CANONICAL_ORIGIN=https://upnext.works        # chỉ được dùng khi production indexable
DEPLOY_ENV=production|staging
SEO_INDEXING_ENABLED=true|false
```

- **Bốn biến này KHÔNG được mang tiền tố `NEXT_PUBLIC_`.** `NEXT_PUBLIC_*` bị inline vào client
  bundle lúc build, nên đặt ở runtime là vô nghĩa — đúng vết xe đổ của
  `NEXT_PUBLIC_APP_ENV`/`NEXT_PUBLIC_APP_URL`/`NEXT_PUBLIC_API_URL` đang nằm chết trong
  `env/frontend.*.env.example` (§2.2).
- **Chỉ được đọc trong Server Component / route handler**, không bao giờ import vào file có
  `"use client"`. Thêm một test chặn hồi quy cho ràng buộc này (§12).
- Không suy luận production từ `NODE_ENV` (cả hai môi trường đều `NODE_ENV=production`).
- Staging phải có `SEO_INDEXING_ENABLED=false`.
- Production chỉ có `SEO_INDEXING_ENABLED=true` sau release gate.
- Staging dùng `PUBLIC_ORIGIN` của chính staging nếu cần self-canonical để QA; không được emit canonical production trong khi production còn placeholder hoặc nội dung không tương đương.
- Client không được tự thêm/xóa robots meta sau hydration; robots state phải có trong response HTML/header đầu tiên.

Cập nhật kèm theo: `env/frontend.prod.env.example`, `env/frontend.staging.env.example` trong
`upnext-infra` — thêm 4 biến trên, **xoá 3 biến `NEXT_PUBLIC_*` đã chết**, thêm `API_PROXY_ORIGIN`
nếu chọn P0-1 phương án A.

### A2. Nginx/header policy

- `staging.upnext.works`: gửi `X-Robots-Tag: noindex, nofollow` cho HTML và các file có nguy cơ index.
- Production placeholder: cũng gửi `noindex` cho đến ngày launch.
- Production launch: bỏ header site-wide `noindex`; giữ noindex theo route private từ Next response/layout.
- **Bẫy nginx bắt buộc biết:** `add_header` **không kế thừa** — thêm bất kỳ `add_header` nào vào
  `location /` sẽ **huỷ toàn bộ** `add_header` ở cấp `server`, tức 5 header trong
  `snippets/security-headers.conf` biến mất im lặng. Vì vậy `X-Robots-Tag` phải đặt **cùng cấp**
  với các header kia — thêm vào `security-headers.conf` (có điều kiện theo host) hoặc lặp lại
  đủ cả 6 header trong `location`. Sau khi sửa, verify bằng `curl -I` rằng **cả 6** header còn đủ.
- **Tách `www`:** hiện `upnext.works` và `www.upnext.works` dùng chung một server block. Tách
  thành block riêng cho `www` trả `return 301 https://upnext.works$request_uri;`.
- Nếu chọn P0-1 phương án A: thêm `location /socket.io/ { proxy_pass http://127.0.0.1:4000; }`
  (staging: `:4100`) kèm `proxy-websocket.conf`, cho cả hai host.
- Không gửi header khác nhau cho bot bằng user-agent (không cloaking).
- HTTPS, host redirect và trailing-slash policy phải nhất quán; chỉ có một host public (`https://upnext.works`).
- **Lưu ý quy trình:** file conf trong repo chỉ có `listen 80`; bản đang chạy trên VPS đã được
  certbot ghi đè để thêm block 443. Mọi thay đổi phải được áp lên **file thật trên VPS** rồi
  `nginx -t && systemctl reload nginx`, và đồng bộ ngược lại repo — không chỉ sửa repo.
- Hoàn tất recovery Uptime Kuma, Beszel và agent restart trước release; release gate phải kiểm tra synthetic health, container health và alert delivery chứ không chỉ kiểm tra `docker ps`.
- Xác minh bằng Search Console liệu staging đã có URL/index/impression hay chưa. Nếu có, để crawler đọc `noindex`, theo dõi Page Indexing và dùng Removal tool khi cần khẩn cấp; chỉ dùng 301 staging → production khi staging thực sự được ngừng dùng làm môi trường test và có mapping URL tương đương.

### A3. Artifact promotion

**Điều kiện tiên quyết: P0-1 đã được quyết định.** Các bước dưới đây viết theo **phương án A**.
Nếu chọn phương án B, sửa bước 3 và 6 thành "cùng commit SHA, hai digest, ghi cả hai vào log" và
sửa DoD #9 tương ứng.

1. Tạo release branch/tag từ commit đã code-freeze.
2. CI build frontend/backend với tag bất biến `sha-<commit>` và **ghi lại image digest** vào
   output của workflow.
3. Deploy **cùng digest** đó lên staging.
4. Chạy quality gate và soak window.
5. Merge/fast-forward release commit vào `main` theo chiến lược không tạo source khác với artifact đã test; hoặc promote chính digest đã test qua release tag.
6. Deploy production đúng digest, không dùng `develop`, `main`, `latest`, `production` làm giá trị triển khai duy nhất.

Thay đổi cụ thể cần làm:

- `env/compose.env.example` và `.env` trên VPS: đổi `FRONTEND_IMAGE_TAG=production` →
  `FRONTEND_IMAGE_TAG=sha-<commit>` (hoặc dùng dạng `image: ...@sha256:<digest>` trong compose).
- `docker-publish.yml`: xuất digest ra `$GITHUB_OUTPUT` và đưa vào Telegram notify để có audit trail.

### A4. Migration guard

- Restore backup production vào DB cô lập và chạy toàn bộ migration của release candidate.
- Ghi nhận migration nào destructive, lock lâu, backfill lớn hoặc không rollback được.
  **Migration đổi format slug job (§7 C3) thuộc nhóm backfill lớn** — phải đo thời gian trên bản
  restore trước.
- Đảm bảo backend mới tương thích với frontend cũ trong giai đoạn deploy; nếu không, dùng maintenance plan rõ ràng.
- Backup production trước migration; test restore; có owner và thời hạn quyết định rollback.

### Acceptance A

- `curl -I https://staging.upnext.works/vi` có `X-Robots-Tag: noindex` **và vẫn đủ 5 header bảo mật cũ**.
- `curl -I https://www.upnext.works/vi` trả 301 về `https://upnext.works/vi`.
- Production chỉ bỏ noindex sau khi product routes thật trả 200.
- Deploy log có commit SHA, image digest, tag hiện tại và tag rollback.
- Monitoring/alerting healthy trước release.
- Nếu chọn P0-1 phương án A: chat hoạt động trên cả staging và production sau khi bỏ
  `NEXT_PUBLIC_SOCKET_URL` (test thủ công gửi/nhận tin nhắn realtime).

---

## 6. Workstream B — Technical SEO trong frontend

**Owner:** Frontend
**Ưu tiên:** P0/P1

### B1. Metadata framework tập trung

Tạo helper **server-only**, ví dụ `src/shared/seo/`, chịu trách nhiệm:

- đọc `PUBLIC_ORIGIN`, `CANONICAL_ORIGIN`, `DEPLOY_ENV`, `SEO_INDEXING_ENABLED`;
- sinh canonical URL tuyệt đối;
- sinh metadata locale-aware;
- sinh Open Graph/Twitter;
- sinh `robots` cho page public/private;
- kiểm tra dữ liệu trống/unsafe trước khi vào `<head>`.

Đặt `import "server-only"` ở đầu file để build fail ngay nếu bị import vào client component.

> **Repo này có HAI root layout, không phải một.** Cả hai đều render `<html>`:
>
> - `src/app/[locale]/layout.tsx` — phục vụ mọi route có locale, đã có `generateMetadata`;
> - `src/app/(root)/layout.tsx` — phục vụ các route **không** có locale (`/auth/callback`,
>   `/conversations/chat`), `<html lang>` hardcode `defaultLocale`, chỉ có `metadata` tĩnh gồm
>   icons và **không có robots**.
>
> Cấu hình SEO chỉ ở `[locale]/layout.tsx` sẽ bỏ sót nhánh thứ hai. `/conversations/chat` hiện
> còn tự khai title/description riêng mà không có `noindex` — tức một trang riêng tư đang mời
> crawler vào.

Trong root locale layout (`src/app/[locale]/layout.tsx`, hiện đã có `generateMetadata`):

- đặt `metadataBase` là `PUBLIC_ORIGIN`; canonical production chỉ sinh khi `SEO_INDEXING_ENABLED=true`;
- title template nhất quán, ví dụ `%s | UpNext`;
- `alternates.languages` theo quyết định §4.4, không khai báo bừa;
- có Organization/WebSite schema tối thiểu ở domain production.

### B2. Metadata theo route

| Route                 | Title/description                            | Canonical | Robots                                             |
| --------------------- | -------------------------------------------- | --------- | -------------------------------------------------- |
| Home                  | Theo locale, value proposition rõ            | Self      | index, follow (production)                         |
| Jobs list             | `Việc làm IT tại Việt Nam – UpNext`          | Self      | index nếu trang gốc; filtered URL noindex mặc định |
| Job detail (`vi`)     | Job + company + location                     | Self      | index khi job đang mở                              |
| Job detail (`en`)     | Như trên                                     | Self      | **noindex** (§4.4)                                 |
| Companies list        | `Công ty công nghệ đang tuyển dụng – UpNext` | Self      | index trang gốc                                    |
| Company detail (`vi`) | Company + việc làm/văn hóa                   | Self      | index khi đủ điều kiện                             |
| Company detail (`en`) | Như trên                                     | Self      | **noindex** (§4.4)                                 |
| Post                  | Tiêu đề/summary/author/date thật             | Self      | index khi published (locale có bản dịch thật)      |
| Workspace/auth/API    | Không cần social/meta công khai              | Không     | noindex, nofollow                                  |

Không dùng một title/description chung cho job/company/post detail. **Posts detail hiện đang vi
phạm đúng điều này**: `posts/[slug]/page.tsx` có `generateMetadata` nhưng trả
`postCopy[locale].metadata.detailTitle` — một chuỗi tĩnh giống hệt nhau cho mọi bài viết. Có
`generateMetadata` không có nghĩa là hạng mục này đã xong; nó phải fetch bài thật rồi sinh
title/description riêng cho từng bài.

**Đặt `robots: noindex` ở đâu — bản đồ cụ thể.** Không có `(workspace)/layout.tsx`, nên không có
một chỗ duy nhất chặn được cả khu vực riêng tư. Năm nơi phải xử lý:

| Nơi                                         | Che phủ                                           |
| ------------------------------------------- | ------------------------------------------------- |
| `[locale]/(workspace)/admin/layout.tsx`     | `/admin/**`                                       |
| `[locale]/(workspace)/candidate/layout.tsx` | `/candidate/**`                                   |
| `[locale]/(workspace)/recruiter/layout.tsx` | `/recruiter/**`                                   |
| `[locale]/(auth)/layout.tsx`                | login, register, reset-password, portal-access, … |
| `(root)/layout.tsx`                         | `/auth/callback`, `/conversations/chat`           |

Gọn hơn thì tạo `[locale]/(workspace)/layout.tsx` để gộp ba dòng đầu; nhưng đừng giả định nó đã
tồn tại.

### B2.1. Default locale và duplicate URL

- Đổi `src/app/(root)/page.tsx` từ `redirect()` sang **`permanentRedirect()`** (`next/navigation`)
  để `/` → `/vi` trả **308** thay vì 307 (xem P0-3).
- `x-default` phải trỏ tới URL ổn định đó (`/vi`), không trỏ tới một homepage duplicate.
- Chuẩn hoá slash, lowercase và legacy ID/slug redirects bằng một redirect hop duy nhất.
- Test một bảng URL gồm `/`, `/vi`, `/en`, URL có slash cuối, `www.`, và legacy job URL (UUID) để
  không tạo redirect chain/loop.

### B2.2. Trang 404

- `experimental.globalNotFound: true` đang bật nhưng **không có `src/app/not-found.tsx`** ở root.
  Bổ sung file này, và verify đường dẫn không khớp locale (ví dụ `/khong-ton-tai`) trả **HTTP 404
  thật**, không phải 200 với nội dung 404.
- Xoá `error404.html` ở root repo nếu không còn dùng (hiện đang được git track nhưng không có
  route nào tham chiếu).

### B3. `robots.ts` và `sitemap.ts`

- Tạo `src/app/robots.ts` và `src/app/sitemap.ts` (hoặc sitemap index).
- **Không cần sửa matcher i18n** — repo không có middleware (P0-2).
- **Đã kiểm chứng bằng build thật, không phải suy đoán.** Tạo thử `src/app/robots.ts` và
  `src/app/sitemap.ts` rồi chạy `pnpm build` trên commit hiện tại: build thành công (exit 0) và
  bảng route liệt kê

  ```txt
  ├ ○ /robots.txt
  └ ○ /sitemap.xml
  ```

  `○` = static. Artifact có thật trên đĩa (`.next/server/app/robots.txt.body`, cả trong
  `.next/standalone/`) với đúng nội dung mong đợi. Segment `[locale]` **không** nuốt hai route
  này — metadata file convention của Next được khớp trước dynamic segment. Hai file thử nghiệm
  đã được xoá sau khi đo.

- Production robots nêu rõ sitemap canonical. Chỉ `Disallow` các endpoint không-HTML/không cần crawl; với route HTML private dùng authentication/redirect hoặc HTTP/meta `noindex` **nhưng không đồng thời chặn bằng robots**, để bot có thể đọc noindex nếu URL đã từng bị phát hiện:

```text
User-agent: *
Allow: /
Disallow: /api/
Sitemap: https://upnext.works/sitemap.xml
```

- Khi `SEO_INDEXING_ENABLED=false`, `robots.ts` trả `Disallow: /` **và** header `X-Robots-Tag`
  vẫn phải có ở nginx — hai lớp độc lập, không thay thế nhau.
- Không đưa staging URL vào sitemap production.
- **Giới hạn bắt buộc tuân thủ:** mỗi sitemap tối đa **50.000 URL** và **50 MB** khi giải nén.
  Dùng sitemap index chia `static`, `jobs`, `companies`, `posts` ngay từ đầu để không phải
  refactor khi vượt ngưỡng.
- `lastmod` lấy từ `updatedAt` của entity, không phải thời điểm build.

### B4. SSR/ISR thay cho client-only content

Các route indexable phải fetch read model ở Server Component và render:

- H1;
- nội dung chính/job description;
- link nội bộ có `href`;
- metadata;
- JSON-LD;
- trạng thái 404/expired.

**Cả ba** loại trang chi tiết public hiện đều là client component, không chỉ jobs:
`jobs-route.tsx`, `companies-route.tsx`, `posts-page-content.tsx`, `post-detail-content.tsx` —
tất cả đều `"use client"` ở dòng 1. Cả ba phải được tách: phần fetch + metadata + JSON-LD lên
Server Component, phần tương tác (filter, save job, apply modal) giữ ở client.

Điểm xuất phát khác nhau theo route, đo bằng `pnpm build` trên commit hiện tại:

- `/[locale]/jobs` và `/[locale]/companies` là `●` SSG — đang bị cache một năm (§2.3);
- `/[locale]/jobs/[slug]`, `/[locale]/companies/[slug]`, `/[locale]/posts/[slug]` là `ƒ` Dynamic
  — đã server-render mỗi request nhưng **không cache gì**, và vẫn không có nội dung trong HTML
  vì component con là client.

Nên với trang chi tiết, việc cần làm không phải "chuyển từ static sang dynamic" (đã dynamic rồi)
mà là **đưa dữ liệu lên Server Component và thêm `revalidate`**. Đây là hạng mục **tốn công
nhất** của workstream B; ước lượng riêng cho nó khi lập lịch.

> **Chặn:** nội dung JD hiện **không được sanitize** ở cả backend lẫn frontend (xem §8 D3).
> SSR chuỗi đó vào response của server mở rộng bề mặt stored-XSS so với render client hiện tại.
> Phải có PR sanitize trước khi merge B4.

Không chỉ dựa vào React Query/client hydration. Google có thể render JavaScript, nhưng SSR/ISR giúp metadata và nội dung chính có sẵn ngay từ response, ổn định hơn cho crawl và AEO.

Cache bắt buộc theo vòng đời dữ liệu:

- job detail/list: ISR ngắn (ví dụ 5–15 phút) + `revalidateTag` khi publish/update/expire;
- company: 30–60 phút + invalidation khi profile/job đổi;
- article: revalidate khi publish/update;
- không cache một năm HTML metadata/job có thể hết hạn.

**Ràng buộc vận hành của ISR trong setup hiện tại:**

- `next.config.ts` đặt `output: "standalone"`; ISR cache nằm trên filesystem container
  (`.next/cache`), **không có volume** trong `compose/docker-compose.*.yml`.
- `scripts/deploy/deploy.sh` chạy `up -d --no-deps --force-recreate` → **cache ISR bị xoá sạch sau
  mỗi lần deploy**. Chấp nhận được (cache nguội, tự ấm lại), nhưng phải biết trước để không
  hoảng khi thấy latency tăng ngay sau deploy.
- Chỉ có **1 replica frontend** mỗi môi trường, nên `revalidateTag` từ webhook chắc chắn trúng
  đúng process đang phục vụ. Nếu sau này scale lên nhiều replica, mô hình này **sẽ hỏng** và cần
  shared cache handler — ghi lại như một giả định có điều kiện.

### B5. Hreflang và translation integrity

- Áp dụng quyết định §4.4.
- Với URL được index ở cả hai locale: link ngược đầy đủ tới chính nó và bản tương đương.
- `x-default` trỏ về `/vi`.
- Không redirect bot theo `Accept-Language`; URL locale phải cố định.
- **Điều kiện phụ:** `messages/vi.json` và `messages/en.json` hiện lệch **19 key** (vi có, en
  thiếu — nhóm `Admin.content.jobs.details.*` và `Admin.dashboard.*`). Đây là namespace admin nên
  không chặn SEO public, nhưng phải đóng trước khi tuyên bố "hai locale tương đương" ở bất kỳ
  đâu. `AGENTS.md` đã ghi: chưa có kiểm tra parity tự động.

### Acceptance B

- Mỗi URL indexable có 1 title, 1 description, 1 canonical tuyệt đối, 1 H1 và 0 `noindex` trong production.
- HTML tải bằng `curl` (không phải DevTools) cho 10 job/company/article mẫu đã có nội dung chính và metadata riêng.
- Route private có noindex trước hydration.
- `robots.txt` và sitemap đều 200 từ root domain, không bị `[locale]` bắt nhầm.
- `/` trả 308 về `/vi`; `/khong-ton-tai` trả 404 thật.

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

**Phân trang: chỉ jobs thiếu, posts và companies đã có.** Đã kiểm từng module:

| Endpoint public  | Phân trang                               | Tra cứu theo slug                            |
| ---------------- | ---------------------------------------- | -------------------------------------------- |
| `GET /job-posts` | ❌ `findAll()` không có `take`/`skip`    | ❌ `GET /job-posts/:id` dùng `ParseUUIDPipe` |
| `GET /posts`     | ✅ `skip`/`take` từ `PaginationQueryDto` | ✅ `GET /posts/by-slug/:slug`                |
| `GET /companies` | ✅ `toPagination(query)`                 | ✅ `GET /companies/:idOrSlug`                |

Không được xây sitemap job trên `GET /job-posts` hiện tại: nó trả _toàn bộ_ job đã publish kèm
`publicJobPostInclude()` đầy đủ (company, skills, locations, specializations). Đây đã là rủi ro
latency ở hiện tại và sẽ sập khi số job tăng. Endpoint SEO mới phải có cursor pagination ngay từ
đầu, và thêm phân trang cho `GET /job-posts` là một hạng mục riêng.

Với posts và companies, read model SEO chủ yếu là việc **lọc field** (§C1) chứ không phải thêm
phân trang — nhẹ hơn jobs đáng kể.

### C2. Job lifecycle contract

Một job chỉ xuất hiện trong SEO endpoint và sitemap khi đồng thời:

- `PUBLISHED`;
- moderation `APPROVED`;
- company `ACTIVE`/đủ điều kiện public;
- không hidden/deleted;
- chưa `expiredAt`.

Điều kiện này **đã được cài đúng** trong `job-posts.service.ts` `findAll()`/`findOne()` — tái sử
dụng nguyên vẹn predicate đó cho read model SEO, đừng viết lại (nguy cơ lệch).

Khi job expire/hide/reject/delete:

1. bỏ khỏi SEO listing và sitemap;
2. invalidation page/list cache;
3. page trả 404/410 theo policy thống nhất hoặc render closed page `noindex` không có JobPosting;
4. gửi `URL_UPDATED`/`URL_DELETED` qua Google Indexing API nếu được uỷ quyền; API này chỉ dùng cho `JobPosting` hợp lệ, không dùng cho company/article/general pages.

Google chỉ cho JobPosting trên một trang đại diện cho đúng một job, phải có cách ứng tuyển, và yêu cầu xử lý job hết hạn nhanh. [Google JobPosting documentation](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

### C3. Slug và redirects — trạng thái thực tế theo từng entity

Kế hoạch bản đầu viết "Thêm/chuẩn hoá SEO slug unique". Thực tế slug **đã tồn tại**, nhưng mức độ
hoàn thiện khác nhau:

| Entity    | Cột slug                      | Bất biến khi sửa nội dung                                                                                   | Tra cứu public theo slug                     | Lịch sử slug (301)                            |
| --------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------------------- |
| `JobPost` | ✅ `@unique @db.VarChar(220)` | ✅ chỉ set lúc `create`; `CreateJobPostDto` không có `slug` nên `UpdateJobPostDto` (PartialType) cũng không | ❌ `GET /job-posts/:id` dùng `ParseUUIDPipe` | ❌ chưa có                                    |
| `Company` | ✅ `@unique`                  | ✅                                                                                                          | ✅ `GET /companies/:idOrSlug`                | ❌ chưa có                                    |
| `Post`    | ✅ `@unique`                  | ✅                                                                                                          | ✅                                           | ✅ `PostSlugHistory` + `post-slug.service.ts` |

Phần việc thực sự:

1. **Đổi format slug job.** Hiện `createSlug()` (`job-posts.service.ts` dòng ~990) sinh
   `${slugified-title}-${Date.now()}` → hậu tố là **13 chữ số epoch millisecond**, ví dụ
   `senior-backend-engineer-1756800000000`. Không đạt yêu cầu §4.3 mục 2. Đổi sang short ID
   (base36 hoặc 4 ký tự từ UUID), kèm **migration backfill** cho job đã có + bảng
   `JobPostSlugHistory` để giữ URL cũ 301. Đây là migration chạm dữ liệu — áp dụng A4.
2. **Thêm endpoint tra cứu job theo slug** (hoặc mở rộng thành `:idOrSlug` như companies đã làm),
   để `/jobs/[slug]` ở frontend thực sự dùng slug thay vì UUID.
3. **Thêm slug history cho company** nếu cho phép đổi slug; nếu không cho đổi, ghi rõ ràng buộc đó.
4. `Post` không cần làm gì thêm — dùng làm mẫu tham chiếu cho hai entity kia.

Không thay đổi URL theo title bất cứ khi nào recruiter sửa nội dung (hiện đã đúng, giữ nguyên).

### C4. Revalidation events

Backend **đã có sẵn hạ tầng outbox**: model `OutboxEvent` + `OutboxProcessorService`
(`@Cron(EVERY_5_SECONDS)`). Tái sử dụng, không xây mới.

Khi job/company/post đổi trạng thái public, phát event:

```text
job.published | job.updated | job.expired | job.hidden
company.updated | company.deactivated
post.published | post.updated | post.unpublished
```

Frontend nhận qua một route handler mới — **hiện chưa tồn tại**, repo chỉ có
`src/app/api/v1/[...proxy]/route.ts`. Cần thêm `src/app/api/revalidate/route.ts`:

- xác thực bằng HMAC chữ ký trên raw body (dùng lại đúng khuôn `SepayWebhookService.verifySignature`
  ở backend làm tham chiếu: ký trên raw bytes, có timestamp tolerance, `timingSafeEqual`);
- secret là biến server-only, **không** `NEXT_PUBLIC_`;
- gọi `revalidateTag`/`revalidatePath`;
- nằm dưới `/api/` nên đã bị `Disallow: /api/` trong robots — đúng ý đồ.

### Acceptance C

- Không thể tìm thấy PII/private field trong response SEO API bằng contract test.
- Sitemap read model không trả job invalid/expired.
- Event test chứng minh cache metadata và sitemap đổi sau publish/expire.
- Slug conflict, legacy UUID redirect và unknown URL có test.
- Endpoint SEO có cursor pagination; test với dataset ≥ 1.000 job không timeout.

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
- `datePosted` (`publishedAt`), `validThrough` (`expiredAt`);
- `hiringOrganization` có tên/logo hợp lệ;
- `jobLocation` hoặc `jobLocationType: TELECOMMUTE` với remote — map từ `WorkingModel`;
- `employmentType`, `identifier`;
- salary chỉ khi số tiền/currency/period được hiển thị thực. **Ràng buộc dữ liệu:** `JobPost` có
  `salaryIsVisible` và `salaryIsNegotiable`; chỉ phát `baseSalary` khi `salaryIsVisible = true`,
  `salaryIsNegotiable = false` và có đủ `salaryMin`/`salaryMax`/`salaryCurrency`/`salaryPeriod`;
- direct apply flow không bắt login chỉ để xem mô tả job.

Không đặt nhiều `JobPosting` trên list page. Không để schema tồn tại sau khi job hết hạn. Validate bằng Rich Results Test và URL Inspection trước launch. [Google JobPosting requirements](https://developers.google.com/search/docs/appearance/structured-data/job-posting)

### D3. Schema safety

- JSON-LD serialize bằng safe JSON escaping, tránh user-generated `</script>` injection.
  Escape `<`, `>`, `&` khi nhúng vào `<script type="application/ld+json">`.

  **Rủi ro thật trong codebase này — đọc kỹ trước khi làm D2.** `JobPost.description`,
  `requirements`, `benefits` là rich text recruiter nhập, và **không được sanitize ở bất kỳ đâu**:
  - Backend: `CreateJobPostDto` chỉ có `@IsString()`, không `MaxLength`, không sanitize.
    `sanitize-html` **có** trong repo nhưng chỉ dùng cho module `posts`
    (`post-content.policy.ts`) và `job-post-ai` (`rich-text.ts`) — **không** cho `job-posts`.
  - Frontend: `job-detail-page.tsx` render bằng `dangerouslySetInnerHTML={{ __html:
getCleanHtml(...) }}`. `getCleanHtml` (dòng ~90) chỉ bóc `<details>`/`<summary>` và xoá
    heading trùng — **thuần mỹ quan, không phải sanitizer**.

  Nghĩa là hôm nay đã có sẵn một đường stored-XSS từ recruiter tới mọi khách truy cập trang job
  public, và JSON-LD sẽ nhúng đúng chuỗi đó. Escaping JSON-LD là **bắt buộc nhưng chưa đủ** —
  phải sanitize ở backend khi ghi (hoặc ít nhất ở tầng render). Đây là **điều kiện tiên quyết
  của §6 B4**: SSR nội dung này vào response của server làm bề mặt tấn công rộng hơn so với
  render phía client hiện tại.

  Hạng mục này **nằm ngoài phạm vi kế hoạch SEO** và cần một PR bảo mật riêng, nhưng B4 không
  được merge trước nó.

- Không dùng CV/candidate data trong schema.
- Có unit test schema required fields, null handling, expiry, locale và escaping.
- Schema là dữ liệu mô tả, không phải công cụ thao túng ranking.

---

## 9. Workstream E — Nội dung, information architecture và internal links

**Owner:** Content/Product/SEO owner
**Ưu tiên:** P2

### E1. Research trước khi tạo content

- Lập keyword map dựa trên query thực trong Search Console sau launch, lượng job supply, conversion apply và câu hỏi từ support/sales; không sao chép keyword của đối thủ một cách máy móc.
- Nguồn dữ liệu nội bộ sẵn có: bảng `SearchKeywordLog` (module `search-keyword`) đã ghi từ khoá
  người dùng tìm trên site — dùng nó làm đầu vào trước khi có dữ liệu Search Console.
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
  **Hiện chưa có route nào cho các trang này** — phải tạo trước khi launch, vì §11 F3 phụ thuộc.
- Chỉ cập nhật `dateModified` khi có thay đổi có ý nghĩa.
- Link từ article đến các job/company thật; không dùng keyword stuffing.

### E4. Internal link rules

- Mọi link indexable là `<a href>` crawlable, không chỉ `onClick`/router push.
  **Cần rà soát:** `jobs-route.tsx` hiện điều hướng bằng `router.push(path)` qua callback
  `navigate`; các link tới job/company trong list phải đổi sang `<Link href>` của `next-intl`.
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

- Trang About/Organization, Contact, policy và editorial ownership dễ crawl (phụ thuộc E3).
- Company pages minh bạch trạng thái xác minh và thông tin public — dữ liệu đã có
  (`Company.verificationStatus`, `reputationScore`), chỉ cần quyết định hiển thị gì ra public.
- Author pages khi có tác giả thật; không gán tác giả không tồn tại. `Post.adminId` là nguồn
  author hiện có.
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
  `next.config.ts` đã có `optimizePackageImports` cho ~20 package — kiểm tra hiệu quả thật bằng
  bundle analyzer thay vì giả định.
- Tối ưu CLS: luôn dành chỗ cho logo/image/job card/loading state.
- Không chặn Googlebot khỏi CSS/JS cần render.
- **Xoá `public/mockServiceWorker.js` khỏi image production** — artifact của MSW, không có lý do
  tồn tại ngoài môi trường dev.
- Kiểm tra response HTML và rendered page bằng URL Inspection sau launch.

Google có thể render JavaScript, nhưng metadata/canonical/robots không nên phụ thuộc vào thay đổi sau client hydration. [Google JavaScript SEO guidance](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)

---

## 12. Testing và quality gate

### Tự động trong CI

- Unit test SEO helper: canonical host, locale, noindex, escaped metadata/JSON-LD.
- **Test chặn hồi quy:** không file nào có `"use client"` được import helper SEO / đọc
  `PUBLIC_ORIGIN`, `CANONICAL_ORIGIN`, `SEO_INDEXING_ENABLED`, hay secret revalidate.
- **Test parity i18n:** `messages/vi.json` và `messages/en.json` có tập key giống hệt nhau
  (hiện lệch 19 key). `AGENTS.md` ghi chưa có kiểm tra tự động — đây là chỗ thêm nó.
- Contract test SEO API: chỉ public fields, status filtering, pagination/cursor.
- Sitemap test: canonical URLs only, no query URL, no expired/hidden/private entity, correct `lastmod`, **và không vượt 50.000 URL/sitemap**.
- Route integration test: public HTML có title/description/canonical/H1/JSON-LD; private route noindex.
- Job lifecycle test: publish → sitemap/schema có; expire → sitemap/schema mất, page policy đúng.
- Redirect table test: `/` → 308 `/vi`; `www.` → 301 apex; legacy UUID job URL → 301 slug; không có chain/loop.
- Link checker cho internal href và redirect map.
- Rich Result validation fixture cho `JobPosting`/`Article`/`Organization`.
- Accessibility test: heading hierarchy, one H1, link accessible name, language attr — dùng skill
  `accessibility-review` trong `.agents/skills/`.

### Manual release gate

1. `curl -I` xác nhận status/redirect/canonical host/robots header **và đủ 5 header bảo mật**.
2. Mở View Source, không chỉ DevTools Elements, để xác minh content/metadata ban đầu.
3. Rich Results Test cho ít nhất 10 job, 5 article, 5 company.
4. URL Inspection trên Search Console production cho home, list, detail, expired job, private route.
5. Validate sitemap XML và submit Search Console/Bing Webmaster.
6. Test ứng tuyển anonymous/public, login redirect và expired job.
7. Test chat realtime (nếu đã đổi cấu hình socket theo P0-1 phương án A).
8. Review snapshot trước/sau migration database và rollback rehearsal.

### Xác minh quyền sở hữu Search Console / Bing

Chưa được chỉ định trong bản đầu. Quyết định: dùng **DNS TXT record tại Name.com** cho cả
`upnext.works` (Google Search Console domain property) và Bing Webmaster Tools — không dùng file
HTML upload, vì file đó sẽ phải nằm trong `public/` và đi kèm mọi image, kể cả staging.

Quy trình DNS đã có tại `upnext-infra/docs/02-dns-namecom.md`. Domain property bao trùm cả
`www` và mọi subdomain, nên chỉ cần một lần xác minh; staging vẫn noindex bằng header.

---

## 13. Runbook phát hành production

### Trước deploy

- [ ] **P0-1 đã quyết định và triển khai xong** (phương án A hoặc B đã ghi vào tài liệu này).
- [ ] **P0-2, P0-3 đã đo lại trên deployment thật** và cập nhật §2.1.
- [ ] Code freeze release candidate.
- [ ] Mọi CI/SEO test pass.
- [ ] Với release lớn hiện tại (chênh lệch hàng trăm commit/migration), staging chạy chính image digest sẽ promote tối thiểu **7 ngày**; thay đổi nhỏ đã phân loại rủi ro thấp mới có thể dùng soak 72 giờ theo error budget được duyệt.
- [ ] No P0/P1 error, no unexplained 5xx/404 spike, monitoring healthy.
- [ ] Backup production verified và migration rehearsal pass (đặc biệt migration backfill slug job).
- [ ] Sitemap/canonical/robots validated ở release candidate nhưng staging vẫn noindex.
- [ ] Search Console/Bing ownership đã xác minh bằng DNS TXT.
- [ ] Rollback image tag/digest và incident owner được ghi rõ.

### Deploy

1. Deploy backend artifact và migration theo runbook có backup.
2. Xác nhận health, logs, DB migration state và synthetic public API.
3. Deploy frontend cùng release artifact.
4. Xác nhận `upnext.works` trả product routes thật, canonical production, robots/sitemap 200.
5. Bỏ production `noindex`; staging vẫn noindex. Verify lại đủ header bảo mật sau khi sửa nginx.
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

## 14. Thứ tự backlog và phụ thuộc

Cột "Chặn bởi" là điều kiện tiên quyết cứng — không bắt đầu hạng mục khi mục chặn chưa xong.

| #   | Hạng mục                                                                                                                                                                | Repo/owner      | Chặn bởi | Blocker launch    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------- | -------- | ----------------- |
| 0a  | **P0-1: quyết định artifact promotion** (chọn A hoặc B; nếu A: đổi build args + nginx `/socket.io/`)                                                                    | Infra + FE      | —        | **Có**            |
| 0b  | **P0-2/P0-3: đo lại hreflang và `/` redirect trên deployment thật**, cập nhật §2.1                                                                                      | FE              | —        | **Có**            |
| 1   | Staging/placeholder production noindex header; tách `www` 301; monitoring healthy                                                                                       | Infra           | 0a       | Có                |
| 2   | Compose dùng digest/`sha-*` thay tag động; migration rehearsal                                                                                                          | Infra/BE        | 0a       | Có                |
| 3   | Production chạy đầy đủ public routes                                                                                                                                    | FE/BE/Infra     | 2        | Có                |
| 4   | Site config server-only, `metadataBase`, canonical, `permanentRedirect`, root `not-found.tsx`; `noindex` ở **cả 5 nơi** (§6 B2), gồm `(root)/layout.tsx`                | FE              | 0b       | Có                |
| 5   | Root `robots.ts` + sitemap index (có giới hạn 50k)                                                                                                                      | FE              | 4        | Có                |
| 6   | BE: format slug job + history + endpoint tra cứu slug; public SEO read model có cursor; lifecycle events qua outbox                                                     | BE              | 2        | Có                |
| 6b  | **Sanitize JD** (`description`/`requirements`/`benefits`) ở backend khi ghi + rà lại `getCleanHtml` ở FE. PR bảo mật riêng, ngoài phạm vi SEO nhưng chặn #7 — xem §8 D3 | BE (+FE)        | —        | Có                |
| 7   | FE: `/api/revalidate` có HMAC; đưa **cả ba** trang chi tiết (job/company/post) lên Server Component + ISR, metadata/H1 riêng từng entity                                | FE              | 4, 6, 6b | Có                |
| 8   | JobPosting/Organization/Article/Breadcrumb schema + escaping                                                                                                            | FE/BE           | 7        | Có                |
| 9   | CI SEO tests, i18n parity test, redirect table test, rich-result fixtures, link checks                                                                                  | FE/BE/QA        | 5, 7, 8  | Có                |
| 10  | Search Console/Bing (DNS TXT), analytics dashboard                                                                                                                      | SEO/Infra       | 1        | Có                |
| 11  | Trang About/Contact/Policy/Editorial                                                                                                                                    | Content/FE      | 4        | Có (F3 phụ thuộc) |
| 12  | Curated landing pages, editorial governance                                                                                                                             | Content/Product | 9        | Không             |
| 13  | AEO/GEO content program                                                                                                                                                 | Content/Product | 11, 12   | Không             |

Đường găng: **0a → 2 → 6 → 7 → 8 → 9**. Backend (#6) là hạng mục dài nhất vì có migration backfill;
bắt đầu nó song song với #1 ngay sau khi #0a chốt. #6b không phụ thuộc gì cả — mở PR bảo mật đó
ngay hôm nay, đừng để nó thành thứ chặn #7 vào phút chót.

---

## 15. Tài liệu tham chiếu chính thức

- [Google: Block indexing with noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing)
- [Google: Canonical URLs](https://developers.google.com/search/docs/crawling-indexing/consolidate-duplicate-urls)
- [Google: Build and submit sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap)
- [Google: Localized versions and hreflang](https://developers.google.com/search/docs/advanced/crawling/localized-versions)
- [Google: JobPosting structured data](https://developers.google.com/search/docs/appearance/structured-data/job-posting)
- [Google: JavaScript SEO basics](https://developers.google.com/search/docs/crawling-indexing/javascript/javascript-seo-basics)
- [Google: Site move with URL changes](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes)
- [Next.js: `robots.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js: `sitemap.ts`](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [nginx: `add_header` inheritance](https://nginx.org/en/docs/http/ngx_http_headers_module.html#add_header)

---

## 16. Definition of Done

SEO production launch chỉ được đánh dấu hoàn thành khi:

1. `upnext.works` là website product thật, không còn placeholder/404 ở public routes.
2. Staging và preview đều noindex ở response đầu tiên; các private HTML route production cũng noindex hoặc không thể truy cập anonymous, nhưng không bị `robots.txt` chặn trước khi bot đọc noindex. Bao gồm cả nhánh không-locale dưới `(root)/layout.tsx` (`/auth/callback`, `/conversations/chat`).
3. Production có robots, sitemap, canonical, hreflang đúng theo §4.4 và Search Console xác nhận fetch được.
4. Public job/company/article được SSR/ISR với nội dung và metadata **riêng từng entity** trong HTML ban đầu — kể cả posts, hiện đang dùng một title/description chung cho mọi bài.
5. Public SEO API không lộ PII/private data, có contract test và cursor pagination.
6. Job lifecycle xử lý publish/update/expiry đúng trong page, sitemap, schema và cache.
7. JobPosting validation sạch với mẫu dữ liệu production thật.
8. Core Web Vitals, logs, alerting và rollback runbook hoạt động.
9. Release được deploy từ artifact đã soak trên staging (7 ngày cho release lớn hiện tại) và migration rehearsal pass.
   **Nếu P0-1 chọn phương án B, mục này chỉ đảm bảo cùng commit SHA — soak KHÔNG chứng minh
   được client bundle production, và giới hạn đó phải được nêu trong release note.**
10. `/` redirect một hop 308 tới `/vi`; `www.` redirect 301 về apex; không còn duplicate locale/legacy job URL indexable.
11. Dashboard theo dõi organic/crawl/conversion có owner chịu trách nhiệm vận hành.
12. Ba mục **[cần đo lại]** ở §2.1 đã được đo trên deployment thật và bảng audit đã cập nhật.
