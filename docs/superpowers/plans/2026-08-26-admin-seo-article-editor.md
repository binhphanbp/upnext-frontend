# Admin SEO Article Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Thay toàn bộ form bài viết Admin bằng trình soạn thảo autosave và SEO kiểu WordPress/Yoast, đồng thời bảo đảm API và trang public xuất metadata chuẩn theo từng bài.

**Architecture:** Backend NestJS/Prisma là nguồn xác thực cho draft, publish, slug, sanitization và optimistic concurrency. Frontend Next.js chia editor thành các component nhỏ, dùng React Hook Form, TanStack Query, Tiptap và pure SEO/readability analyzers; trang public fetch post phía server để sinh metadata, JSON-LD và redirect slug cũ.

**Tech Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS 4, next-intl, TanStack Query, React Hook Form, Zod, Tiptap, NestJS, Prisma 7, PostgreSQL, Jest, Vitest, Testing Library, MSW, Playwright.

**Spec:** `fe/docs/superpowers/specs/2026-08-26-admin-seo-article-editor-design.md`

## Global Constraints

- Một bài chỉ có một phiên bản nội dung; UI vẫn thêm key vào cả `messages/vi.json` và `messages/en.json`.
- Không có lịch xuất bản, chờ duyệt, AI writing hoặc collaborative editing.
- Workflow duy nhất: `DRAFT → PUBLISHED → ARCHIVED`; bài archived có thể publish lại.
- `publishedAt` được gán đúng một lần ở lần publish đầu.
- Draft được phép chưa hoàn chỉnh; publish phải chạy validation ở backend.
- Admin mutation phải lấy `getAdminSession()` trong `mutationFn`, dùng `ApiError.message`, và redirect `/admin/login` khi 401.
- Dùng Phosphor Icons; không thêm Lucide.
- Không thay đổi hành vi `src/shared/ui/rich-text-editor.tsx` cho consumer hiện có.
- HTML bài viết phải được sanitize bằng allowlist ở backend trước khi lưu.
- TDD cho pure logic/API; UI phải có component test và browser verification.

---

## File Map

### Backend

- Modify `be/prisma/schema.prisma`: trường SEO/media/publishedAt, file purposes và `PostSlugHistory`.
- Create `be/prisma/migrations/20260826090000_admin_seo_article_editor/migration.sql`: schema, backfill và permission.
- Modify `be/package.json`: thêm `sanitize-html` và type package.
- Create `be/src/modules/posts/post-content.policy.ts`: sanitize, word count, draft/publish validation.
- Create `be/src/modules/posts/post-content.policy.spec.ts`: test pure policy.
- Create `be/src/modules/posts/post-slug.service.ts`: normalize/check/reserve slug history.
- Create `be/src/modules/posts/post-slug.service.spec.ts`: test slug/current/history.
- Modify `be/src/modules/posts/dto/create-post.dto.ts`: draft-safe fields, bỏ `viewCount`.
- Modify `be/src/modules/posts/dto/update-post.dto.ts`: `expectedUpdatedAt` bắt buộc cho PATCH editor.
- Create `be/src/modules/posts/dto/publish-post.dto.ts`: optimistic concurrency khi publish.
- Modify `be/src/modules/posts/admin-posts.controller.ts`: availability, preview, publish, archive và permission.
- Modify `be/src/modules/posts/public-posts.controller.ts`: canonical resolution response.
- Modify `be/src/modules/posts/posts.service.ts`: transaction workflow và response includes.
- Modify `be/src/modules/posts/posts.module.ts`: providers mới.
- Create `be/src/modules/posts/posts.service.spec.ts`: service workflow coverage.

### Frontend Admin

- Modify `fe/package.json`: thêm Tiptap image extension.
- Modify `fe/src/features/admin/api/posts.ts`: exact types và endpoint mới.
- Replace `fe/src/features/admin/components/content/articles/article-form-schema.ts`: draft/publish schemas và mapper.
- Create directory `fe/src/features/admin/components/content/articles/editor/` với editor shell, header, panels, preview, analyzers, draft storage và autosave hook.
- Modify routes `new/page.tsx` và `[id]/edit/page.tsx`: render editor shell mới.
- Remove `fe/src/features/admin/components/content/articles/article-form.tsx` sau khi routes không còn import.
- Modify `fe/messages/vi.json` và `fe/messages/en.json`: toàn bộ copy editor/SEO/a11y.
- Modify `fe/src/mocks/handlers.ts`: API mocks cho component/browser tests.

### Frontend Public

- Modify `fe/src/features/posts/types/post.ts`: SEO/published/canonical response fields.
- Modify `fe/src/features/posts/api/posts.ts`: canonical resolution type.
- Modify `fe/src/app/[locale]/(public)/posts/[slug]/page.tsx`: server metadata, JSON-LD, notFound/redirect.
- Modify `fe/src/features/posts/components/post-detail-content.tsx`: nhận server-fetched initial post và tránh fetch lặp.
- Create colocated metadata/JSON-LD tests.
- Create `fe/e2e/admin-article-editor.spec.ts`: critical end-to-end flow.

---

### Task 1: Persist SEO fields, slug history and publication date

**Files:**

- Modify: `be/prisma/schema.prisma`
- Create: `be/prisma/migrations/20260826090000_admin_seo_article_editor/migration.sql`

**Interfaces:**

- Produces: Prisma fields `excerpt`, `focusKeyword`, `canonicalUrl`, `isIndexable`, `isFollowable`, `thumbnailAlt`, `coverImageAlt`, `socialImageFileId`, `socialImageAlt`, `socialTitle`, `socialDescription`, `publishedAt`, relation `slugHistory`.
- Produces: `FilePurpose.POST_CONTENT` and `FilePurpose.POST_SOCIAL` for inline/social uploads; existing thumbnail/cover purposes remain unchanged.
- Consumes: permission code `posts:manage`, which already exists in `be/prisma/seed.ts` and is assigned to Super Admin and Content Moderator.

- [ ] **Step 1: Extend the Prisma model**

Add the exact nullable/default fields from the spec and:

```prisma
model PostSlugHistory {
  id        String   @id @default(uuid()) @db.Uuid
  postId    String   @map("post_id") @db.Uuid
  slug      String   @unique @db.VarChar(200)
  createdAt DateTime @default(now()) @map("created_at")
  post      Post     @relation(fields: [postId], references: [id], onDelete: Cascade)

  @@index([postId])
  @@map("post_slug_history")
}
```

Add `slugHistory PostSlugHistory[]` and the named `PostSocialImageFile` relation on `Post`; add the inverse `socialPostImages` relation on `FileAsset`.

Extend the enum without renaming existing database values:

```prisma
enum FilePurpose {
  // existing values remain
  POST_CONTENT @map("post_content")
  POST_SOCIAL  @map("post_social")
}
```

- [ ] **Step 2: Write migration SQL**

Create columns/table/indexes/FKs, add the two PostgreSQL enum values, then backfill once:

```sql
UPDATE "posts"
SET "published_at" = "created_at"
WHERE "status" = 'published' AND "published_at" IS NULL;
```

- [ ] **Step 3: Validate generated client and migration**

Run: `cd be && pnpm prisma:generate && pnpm typecheck`

Expected: Prisma client generation and TypeScript complete with exit code 0.

- [ ] **Step 4: Commit**

```bash
git add be/prisma/schema.prisma be/prisma/migrations/20260826090000_admin_seo_article_editor/migration.sql
git commit -m "feat(posts): add SEO publication fields"
```

### Task 2: Add sanitization, draft rules and publish policy

**Files:**

- Modify: `be/package.json`
- Modify: `be/pnpm-lock.yaml`
- Create: `be/src/modules/posts/post-content.policy.ts`
- Create: `be/src/modules/posts/post-content.policy.spec.ts`

**Interfaces:**

- Produces: `sanitizePostHtml(html: string): string`.
- Produces: `countPostWords(html: string): number`.
- Produces: `validateDraft(input: PostPolicyInput): void` and `validatePublish(input: PostPolicyInput): void`, throwing `BadRequestException` with `{ fieldErrors }`.

- [ ] **Step 1: Add failing policy tests**

Cover removal of script/events/dangerous protocols, preservation of allowed headings/images/links, blank draft rejection, and every publish boundary. Include:

```ts
it("rejects a 299-word post at publish time", () => {
  expect(() => validatePublish(validPost({ content: `<p>${"word ".repeat(299)}</p>` }))).toThrow(
    BadRequestException,
  );
});

it("removes scripts and javascript URLs", () => {
  expect(sanitizePostHtml('<script>x()</script><a href="javascript:x()">x</a>')).toBe("<a>x</a>");
});
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd be && pnpm test -- post-content.policy.spec.ts`

Expected: FAIL because `post-content.policy.ts` does not exist.

- [ ] **Step 3: Install sanitizer and implement allowlist**

Run: `cd be && pnpm add sanitize-html && pnpm add -D @types/sanitize-html`

Allow only `p,h2,h3,h4,strong,em,u,s,code,pre,ul,ol,li,blockquote,hr,br,a,img`; allow `href,target,rel` on links and `src,alt,title,width,height` on images; schemes only `http,https,mailto`. Normalize `_blank` links to `rel="noopener noreferrer"`.

- [ ] **Step 4: Implement exact validation boundaries**

Use a typed result payload:

```ts
export type PostFieldErrors = Partial<
  Record<
    | "title"
    | "slug"
    | "excerpt"
    | "content"
    | "categoryId"
    | "thumbnailFileId"
    | "coverImageFileId"
    | "thumbnailAlt"
    | "coverImageAlt"
    | "metaTitle"
    | "metaDescription"
    | "canonicalUrl",
    string
  >
>;
```

Draft requires title or meaningful HTML. Publish uses the numeric boundaries in the spec and validates canonical with `new URL()` plus `protocol === 'https:'`.

- [ ] **Step 5: Run policy tests**

Run: `cd be && pnpm test -- post-content.policy.spec.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add be/package.json be/pnpm-lock.yaml be/src/modules/posts/post-content.policy.ts be/src/modules/posts/post-content.policy.spec.ts
git commit -m "feat(posts): validate and sanitize article content"
```

### Task 3: Make slug handling canonical and redirect-safe

**Files:**

- Create: `be/src/modules/posts/post-slug.service.ts`
- Create: `be/src/modules/posts/post-slug.service.spec.ts`
- Modify: `be/src/modules/posts/posts.module.ts`

**Interfaces:**

- Produces: `normalizePostSlug(value: string): string`.
- Produces: `PostSlugService.assertAvailable(slug: string, excludePostId?: string): Promise<void>`.
- Produces: `PostSlugService.resolvePublicSlug(slug: string): Promise<{ kind: 'post'; postId: string } | { kind: 'redirect'; canonicalSlug: string } | null>`.
- Produces: `PostSlugService.recordPreviousSlug(tx, postId, slug): Promise<void>`.

- [ ] **Step 1: Write failing slug tests**

Test Vietnamese normalization, max 200 characters, current collision, history collision, excluded current post, and old-slug redirect:

```ts
expect(normalizePostSlug(" Hướng dẫn viết CV 2026 ")).toBe("huong-dan-viet-cv-2026");
await expect(service.assertAvailable("old-slug")).rejects.toThrow(ConflictException);
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd be && pnpm test -- post-slug.service.spec.ts`

Expected: FAIL because service is missing.

- [ ] **Step 3: Implement slug service**

Use Prisma queries against both `post` and `postSlugHistory`. Do not append timestamps to published URLs. For a draft with no usable title, create `draft-${postId}` after the UUID is known.

- [ ] **Step 4: Register provider and rerun tests**

Run: `cd be && pnpm test -- post-slug.service.spec.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add be/src/modules/posts/post-slug.service.ts be/src/modules/posts/post-slug.service.spec.ts be/src/modules/posts/posts.module.ts
git commit -m "feat(posts): preserve canonical article slugs"
```

### Task 4: Implement draft, autosave, preview, publish and archive APIs

**Files:**

- Modify: `be/src/modules/posts/dto/create-post.dto.ts`
- Modify: `be/src/modules/posts/dto/update-post.dto.ts`
- Create: `be/src/modules/posts/dto/publish-post.dto.ts`
- Modify: `be/src/modules/posts/admin-posts.controller.ts`
- Modify: `be/src/modules/posts/posts.service.ts`
- Create: `be/src/modules/posts/posts.service.spec.ts`

**Interfaces:**

- Consumes: policy and slug interfaces from Tasks 2–3.
- Produces: `PATCH /admin/posts/:id` with `expectedUpdatedAt` and 409 conflict.
- Produces: `GET /admin/posts/slug-availability`.
- Produces: `GET /admin/posts/:id/preview`.
- Produces: `POST /admin/posts/:id/publish` and `POST /admin/posts/:id/archive`.

- [ ] **Step 1: Write failing service tests**

Mock Prisma transaction and cover: create partial draft, sanitize before write, reject stale PATCH, update tags atomically, preserve first `publishedAt`, archive, republish, record old slug, and reject invalid publish.

```ts
await expect(
  service.update(postId, { expectedUpdatedAt: staleIso, title: "New" }),
).rejects.toMatchObject({ status: 409 });
expect(tx.post.update).toHaveBeenCalledWith(
  expect.objectContaining({
    data: expect.objectContaining({ publishedAt: existingPublishedAt }),
  }),
);
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd be && pnpm test -- posts.service.spec.ts`

Expected: FAIL for missing workflow methods.

- [ ] **Step 3: Define DTOs and remove unsafe fields**

Create/update DTOs with `@MaxLength`, `@IsUrl({ protocols: ['https'], require_protocol: true })`, UUID validation and `expectedUpdatedAt: string`. Remove `viewCount` from all write DTOs. Convert empty nullable IDs to `null` explicitly rather than accepting empty strings.

- [ ] **Step 4: Add controller routes and permission guard**

Apply `AdminPermissionsGuard` and `@AdminPermissions('posts:manage')` at `AdminPostsController` class level so list, taxonomy, preview and mutations follow one authorization rule. Declare static routes before `@Get(':id')`.

- [ ] **Step 5: Implement transactional service workflow**

Use `$transaction(async tx => ...)` for post/tags/slug history. Compare `expectedUpdatedAt` to the record read in the same transaction. Return `{ post, canonicalSlug }` for preview and a stable response shape for mutations.

- [ ] **Step 6: Run focused and module tests**

Run: `cd be && pnpm test -- posts.service.spec.ts post-slug.service.spec.ts post-content.policy.spec.ts`

Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add be/src/modules/posts/dto be/src/modules/posts/admin-posts.controller.ts be/src/modules/posts/posts.service.ts be/src/modules/posts/posts.service.spec.ts
git commit -m "feat(posts): add editorial publishing workflow"
```

### Task 5: Resolve public posts and old slugs safely

**Files:**

- Modify: `be/src/modules/posts/public-posts.controller.ts`
- Modify: `be/src/modules/posts/posts.service.ts`
- Modify: `be/src/modules/posts/posts.service.spec.ts`

**Interfaces:**

- Produces response union: `{ kind: 'post'; post: PublicPost } | { kind: 'redirect'; canonicalSlug: string }`.
- Public post includes SEO/social fields, category/tags/admin, alt text, `publishedAt`, `updatedAt`.

- [ ] **Step 1: Add failing public resolution tests**

Test published current slug, archived/draft 404, unknown 404 and history redirect. Assert view count increments only for `kind: 'post'`, never redirect.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd be && pnpm test -- posts.service.spec.ts`

Expected: new cases FAIL.

- [ ] **Step 3: Implement resolution response**

Resolve history before throwing not found. Select only public-safe fields and do not expose unpublished records or internal admin permissions.

- [ ] **Step 4: Verify backend module**

Run: `cd be && pnpm typecheck && pnpm lint && pnpm test -- posts.service.spec.ts && pnpm build`

Expected: all exit 0.

- [ ] **Step 5: Commit**

```bash
git add be/src/modules/posts/public-posts.controller.ts be/src/modules/posts/posts.service.ts be/src/modules/posts/posts.service.spec.ts
git commit -m "feat(posts): resolve canonical public articles"
```

### Task 6: Build frontend contracts, schemas and Yoast-style analyzers

**Files:**

- Modify: `fe/src/features/admin/api/posts.ts`
- Replace: `fe/src/features/admin/components/content/articles/article-form-schema.ts`
- Create: `fe/src/features/admin/components/content/articles/article-form-schema.test.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/article-seo-analysis.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/article-seo-analysis.test.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/article-readability-analysis.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/article-readability-analysis.test.ts`

**Interfaces:**

- Produces: `ArticleFormValues`, `draftArticleSchema`, `publishArticleSchema`, `toDraftPayload(values, expectedUpdatedAt)`.
- Produces: `AnalysisItem = { id: string; level: 'good' | 'improvement' | 'problem' | 'unknown'; messageKey: string; target?: string }`.
- Produces: `analyzeArticleSeo(values, html): AnalysisItem[]`, `analyzeArticleReadability(html): AnalysisItem[]`, `resolveSeoTitle(template, variables): string`.

- [ ] **Step 1: Write failing schema/analyzer tests**

Include exact boundaries, fallback title variables, Vietnamese keyphrase normalization, missing image alt, internal link, opening paragraph, heading hierarchy and long paragraph:

```ts
expect(
  resolveSeoTitle("%title% %separator% %site_name%", {
    title: "Viết CV IT",
    separator: "|",
    siteName: "UpNext",
  }),
).toBe("Viết CV IT | UpNext");
expect(analyzeArticleReadability("<h2>A</h2><h4>B</h4>")).toContainEqual(
  expect.objectContaining({ id: "heading-order", level: "problem" }),
);
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd fe && pnpm test -- article-form-schema.test.ts article-seo-analysis.test.ts article-readability-analysis.test.ts`

Expected: FAIL for missing exports/files.

- [ ] **Step 3: Implement exact API contracts**

Remove `[key: string]: any`. Add all SEO/social/alt/published fields, upload purposes `POST_CONTENT | POST_SOCIAL`, and functions `checkAdminPostSlug`, `getAdminPostPreview`, `publishAdminPost`, `archiveAdminPost`. Model 409 payload as `{ message: string; serverPost: AdminPostResponse }`.

- [ ] **Step 4: Implement schemas and pure analyzers**

Keep SEO recommendations separate from publish blockers. Use `DOMParser` only inside browser-safe analyzer functions; for unit tests in jsdom this is available. Return message keys, not hardcoded UI strings.

- [ ] **Step 5: Run focused tests**

Run: `cd fe && pnpm test -- article-form-schema.test.ts article-seo-analysis.test.ts article-readability-analysis.test.ts`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add fe/src/features/admin/api/posts.ts fe/src/features/admin/components/content/articles/article-form-schema.ts fe/src/features/admin/components/content/articles/article-form-schema.test.ts fe/src/features/admin/components/content/articles/editor/article-seo-analysis.ts fe/src/features/admin/components/content/articles/editor/article-seo-analysis.test.ts fe/src/features/admin/components/content/articles/editor/article-readability-analysis.ts fe/src/features/admin/components/content/articles/editor/article-readability-analysis.test.ts
git commit -m "feat(admin): add article SEO analysis model"
```

### Task 7: Implement local recovery and serialized autosave

**Files:**

- Create: `fe/src/features/admin/components/content/articles/editor/article-draft-storage.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/article-draft-storage.test.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/use-article-autosave.ts`
- Create: `fe/src/features/admin/components/content/articles/editor/use-article-autosave.test.tsx`

**Interfaces:**

- Produces: `saveLocalArticleDraft`, `loadLocalArticleDraft`, `removeLocalArticleDraft` with 7-day expiry and account-scoped key.
- Produces: `useArticleAutosave({ postId, adminId, values, serverUpdatedAt, enabled, save })` returning `{ status, flush, discardLocal, conflict }`.
- `AutosaveStatus = 'saved' | 'saving' | 'unsynced' | 'conflict'`.

- [ ] **Step 1: Write failing storage and hook tests**

Use fake timers. Test create snapshot at 1 second, server PATCH at 2 seconds, one in-flight request, queued second save, online retry, manual flush, 409 conflict and expiry.

```ts
vi.useFakeTimers();
await act(() => vi.advanceTimersByTimeAsync(2000));
expect(save).toHaveBeenCalledTimes(1);
```

- [ ] **Step 2: Run tests to verify failure**

Run: `cd fe && pnpm test -- article-draft-storage.test.ts use-article-autosave.test.tsx`

Expected: FAIL because modules are absent.

- [ ] **Step 3: Implement versioned local snapshot**

Persist `{ version: 1, postId, adminId, values, serverUpdatedAt, savedAt }`; parse through Zod and delete corrupt/expired records. Never persist File objects or access tokens.

- [ ] **Step 4: Implement autosave state machine**

Serialize promises, coalesce dirty updates and use `online` event for retry. `flush()` cancels debounce and awaits the latest queued save. On 409 stop retry and preserve the local snapshot.

- [ ] **Step 5: Run focused tests**

Run: `cd fe && pnpm test -- article-draft-storage.test.ts use-article-autosave.test.tsx`

Expected: PASS without timer leaks.

- [ ] **Step 6: Commit**

```bash
git add fe/src/features/admin/components/content/articles/editor/article-draft-storage.ts fe/src/features/admin/components/content/articles/editor/article-draft-storage.test.ts fe/src/features/admin/components/content/articles/editor/use-article-autosave.ts fe/src/features/admin/components/content/articles/editor/use-article-autosave.test.tsx
git commit -m "feat(admin): autosave article drafts safely"
```

### Task 8: Build the article editor, media and taxonomy controls

**Files:**

- Modify: `fe/package.json`
- Modify: `fe/pnpm-lock.yaml`
- Create: `fe/src/features/admin/components/content/articles/editor/article-rich-text-editor.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-rich-text-editor.test.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-content-fields.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-taxonomy-panel.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-media-panel.tsx`
- Create: component tests beside each file.

**Interfaces:**

- Consumes: `Control<ArticleFormValues>`, `UseFormRegister<ArticleFormValues>`, upload API.
- Produces: HTML limited to H2–H4 and backend allowlist.
- Produces media value fields containing uploaded file IDs and required alt text.

- [ ] **Step 1: Add failing editor/media tests**

Test no H1 control, keyboard toolbar, validated link dialog, image alt required before insertion, upload progress/retry, file size/type rejection and searchable tags keyboard selection.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd fe && pnpm test -- article-rich-text-editor.test.tsx article-media-panel.test.tsx article-taxonomy-panel.test.tsx`

Expected: FAIL because components do not exist.

- [ ] **Step 3: Install image extension and build editor**

Run: `cd fe && pnpm add @tiptap/extension-image`

Create article-specific Tiptap extensions. Inline images upload with `POST_CONTENT`; the separate social card uploads with `POST_SOCIAL`. Keep toolbar buttons as native buttons with `aria-pressed`, Phosphor icons and localized tooltips. Use an accessible dialog component for links/images instead of `window.prompt`.

- [ ] **Step 4: Build content, taxonomy and media panels**

Use existing Card/Input/Select/Button primitives. Media input accepts JPEG/PNG/WebP, checks the same maximum configured by the file API, uploads PUBLIC assets, and stores IDs only after success.

- [ ] **Step 5: Run component tests**

Run: `cd fe && pnpm test -- article-rich-text-editor.test.tsx article-media-panel.test.tsx article-taxonomy-panel.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add fe/package.json fe/pnpm-lock.yaml fe/src/features/admin/components/content/articles/editor
git commit -m "feat(admin): build article content editor"
```

### Task 9: Build the WordPress/Yoast-style SEO meta box

**Files:**

- Create: `fe/src/features/admin/components/content/articles/editor/article-seo-panel.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-search-preview.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-social-preview.tsx`
- Create: tests beside all three files.

**Interfaces:**

- Consumes analyzers from Task 6 and `ArticleFormValues`.
- Produces four tabs: SEO, readability, social and advanced.
- Produces desktop/mobile snippet preview and Facebook/LinkedIn/X preview.

- [ ] **Step 1: Write failing interaction tests**

Test traffic-light grouping, unknown state without keyphrase, issue click focuses target, desktop/mobile toggle, inline snippet editing, `%title%` token insertion, social fallbacks, canonical warning and robots labels.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd fe && pnpm test -- article-seo-panel.test.tsx article-search-preview.test.tsx article-social-preview.test.tsx`

Expected: FAIL because components are absent.

- [ ] **Step 3: Implement meta box**

Use accessible Radix Tabs. Render each analysis item with icon, text and state label; color is supplementary. Keep score deterministic and do not display a fake percentage.

- [ ] **Step 4: Implement previews and advanced fields**

Preview uses the same resolver as public metadata. Add character meters with warning bands, not hard maxlength at recommended SEO length. Canonical cross-domain confirmation is required before publish but draft save remains allowed.

- [ ] **Step 5: Run tests**

Run: `cd fe && pnpm test -- article-seo-panel.test.tsx article-search-preview.test.tsx article-social-preview.test.tsx`

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add fe/src/features/admin/components/content/articles/editor/article-seo-panel.tsx fe/src/features/admin/components/content/articles/editor/article-seo-panel.test.tsx fe/src/features/admin/components/content/articles/editor/article-search-preview.tsx fe/src/features/admin/components/content/articles/editor/article-search-preview.test.tsx fe/src/features/admin/components/content/articles/editor/article-social-preview.tsx fe/src/features/admin/components/content/articles/editor/article-social-preview.test.tsx
git commit -m "feat(admin): add Yoast-style SEO guidance"
```

### Task 10: Orchestrate the responsive Admin editor workflow

**Files:**

- Create: `fe/src/features/admin/components/content/articles/editor/article-editor-page.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-editor-page.test.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-editor-header.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-publish-panel.tsx`
- Create: `fe/src/features/admin/components/content/articles/editor/article-preview-dialog.tsx`
- Modify: `fe/src/app/[locale]/(workspace)/admin/content/articles/new/page.tsx`
- Modify: `fe/src/app/[locale]/(workspace)/admin/content/articles/[id]/edit/page.tsx`
- Remove: `fe/src/features/admin/components/content/articles/article-form.tsx`
- Modify: `fe/messages/vi.json`
- Modify: `fe/messages/en.json`
- Modify: `fe/src/mocks/handlers.ts`

**Interfaces:**

- Consumes all Admin editor units from Tasks 6–9.
- Produces create/edit routes, restore banner, sync state, preview, publish/archive actions and responsive sticky actions.

- [ ] **Step 1: Add failing orchestration tests**

Cover create restore/discard, first explicit draft save, edit load, autosave label announcements, manual flush before preview/publish, field error summary/focus, 401 redirect, 409 conflict UI and archive confirmation.

- [ ] **Step 2: Run test to verify failure**

Run: `cd fe && pnpm test -- article-editor-page.test.tsx`

Expected: FAIL because editor page is absent.

- [ ] **Step 3: Implement editor page and actions**

Use `useForm<ArticleFormValues>`, TanStack Query and mutation conventions. Layout: sticky header; `lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]`; one column and bottom sticky CTA on mobile. Flush pending autosave before preview/status mutation.

- [ ] **Step 4: Implement error/conflict/leave behavior**

Use an `aria-live="polite"` sync label. Map API field errors with `setError`; focus the first invalid field. Preserve local snapshot on 403/409/5xx. Register `beforeunload` only when changes are neither on server nor local snapshot.

- [ ] **Step 5: Swap routes and synchronize translations/mocks**

Both route files render `<ArticleEditorPage mode="create" />` or `<ArticleEditorPage mode="edit" postId={id} />`. Add every new key to both catalogs. Remove legacy form only after `rg "ArticleForm" fe/src` finds no imports.

- [ ] **Step 6: Run Admin editor verification**

Run: `cd fe && pnpm typecheck && pnpm lint && pnpm test -- article-editor-page.test.tsx article-seo-panel.test.tsx use-article-autosave.test.tsx`

Expected: all exit 0.

- [ ] **Step 7: Commit**

```bash
git add fe/src/app fe/src/features/admin/components/content/articles fe/messages/vi.json fe/messages/en.json fe/src/mocks/handlers.ts
git commit -m "feat(admin): replace article authoring workflow"
```

### Task 11: Render per-article public metadata, JSON-LD and redirects

**Files:**

- Modify: `fe/src/features/posts/types/post.ts`
- Modify: `fe/src/features/posts/api/posts.ts`
- Modify: `fe/src/app/[locale]/(public)/posts/[slug]/page.tsx`
- Create: `fe/src/app/[locale]/(public)/posts/[slug]/page.test.tsx`
- Modify: `fe/src/features/posts/components/post-detail-content.tsx`
- Create: `fe/src/features/posts/components/post-detail-content.test.tsx`

**Interfaces:**

- Consumes public response union from Task 5.
- Produces `buildPostMetadata(post, locale): Metadata` and `buildPostJsonLd(post, canonicalUrl)` pure exports for tests.

- [ ] **Step 1: Write failing metadata tests**

Test full data, every fallback, title variables, self canonical, custom canonical, robots combinations, NewsArticle/Article selection, breadcrumb and social image fallback. Mock `notFound` and `permanentRedirect` for status/slug cases.

- [ ] **Step 2: Run tests to verify failure**

Run: `cd fe && pnpm test -- 'src/app/[locale]/(public)/posts/[slug]/page.test.tsx'`

Expected: FAIL because current metadata is static.

- [ ] **Step 3: Implement server fetch and metadata**

`generateMetadata` awaits locale/slug and fetches the post server-side. Use `cache()` to deduplicate the page and metadata request during a render. Return notFound for unknown/unpublished and permanentRedirect for history response.

- [ ] **Step 4: Add safe JSON-LD and initial post hydration**

Serialize JSON-LD with `<` escaped as `\u003c`. Pass `initialPost` to `PostDetailContent`; the client component must not fetch the same slug again when initial data exists.

- [ ] **Step 5: Run public tests and build**

Run: `cd fe && pnpm test -- 'src/app/[locale]/(public)/posts/[slug]/page.test.tsx' post-detail-content.test.tsx && pnpm build`

Expected: PASS and production build exit 0.

- [ ] **Step 6: Commit**

```bash
git add fe/src/features/posts fe/src/app/[locale]/\(public\)/posts
git commit -m "feat(posts): publish dynamic article SEO metadata"
```

### Task 12: Verify the complete editorial flow, accessibility and regression safety

**Files:**

- Create: `fe/e2e/admin-article-editor.spec.ts`
- Modify implementation files only in the focused component/backend files whose failing verification proves a defect.

**Interfaces:**

- End-to-end contract: create local draft → restore → save server draft → autosave → preview → publish → open public metadata/content → archive → public 404.

- [ ] **Step 1: Add Playwright API fixtures and critical-flow spec**

Mock or seed admin session and post endpoints consistently with existing E2E fixtures. Assert visible behavior, not component internals. Include desktop and one mobile project/test viewport.

- [ ] **Step 2: Run the new E2E spec**

Run: `cd fe && pnpm test:e2e -- e2e/admin-article-editor.spec.ts`

Expected: PASS for create/edit/public/archive and mobile sticky actions.

- [ ] **Step 3: Perform accessibility review**

Follow `.agents/skills/accessibility-review/SKILL.md`. Verify keyboard-only operation, focus order/trap/return, error associations, `aria-live` autosave, contrast, 200% zoom, reduced motion and 44px mobile targets. Record and fix every issue found in scope.

- [ ] **Step 4: Perform browser verification**

Follow `.agents/skills/browser-playwright-verification/SKILL.md`. Inspect create, restored draft, populated editor, SEO tabs, preview, validation failure, offline/409, published and archived states at desktop/tablet/mobile widths.

- [ ] **Step 5: Run complete backend gates**

Run: `cd be && pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build`

Expected: all exit 0.

- [ ] **Step 6: Run complete frontend gates**

Run: `cd fe && pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm build && pnpm test:e2e -- e2e/admin-article-editor.spec.ts`

Expected: all exit 0.

- [ ] **Step 7: Commit verification fixes and E2E coverage**

```bash
git add fe/e2e/admin-article-editor.spec.ts
git commit -m "test(posts): verify SEO article workflow"
```

---

## Rollout Checkpoint

1. Deploy migration/backend first; verify health and a manual draft/publish API request.
2. Confirm published legacy posts have `publishedAt` backfilled and still resolve by current slug.
3. Deploy frontend Admin/public changes.
4. Smoke-test one new draft, one legacy published post and one changed slug redirect.
5. Monitor autosave 409/error rate, publish validation failures, public post 404 rate and metadata endpoint latency.

## Definition of Done

- No route imports legacy `ArticleForm`.
- Draft, autosave, recovery, conflict, preview, publish and archive behaviors are tested.
- SEO/readability analysis is deterministic, localized and never presented as a ranking guarantee.
- Metadata/JSON-LD/canonical/social tags are specific to each published article.
- Old published slugs permanently redirect to the current slug.
- Draft/archived/unknown posts are not publicly readable or indexable.
- Backend and frontend quality gates plus targeted Playwright pass with fresh output.
- Browser and accessibility reviews contain no unresolved in-scope blocker.
