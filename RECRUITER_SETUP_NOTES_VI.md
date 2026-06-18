# Ghi chú setup lại Recruiter

File này ghi lại những thay đổi đã làm để đưa phần `recruiter` về đúng cấu trúc dự án UpNext Frontend.

## 1. Mục tiêu

Ban đầu bạn có 2 phần:

```txt
src/app/recruiter/
src/features/recruiter/
```

Vấn đề là dự án UpNext đang dùng route có locale bằng `next-intl`, nên route thật phải nằm trong:

```txt
src/app/[locale]/
```

Nếu để `src/app/recruiter`, trang recruiter sẽ không đi qua layout locale `/vi` và `/en`, dễ lệch với cấu trúc chung của dự án.

Mục tiêu setup lại:

- Route nằm trong `src/app/[locale]/recruiter`.
- UI, data, component nghiệp vụ nằm trong `src/features/recruiter`.
- Link nội bộ dùng helper locale-aware của dự án.
- Icon dùng Phosphor Icons, không dùng Lucide.
- Import helper đúng từ `src/shared`.
- Build/typecheck chạy được.

## 2. Cấu trúc sau khi chỉnh

Hiện route recruiter nằm ở:

```txt
src/app/[locale]/recruiter/
  layout.tsx
  page.tsx
  candidates/
    page.tsx
  job-posts/
    page.tsx
    create/
      page.tsx
```

Feature recruiter nằm ở:

```txt
src/features/recruiter/
  components/
    dashboard-shell.tsx
    recruiter-sidebar.tsx
    recruiter-topbar.tsx
    candidates-page.tsx
    create-job-post-page.tsx
    job-posts-page.tsx
    ...
  components/job-posts/
    current-plan-card.tsx
    job-filters.tsx
    job-kpi-grid.tsx
    job-posts-table.tsx
    posting-performance-card.tsx
    right-action-card.tsx
  data/
    candidates-data.ts
    create-job-data.ts
    dashboard-data.ts
    job-posts-data.ts
  icons.ts
```

## 3. URL hiện tại

Vì route nằm trong `[locale]`, các URL đúng là:

```txt
/vi/recruiter
/vi/recruiter/candidates
/vi/recruiter/job-posts
/vi/recruiter/job-posts/create
```

Và bản tiếng Anh:

```txt
/en/recruiter
/en/recruiter/candidates
/en/recruiter/job-posts
/en/recruiter/job-posts/create
```

## 4. Vai trò của từng phần

### `src/app/[locale]/recruiter/layout.tsx`

File này chỉ bọc layout cho toàn bộ khu recruiter.

Nó import:

```ts
import { DashboardShell } from "@/features/recruiter/components/dashboard-shell";
```

Và render:

```tsx
<DashboardShell>{children}</DashboardShell>
```

Nghĩa là mọi trang con như dashboard, candidates, job posts đều có chung sidebar/topbar.

File này cũng gọi:

```ts
setRequestLocale(locale);
```

Để route hoạt động đúng với `next-intl`.

### `src/app/[locale]/recruiter/page.tsx`

Đây là trang dashboard recruiter:

```txt
/vi/recruiter
```

Nó chỉ compose các component từ feature:

```tsx
<KpiGrid />
<TaskCard />
<RecruitmentPerformanceChart />
<PipelineProgress />
<InterviewSchedule />
<JobPerformanceTable />
<PackageCard />
<TrustScoreCard />
```

Theo rule dự án, route trong `app` chỉ compose, không nên chứa business logic phức tạp.

### `src/app/[locale]/recruiter/candidates/page.tsx`

Route:

```txt
/vi/recruiter/candidates
```

Render component:

```tsx
<CandidatesPage />
```

Component thật nằm ở:

```txt
src/features/recruiter/components/candidates-page.tsx
```

### `src/app/[locale]/recruiter/job-posts/page.tsx`

Route:

```txt
/vi/recruiter/job-posts
```

Render component:

```tsx
<RecruiterJobPostsPage />
```

Component thật nằm ở:

```txt
src/features/recruiter/components/job-posts-page.tsx
```

### `src/app/[locale]/recruiter/job-posts/create/page.tsx`

Route:

```txt
/vi/recruiter/job-posts/create
```

Render component:

```tsx
<CreateJobPostPage />
```

Component thật nằm ở:

```txt
src/features/recruiter/components/create-job-post-page.tsx
```

## 5. Vì sao không để route ở `src/app/recruiter`?

Dự án đang có layout chính ở:

```txt
src/app/[locale]/layout.tsx
```

Layout này làm các việc quan trọng:

- Validate locale.
- Set locale cho `next-intl`.
- Load font.
- Bọc `NextIntlClientProvider`.
- Bọc `Providers` của app.

Nếu tạo route ở `src/app/recruiter`, route đó không nằm dưới `/vi` hoặc `/en`, không đi theo cấu trúc locale của dự án.

Vì vậy route recruiter phải nằm trong:

```txt
src/app/[locale]/recruiter
```

## 6. Các import đã sửa

### Link và pathname

Trước đó có code dùng:

```ts
import Link from "next/link";
import { usePathname } from "next/navigation";
```

Đã đổi thành:

```ts
import { Link, usePathname } from "@/i18n/navigation";
```

Lý do: `@/i18n/navigation` là helper của `next-intl`, giúp link giữ đúng locale.

Ví dụ khi đang ở `/vi`, link:

```tsx
<Link href="/recruiter/job-posts/create" />
```

Sẽ đi đúng tới:

```txt
/vi/recruiter/job-posts/create
```

### `cn`

Trước đó có code dùng:

```ts
import { cn } from "@/lib/utils";
```

Nhưng dự án này không có `@/lib/utils`. Helper đúng là:

```ts
import { cn } from "@/shared/lib/cn";
```

### Icon

Trước đó phần recruiter dùng:

```ts
import { ... } from "lucide-react";
```

Nhưng `AGENTS.md` nói rõ:

```txt
Lucide is not installed.
Icons come from @phosphor-icons/react.
```

Vì vậy đã tạo file:

```txt
src/features/recruiter/icons.ts
```

File này map các tên icon cũ sang icon Phosphor tương ứng.

Ví dụ:

```ts
BriefcaseBusiness -> Briefcase
Building2 -> Building
Home -> House
Search -> MagnifyingGlass
ChevronDown -> CaretDown
```

File icon đang import từ:

```ts
@phosphor-icons/react/ssr
```

Lý do dùng `/ssr`: một số data file của recruiter chứa icon component và có thể được import qua Server Component. Entry `/ssr` tránh lỗi build kiểu `createContext is not a function`.

## 7. Sidebar logo đã sửa

Trước đó sidebar trỏ tới:

```txt
/images/logo.png
```

Nhưng file này không tồn tại trong `public`, nên browser báo lỗi `400 Bad Request`.

Đã đổi sang dùng shared logo của dự án:

```tsx
import { Logo } from "@/shared/ui/logo";

<Logo className="mb-9 ml-1" href="/recruiter" />;
```

Shared logo tự dùng asset đúng:

```txt
public/upnext-logo/wordmark-cropped.png
```

## 8. Chart đã sửa

Component:

```txt
src/features/recruiter/components/recruitment-performance-chart.tsx
```

Trước đó dùng `ResponsiveContainer` của Recharts và trong dev/browser có warning:

```txt
The width(-1) and height(-1) of chart should be greater than 0
```

Đã đổi sang đo width thật bằng `ResizeObserver`, chỉ render chart khi width > 0.

Ý tưởng:

```tsx
const chartRef = useRef<HTMLDivElement | null>(null);
const chartWidth = useElementWidth(chartRef);

{
  mounted && chartWidth > 0 ? (
    <AreaChartContent width={chartWidth} />
  ) : (
    <div className="h-full rounded-lg bg-gradient-to-b from-emerald-50 to-white" />
  );
}
```

Nhờ vậy browser smoke test không còn warning console cho chart.

## 9. Pattern khi thêm route recruiter mới

Ví dụ muốn thêm route:

```txt
/vi/recruiter/settings
```

Tạo file route:

```txt
src/app/[locale]/recruiter/settings/page.tsx
```

Nội dung nên theo mẫu:

```tsx
import { setRequestLocale } from "next-intl/server";

import { RecruiterSettingsPage } from "@/features/recruiter/components/recruiter-settings-page";

type RecruiterSettingsRouteProps = Readonly<{
  params: Promise<{
    locale: string;
  }>;
}>;

export default async function RecruiterSettingsRoute({ params }: RecruiterSettingsRouteProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return <RecruiterSettingsPage />;
}
```

Component UI đặt ở:

```txt
src/features/recruiter/components/recruiter-settings-page.tsx
```

Không nên viết toàn bộ UI/business logic trực tiếp trong `src/app/[locale]/recruiter/settings/page.tsx`.

## 10. Pattern khi thêm component recruiter

Nếu component chỉ dùng trong recruiter, đặt ở:

```txt
src/features/recruiter/components/
```

Nếu là component con riêng của job posts, đặt ở:

```txt
src/features/recruiter/components/job-posts/
```

Nếu là dữ liệu mock/static cho recruiter, đặt ở:

```txt
src/features/recruiter/data/
```

Nếu sau này gọi API thật, nên tạo:

```txt
src/features/recruiter/api/
src/features/recruiter/hooks/
src/features/recruiter/types.ts
```

Ví dụ:

```txt
src/features/recruiter/
  api/
    recruiter-jobs-api.ts
  hooks/
    use-recruiter-jobs.ts
  types.ts
```

API wrapper nên dùng:

```ts
import { apiRequest } from "@/shared/api/http";
```

Server state nên dùng TanStack Query.

## 11. Những lệnh đã chạy để kiểm tra

Đã chạy:

```bash
pnpm.cmd typecheck
pnpm.cmd lint
pnpm.cmd build
pnpm.cmd exec oxfmt --check 'src/features/recruiter' 'src/app/[locale]/recruiter' 'PROJECT_GUIDE_VI.md'
```

Kết quả chính:

- `typecheck`: pass.
- `build`: pass.
- Format check trong phạm vi recruiter: pass.
- `lint`: exit code 0, nhưng còn warning accessibility ở recruiter và marketing.

Lưu ý build cần network vì `next/font` tải Google Fonts. Lần đầu build trong sandbox fail vì không fetch được font, sau đó chạy lại với quyền network thì build pass.

## 12. Browser smoke test đã kiểm tra

Đã kiểm tra bằng Playwright headless các route:

```txt
/vi/recruiter
/vi/recruiter/candidates
/vi/recruiter/job-posts
/vi/recruiter/job-posts/create
```

Ở 2 viewport:

```txt
desktop: 1440 x 1000
mobile: 390 x 844
```

Kết quả:

- Tất cả route trả `200`.
- Tất cả route có `h1` render đúng.
- Không còn console error/warning sau khi sửa logo và chart.

## 13. Những vấn đề còn lại chưa sửa

`pnpm.cmd lint` vẫn báo warning accessibility, ví dụ:

- Một số link đang dùng `href="#"`.
- Một số button/control thiếu `aria-label`.
- Một số warning cũ ở marketing home như `<img>` thay vì `next/image`, role chưa chuẩn.

Các warning này không chặn build/typecheck, nhưng nên có một lượt cleanup accessibility riêng.

Ngoài ra, `public/mockServiceWorker.js` đang modified sẵn từ trước. File này là generated file nên không sửa thủ công.

## 14. Tóm tắt dễ nhớ

Quy tắc setup recruiter từ giờ:

```txt
Route:   src/app/[locale]/recruiter/...
Feature: src/features/recruiter/...
Link:    import { Link, usePathname } from "@/i18n/navigation"
cn:      import { cn } from "@/shared/lib/cn"
Icon:    import từ "@/features/recruiter/icons"
Logo:    dùng "@/shared/ui/logo"
```

Khi thêm trang mới, route chỉ compose component. Logic và UI chính để trong `src/features/recruiter`.
