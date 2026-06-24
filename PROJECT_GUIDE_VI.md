# UpNext Frontend - Giải thích cấu trúc và cách code

Tài liệu này giúp bạn đọc nhanh toàn bộ dự án UpNext Frontend và biết nên code theo hướng nào khi thêm màn hình, feature, API, UI, test.

## 1. Dự án này là gì?

UpNext là frontend cho nền tảng tuyển dụng IT. Ứng dụng dùng Next.js App Router, React, TypeScript strict, Tailwind CSS v4, next-intl cho đa ngôn ngữ, TanStack Query/Table cho dữ liệu, React Hook Form + Zod cho form, Zustand cho state UI, MSW/Vitest/Playwright cho test.

Ngôn ngữ mặc định là tiếng Việt. Khi vào `/`, middleware sẽ chuyển sang `/vi`. Tiếng Anh nằm ở `/en`.

## 2. Các lệnh hay dùng

Chỉ dùng `pnpm`, không dùng npm/yarn.

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm lint
pnpm format:check
pnpm test
pnpm test:e2e
pnpm verify
pnpm verify:full
```

Ý nghĩa nhanh:

- `pnpm dev`: chạy app local ở `http://localhost:3000`.
- `pnpm typecheck`: sinh type cho Next rồi kiểm tra TypeScript.
- `pnpm lint`: chạy Oxlint.
- `pnpm format:check`: kiểm tra format bằng Oxfmt.
- `pnpm test`: chạy unit/component test bằng Vitest.
- `pnpm test:e2e`: chạy Playwright.
- `pnpm verify`: typecheck + lint + format check + test.
- `pnpm verify:full`: verify + build + e2e.

Với thay đổi bình thường, chạy `pnpm verify`. Với thay đổi route, layout, provider, app shell hoặc flow trình duyệt, chạy `pnpm verify:full`.

## 3. Bản đồ thư mục

```txt
src/
  app/
    [locale]/
      (auth)/
      (public)/
      (workspace)/
      layout.tsx
    globals.css
    providers.tsx
    providers.test.tsx
  features/
    admin/
    recruiter/
    workspace-shell/
    marketing/
      home/
      jobs/
      companies/
      shared/
    auth/
    candidate/
    employer/
    admin/
  i18n/
    routing.ts
    request.ts
    navigation.ts
  mocks/
    browser.ts
    handlers.ts
    server.ts
  shared/
    api/
    lib/
    ui/
    hooks/
    stores/
    types/
  test/
    setup.ts
messages/
  vi.json
  en.json
e2e/
  home.spec.ts
public/
```

Vai trò từng khu vực:

- `src/app`: chỉ nên chứa route, layout, metadata, provider và composition cấp app. Không nên đặt business logic ở đây.
- `src/features`: nơi chứa code theo nghiệp vụ/domain. Ví dụ `marketing`, `auth`, `admin`, `recruiter`, `workspace-shell`.
- `src/shared`: code dùng lại giữa nhiều feature, ví dụ API client, helper date, UI primitive, table.
- `src/i18n`: cấu hình locale, message loading, navigation helper.
- `messages`: file dịch cho `next-intl`.
- `src/mocks`: mock API bằng MSW.
- `src/test`: setup test dùng chung.
- `e2e`: test trình duyệt bằng Playwright.
- `public`: asset tĩnh như ảnh, logo, mock service worker.

## 4. Luồng chạy của app

Khi người dùng vào website:

1. `src/proxy.ts` chạy middleware của `next-intl`.
2. Middleware dùng `src/i18n/routing.ts` để biết locale hợp lệ là `vi` và `en`.
3. Nếu vào `/`, app chuyển về locale mặc định `/vi`.
4. Route `/vi` hoặc `/en` đi vào `src/app/[locale]/layout.tsx`.
5. Layout kiểm tra locale hợp lệ. Nếu sai thì `notFound()`.
6. Layout load font, metadata, `NextIntlClientProvider`, rồi bọc app bằng `Providers`.
7. Route public nằm trong `src/app/[locale]/(public)`. Trang chủ render bằng `MarketingHomePage`.
8. `MarketingHomePage` nằm trong `src/features/public/home`.

Nói ngắn gọn:

```txt
request
-> src/proxy.ts
-> src/i18n/routing.ts
-> src/app/[locale]/layout.tsx
-> src/app/providers.tsx
-> src/app/[locale]/(public)/page.tsx
-> src/features/public/home
```

## 5. Đa ngôn ngữ với next-intl

File chính:

- `src/i18n/routing.ts`: khai báo locale `vi`, `en`, default `vi`.
- `src/i18n/request.ts`: load message JSON tương ứng từ `messages/<locale>.json`.
- `src/i18n/navigation.ts`: export `Link`, `redirect`, `useRouter`, `usePathname` đã hiểu locale.
- `messages/vi.json`, `messages/en.json`: nội dung dịch.

Khi code link hoặc điều hướng trong app có locale, ưu tiên dùng helper từ `@/i18n/navigation`, không dùng trực tiếp `next/link` hoặc `next/navigation` nếu đường dẫn cần giữ locale.

Ví dụ:

```tsx
import { Link } from "@/i18n/navigation";

export function JobsLink() {
  return <Link href="/jobs">Việc làm</Link>;
}
```

Trong Server Component có thể dùng `getTranslations`. Trong Client Component có thể dùng hook của `next-intl`.

Lưu ý hiện tại: một số chuỗi tiếng Việt trong `messages/vi.json` và `src/features/public/home/home-page.tsx` đang hiển thị dạng lỗi mã hóa khi đọc bằng terminal. Khi chỉnh copy tiếng Việt, nên kiểm tra trực tiếp trong editor/browser để tránh commit thêm nội dung bị sai encoding.

## 6. App Router và Server/Client Component

Quy ước quan trọng:

- Mặc định viết Server Component.
- Chỉ thêm `"use client"` khi cần hook React, event handler, browser API, Zustand, TanStack Query ở client, hoặc thư viện client-only.
- `src/app/[locale]/layout.tsx` là Server Component.
- `src/app/providers.tsx` là Client Component vì dùng `useEffect`, React Query provider và MSW browser worker.
- `src/features/public/home/home-page.tsx` là Client Component vì có state, event, dropdown, đổi theme, đổi ngôn ngữ, điều hướng client.

Ví dụ chọn đúng nơi đặt code:

```txt
Route /jobs
-> src/app/[locale]/jobs/page.tsx: compose page
-> src/features/jobs/components/jobs-page.tsx: UI nghiệp vụ jobs
-> src/features/jobs/api/jobs-api.ts: gọi API jobs
-> src/features/jobs/types.ts: type của jobs
```

Không nên nhét toàn bộ logic jobs vào `src/app/[locale]/jobs/page.tsx`.

## 7. Providers và server state

`src/app/providers.tsx` bọc toàn app bằng:

- `QueryClientProvider`: cung cấp TanStack Query.
- `ReactQueryDevtools`: debug query.
- MSW browser worker khi `NEXT_PUBLIC_API_MOCKING=enabled`.

Query client nằm ở `src/shared/api/query-client.ts`.

Default query options:

- `refetchOnWindowFocus: false`
- `retry: 1`
- `staleTime: 30_000`

Quy ước state:

- Dữ liệu từ server/API: dùng TanStack Query.
- State UI local như mở modal, tab, sidebar: dùng React state hoặc Zustand nếu cần chia sẻ rộng.
- Không dùng Zustand để thay thế server cache.

## 8. API layer

API helper nằm ở `src/shared/api/http.ts`.

Các điểm chính:

- `createApiUrl(path)`: ghép path với `NEXT_PUBLIC_API_BASE_URL`.
- `apiRequest<TResponse>()`: gọi `fetch`, parse JSON, throw `ApiError` khi response lỗi.
- Response `204` trả về `undefined`.

Khi thêm API cho feature, tạo wrapper trong feature và build trên `apiRequest`.

Ví dụ:

```ts
// src/features/jobs/api/jobs-api.ts
import { apiRequest } from "@/shared/api/http";

import type { Job } from "../types";

export function getJobs() {
  return apiRequest<Job[]>("/jobs");
}
```

Sau đó dùng TanStack Query:

```tsx
"use client";

import { useQuery } from "@tanstack/react-query";

import { getJobs } from "../api/jobs-api";

export function JobsList() {
  const jobsQuery = useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });

  if (jobsQuery.isLoading) return <p>Đang tải...</p>;
  if (jobsQuery.isError) return <p>Không tải được dữ liệu.</p>;

  return <div>{jobsQuery.data?.length} việc làm</div>;
}
```

## 9. Environment variables

File `src/shared/lib/env.ts` validate env bằng Zod.

Hiện có:

- `NEXT_PUBLIC_API_BASE_URL`: mặc định `http://localhost:3001`.
- `NEXT_PUBLIC_API_MOCKING`: `enabled` hoặc `disabled`, mặc định `disabled`.

Quy tắc:

- Env dùng ở browser phải bắt đầu bằng `NEXT_PUBLIC_`.
- Thêm env mới thì validate trong `src/shared/lib/env.ts`.
- Không hard-code secret trong source.

## 10. UI và styling

Styling chính:

- Tailwind v4.
- Token màu/theme trong `src/app/globals.css`.
- Helper `cn()` ở `src/shared/lib/cn.ts` để merge class.
- UI shared trong `src/shared/ui`.
- shadcn UI style `new-york` được cấu hình ở `components.json`, alias trỏ về `src/shared/ui`.
- Icon dùng `@phosphor-icons/react`. Không dùng Lucide vì dự án không cài Lucide.

Quy tắc dùng UI:

- Public marketing pages như homepage, job list, job detail, company detail được phép dùng bespoke CSS/component để giữ visual landing page.
- Candidate profile, Recruiter, Admin dùng shadcn-style primitives trong `src/shared/ui` để dựng form, tabs, dialog, drawer, dropdown, select, table và dashboard.
- Khi add component bằng shadcn CLI, alias phải về `src/shared/ui` và màu/radius/font phải map theo token UpNext, không để nguyên theme zinc mặc định nếu không phù hợp.
- Teal là primary brand; indigo/purple chỉ dùng cho premium/accent. Font chính là Plus Jakarta Sans từ layout locale.

Shared UI hiện có:

- `button`: Button primitive.
- `badge`: Badge primitive.
- `card`, `input`, `label`, `checkbox`, `tabs`, `dialog`, `sheet`, `dropdown-menu`, `select`, `separator`, `scroll-area`, `tooltip`: shadcn-style primitives đã custom token UpNext.
- `data-table`: baseline cho TanStack Table.
- `container`, `logo`, `job-card`, `company-card`, `search-box`, `icon`.

Khi cần button, ưu tiên dùng `Button` có sẵn:

```tsx
import { Button } from "@/shared/ui/button";

export function ApplyButton() {
  return <Button>Ứng tuyển</Button>;
}
```

Khi cần ghép class conditionally, dùng `cn()`:

```tsx
import { cn } from "@/shared/lib/cn";

export function Status({ active }: { active: boolean }) {
  return <span className={cn("text-sm", active && "text-brand")}>Active</span>;
}
```

## 11. Trang chủ marketing hiện tại

Trang chủ được compose như sau:

- `src/app/[locale]/page.tsx`: gọi `MarketingHomePage`.
- `src/features/public/home/index.ts`: export feature.
- `src/features/public/home/home-page.tsx`: component chính, header, hero, search, footer.
- `featured-jobs.tsx`: section việc làm nổi bật.
- `featured-companies.tsx`: section công ty nổi bật.
- `job-market.tsx`: section dữ liệu thị trường.
- `tech-orbit.tsx`: tương tác orbit kỹ năng.
- `marketing-home.css`: CSS riêng của trang marketing.
- `brand.ts`: asset/logo brand.
- `v2-icons.ts`: icon dùng trong trang.

Trang này đang chứa nhiều dữ liệu tĩnh trong component. Khi dữ liệu thật xuất hiện, nên tách theo feature API/hook thay vì gọi fetch trực tiếp trong component lớn.

Ví dụ hướng tách sau này:

```txt
src/features/public/home/
  api/
    marketing-api.ts
  hooks/
    use-featured-jobs.ts
  components/
    hero-section.tsx
    featured-jobs-section.tsx
  home-page.tsx
```

Chỉ tách khi có nhu cầu thật. Không tách quá sớm nếu màn hình vẫn đơn giản.

## 12. Workspace shell cho Candidate profile, Recruiter, Admin

Các app surfaces dùng layout nội bộ trong `src/features/workspace-shell`.

Hiện có:

- `WorkspaceShell`: sidebar có thu gọn/mở rộng, topbar, search, user menu, notification.
- `nav-config.ts`: nav config riêng cho Recruiter và Admin.
- `WorkspacePlaceholder`: placeholder để route mới có nền UI trước khi dựng nghiệp vụ.

Route workspace nằm dưới:

```txt
src/app/[locale]/(workspace)/
  admin/
  recruiter/
```

Quy tắc:

- Route file trong `src/app` chỉ compose layout/page mỏng.
- UI nghiệp vụ đặt trong `src/features/admin` hoặc `src/features/recruiter`.
- Không tạo sidebar/topbar riêng cho từng role; mở rộng `WorkspaceShell` hoặc nav config khi cần.
- Candidate profile cũng nên dùng cùng primitive shadcn, nhưng có thể có layout riêng nếu sản phẩm cần trải nghiệm nhẹ hơn Recruiter/Admin.

## 13. Data table

`src/shared/ui/data-table/data-table.tsx` là baseline cho bảng bằng TanStack Table.

Nó nhận:

- `columns`
- `data`
- `emptyMessage`
- `className`

Khi feature cần bảng, dùng baseline này trước. Nếu bảng cần sorting/filtering/pagination riêng, thêm ở feature hoặc mở rộng shared component khi nhiều nơi cùng cần.

Ví dụ:

```tsx
"use client";

import type { ColumnDef } from "@tanstack/react-table";

import { DataTable } from "@/shared/ui/data-table";

type Candidate = {
  name: string;
  title: string;
};

const columns: ColumnDef<Candidate>[] = [
  { accessorKey: "name", header: "Tên" },
  { accessorKey: "title", header: "Vị trí" },
];

export function CandidateTable({ data }: { data: Candidate[] }) {
  return <DataTable columns={columns} data={data} emptyMessage="Chưa có ứng viên." />;
}
```

## 14. Date/time

Dùng helper trong `src/shared/lib/date.ts`:

- `toDate(value)`
- `formatAppDate(value, locale)`
- `formatRelativeTime(value, locale)`

Không tự format ngày rải rác bằng `new Date().toLocaleString()` nếu format thuộc UI của app.

Ví dụ:

```ts
import { formatAppDate } from "@/shared/lib/date";

const label = formatAppDate("2026-06-16", "vi");
```

## 15. Mock API bằng MSW

File chính:

- `src/mocks/handlers.ts`: khai báo route mock.
- `src/mocks/browser.ts`: worker cho browser.
- `src/mocks/server.ts`: server cho test.

Hiện có mock endpoint:

```txt
GET <NEXT_PUBLIC_API_BASE_URL>/health
```

Muốn bật mock khi chạy browser:

```env
NEXT_PUBLIC_API_MOCKING=enabled
```

Không sửa `public/mockServiceWorker.js` bằng tay vì đây là file generated.

## 16. Test

Các loại test:

- Unit/helper test: đặt cạnh file, ví dụ `src/shared/lib/date.test.ts`.
- Component test: đặt cạnh component, ví dụ `src/shared/ui/button/button.test.tsx`.
- Provider test: `src/app/providers.test.tsx`.
- E2E test: `e2e/home.spec.ts`.

Khi thêm code mới:

- Helper có logic: thêm unit test.
- UI component có trạng thái/interaction: thêm component test.
- Route hoặc flow quan trọng: thêm Playwright e2e.

Ví dụ test helper:

```ts
import { describe, expect, it } from "vitest";

import { formatAppDate } from "./date";

describe("formatAppDate", () => {
  it("formats app dates", () => {
    expect(formatAppDate("2026-06-16", "vi")).toBe("16/06/2026");
  });
});
```

## 17. Cách thêm một feature mới

Ví dụ thêm feature `jobs`.

Bước 1: tạo cấu trúc trong `src/features/jobs`.

```txt
src/features/jobs/
  api/
    jobs-api.ts
  components/
    jobs-page.tsx
    jobs-list.tsx
  hooks/
    use-jobs.ts
  schemas/
    jobs-filter-schema.ts
  types.ts
```

Bước 2: tạo route trong `src/app/[locale]/jobs/page.tsx`.

```tsx
import { JobsPage } from "@/features/jobs/components/jobs-page";

export default function Page() {
  return <JobsPage />;
}
```

Bước 3: code API wrapper trong feature.

```ts
import { apiRequest } from "@/shared/api/http";

import type { Job } from "../types";

export function getJobs() {
  return apiRequest<Job[]>("/jobs");
}
```

Bước 4: code hook query.

```ts
import { useQuery } from "@tanstack/react-query";

import { getJobs } from "../api/jobs-api";

export function useJobs() {
  return useQuery({
    queryKey: ["jobs"],
    queryFn: getJobs,
  });
}
```

Bước 5: code UI component.

```tsx
"use client";

import { useJobs } from "../hooks/use-jobs";

export function JobsPage() {
  const jobsQuery = useJobs();

  if (jobsQuery.isLoading) return <p>Đang tải...</p>;
  if (jobsQuery.isError) return <p>Có lỗi khi tải việc làm.</p>;

  return (
    <main>
      <h1>Việc làm IT</h1>
      <p>{jobsQuery.data?.length ?? 0} việc làm</p>
    </main>
  );
}
```

Bước 6: thêm test phù hợp, rồi chạy `pnpm verify`.

## 18. Cách code form

Dự án định hướng dùng React Hook Form + Zod.

Ví dụ schema:

```ts
import { z } from "zod";

export const jobSearchSchema = z.object({
  keyword: z.string().trim().optional(),
  location: z.string().trim().optional(),
});

export type JobSearchValues = z.infer<typeof jobSearchSchema>;
```

Khi form là UI có event/hook, component cần `"use client"`.

Quy tắc:

- Validate bằng Zod.
- Submit handler không chứa logic API phức tạp; gọi hook/API wrapper.
- Text hiển thị cho người dùng nên lấy từ `next-intl` khi là product-facing.

## 19. Import path

Dùng alias `@/*`.

Nên:

```ts
import { cn } from "@/shared/lib/cn";
import { routing } from "@/i18n/routing";
```

Không nên import đường dài tương đối như:

```ts
import { cn } from "../../../shared/lib/cn";
```

## 20. Quy tắc đặt code

Hỏi nhanh trước khi tạo file:

- Code này chỉ thuộc một domain? Đặt trong `src/features/<domain>`.
- Code này dùng lại ở nhiều domain? Đặt trong `src/shared`.
- Code này chỉ compose route/layout? Đặt trong `src/app`.
- Code này là cấu hình locale/navigation? Đặt trong `src/i18n`.
- Code này là mock API? Đặt trong `src/mocks`.
- Code này là test browser? Đặt trong `e2e`.

Không tạo abstraction chỉ vì “có thể sau này cần”. Chỉ tách khi nó giảm lặp thật, giảm phức tạp thật, hoặc khớp pattern sẵn có.

## 21. Checklist trước khi commit

Trước khi handoff hoặc commit:

1. Đọc lại `AGENTS.md`.
2. Không sửa file generated như `next-env.d.ts`, `public/mockServiceWorker.js`.
3. Không đổi dependency/config nếu không cần.
4. Không đưa business logic vào `src/app`.
5. Dùng `@/*` imports.
6. Dùng Phosphor Icons, không dùng Lucide.
7. Dùng `next-intl` cho text product-facing.
8. Dùng `apiRequest` + TanStack Query cho server state.
9. Dùng `cn()` khi merge class Tailwind.
10. Chạy lệnh verify phù hợp và ghi lại lệnh đã chạy.

## 22. Nên đọc file nào trước?

Nếu bạn mới vào dự án, đọc theo thứ tự này:

1. `README.md`: tổng quan stack và lệnh.
2. `AGENTS.md`: quy tắc làm việc.
3. `package.json`: script và dependency.
4. `src/i18n/routing.ts`: hiểu locale.
5. `src/proxy.ts`: hiểu middleware locale.
6. `src/app/[locale]/layout.tsx`: hiểu app shell.
7. `src/app/providers.tsx`: hiểu provider client.
8. `src/app/[locale]/(public)/page.tsx`: hiểu route trang chủ.
9. `src/features/public/home/home-page.tsx`: hiểu feature đang có nhiều UI nhất.
10. `src/shared/api/http.ts`: hiểu cách gọi API.
11. `src/shared/lib/env.ts`: hiểu env.
12. `src/shared/ui/button/button.tsx`: hiểu style shared UI.
13. `e2e/home.spec.ts`: hiểu browser flow hiện tại.

## 23. Tóm tắt ngắn

UpNext FE đang theo kiến trúc Feature-First Hybrid:

- `src/app` là lớp route/composition.
- `src/features` là lớp nghiệp vụ.
- `src/shared` là lớp dùng chung.
- `src/i18n` là lớp locale/navigation.
- `messages` là dữ liệu dịch.
- `mocks` và `test/e2e` là lớp kiểm thử.

Khi code, hãy giữ thay đổi nhỏ, đúng chỗ, có type rõ ràng, có test tương ứng và chạy verify trước khi bàn giao.
