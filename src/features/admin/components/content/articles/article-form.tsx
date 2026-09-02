"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import {
  CaretLeft,
  FloppyDisk,
  PaperPlaneTilt,
  Trash,
  UploadSimple,
  Sparkle,
  Globe,
} from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Swal from "sweetalert2";

import {
  createAdminPost,
  getAdminPostCategories,
  getAdminPostDetails,
  getAdminPostTags,
  updateAdminPost,
  uploadPostImage,
  type AdminPostCategory,
  type AdminPostResponse,
  type AdminPostTag,
  type CreateAdminPostPayload,
  type PostStatus,
} from "@/features/admin/api/posts";
import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { RichTextEditor } from "@/shared/ui/rich-text-editor";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";

import { articleFormSchema, type ArticleFormValues } from "./article-form-schema";
import { SeoChecker } from "./seo-checker";
import { TagMultiSelect } from "./tag-multi-select";

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 4000,
  timerProgressBar: true,
});

const NO_CATEGORY = "none";

const TYPE_OPTIONS: Array<{ value: ArticleFormValues["type"]; label: string }> = [
  { value: "BLOG", label: "Blog" },
  { value: "NEWS", label: "Tin tức" },
  { value: "FAQ", label: "FAQ" },
];

const EMPTY_VALUES: ArticleFormValues = {
  title: "",
  content: "",
  type: "BLOG",
  categoryId: NO_CATEGORY,
  tagIds: [],
  focusKeyword: "",
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  thumbnailFileId: "",
  coverImageFileId: "",
};

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function toFormValues(post: AdminPostResponse): ArticleFormValues {
  return {
    title: post.title ?? "",
    content: post.content ?? "",
    type: post.type ?? "BLOG",
    categoryId: post.categoryId || post.category?.id || NO_CATEGORY,
    tagIds: (post.postTags ?? []).map((relation) => relation.tagId),
    focusKeyword: post.focusKeyword ?? (post.metaKeywords ?? "").split(",")[0]?.trim() ?? "",
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    metaKeywords: post.metaKeywords ?? "",
    thumbnailFileId: post.thumbnailFileId ?? "",
    coverImageFileId: post.coverImageFileId ?? "",
  };
}

function toPayload(values: ArticleFormValues, targetStatus: PostStatus): CreateAdminPostPayload {
  const optionalText = (value: string | undefined, max?: number) => {
    if (!value) return undefined;
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    return max ? trimmed.slice(0, max) : trimmed;
  };

  const plain = stripHtml(values.content);
  const title = values.title.trim();

  // Smart auto-fills for SEO and media
  let metaTitle = optionalText(values.metaTitle, 70);
  if (!metaTitle && title) {
    metaTitle = title.slice(0, 70);
  }

  let metaDescription = optionalText(values.metaDescription, 180);
  if (!metaDescription && plain) {
    metaDescription = plain.slice(0, 160);
  }

  const excerpt = metaDescription || (plain ? plain.slice(0, 300) : undefined);

  // Fallback: If only thumbnail or only cover image was uploaded, mirror to both
  const thumbId = values.thumbnailFileId || values.coverImageFileId || null;
  const coverId = values.coverImageFileId || values.thumbnailFileId || null;

  return {
    title,
    content: values.content,
    status: targetStatus,
    type: values.type,
    categoryId: values.categoryId === NO_CATEGORY || !values.categoryId ? null : values.categoryId,
    thumbnailFileId: thumbId,
    coverImageFileId: coverId,
    thumbnailAlt: thumbId ? title.slice(0, 255) : undefined,
    coverImageAlt: coverId ? title.slice(0, 255) : undefined,
    excerpt,
    metaTitle,
    metaDescription,
    metaKeywords: optionalText(values.metaKeywords, 500),
    focusKeyword: optionalText(values.focusKeyword, 120),
    tagIds: values.tagIds ?? [],
  };
}

function translateErrorMessage(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes("slug is already in use") || lower.includes("slug already exists")) {
    return "Tiêu đề hoặc đường dẫn bài viết này đã tồn tại. Vui lòng đổi tiêu đề khác.";
  }
  if (lower.includes("thumbnailfileid") || lower.includes("thumbnail image")) {
    return "Vui lòng tải lên Ảnh thumbnail đại diện cho bài viết.";
  }
  if (lower.includes("coverimagefileid") || lower.includes("cover image")) {
    return "Vui lòng tải lên Ảnh bìa bài viết.";
  }
  if (lower.includes("categoryid") || lower.includes("choose a category")) {
    return "Vui lòng chọn Danh mục bài viết ở cột Phân loại bên phải.";
  }
  if (lower.includes("metatitle") || lower.includes("meta title")) {
    return "Tiêu đề SEO (Meta Title) cần có độ dài từ 30 đến 70 ký tự.";
  }
  if (lower.includes("metadescription") || lower.includes("meta description")) {
    return "Mô tả SEO (Meta Description) cần có độ dài từ 120 đến 180 ký tự.";
  }
  if (
    lower.includes("content") &&
    (lower.includes("300 words") || lower.includes("at least 300"))
  ) {
    return "Nội dung bài viết cần đạt tối thiểu 300 từ khi xuất bản.";
  }
  if (lower.includes("title") && lower.includes("between 10")) {
    return "Tiêu đề bài viết cần có từ 10 đến 255 ký tự.";
  }
  if (lower.includes("excerpt")) {
    return "Đoạn trích tóm tắt cần có từ 50 đến 500 ký tự.";
  }
  return msg;
}

function getSubmitErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.payload && typeof error.payload === "object") {
      const data = error.payload as Record<string, any>;
      if (Array.isArray(data.message) && data.message.length > 0) {
        return data.message.map((m: string) => translateErrorMessage(m)).join("\n");
      }
      if (typeof data.message === "string") {
        return translateErrorMessage(data.message);
      }
      if (data.fieldErrors && typeof data.fieldErrors === "object") {
        return Object.values(data.fieldErrors)
          .map((msg: any) => translateErrorMessage(String(msg)))
          .join("\n");
      }
    }
    if (error.status === 409)
      return "Tiêu đề hoặc đường dẫn bài viết này đã tồn tại trong hệ thống.";
    if (error.status === 400)
      return "Dữ liệu chưa đúng chuẩn. Vui lòng kiểm tra lại các trường theo hướng dẫn.";
    if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy danh mục hoặc bài viết.";
    if (error.status >= 500) return "Máy chủ đang bận. Vui lòng thử lại sau giây lát.";
    return translateErrorMessage(error.message);
  }
  return "Không thể lưu bài viết. Vui lòng thử lại.";
}

type ArticleFormProps = { mode: "create" } | { mode: "edit"; postId: string };

export function ArticleForm(props: ArticleFormProps) {
  const isEdit = props.mode === "edit";
  const postId = props.mode === "edit" ? props.postId : null;

  const router = useRouter();
  const queryClient = useQueryClient();
  const [imagePreviews, setImagePreviews] = useState<{ thumbnail: string; cover: string }>({
    thumbnail: "",
    cover: "",
  });
  const [uploadingField, setUploadingField] = useState<"thumbnail" | "cover" | null>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const {
    data: post,
    isLoading: isPostLoading,
    error: postError,
  } = useQuery({
    enabled: Boolean(postId),
    queryKey: ["adminPost", postId],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminPostDetails(session.accessToken, postId!);
    },
    retry: false,
  });

  const { data: categories = [] } = useQuery({
    queryKey: ["adminPostCategories"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminPostCategories(session.accessToken);
    },
    staleTime: 10 * 60 * 1000,
  });

  const { data: tags = [] } = useQuery({
    queryKey: ["adminPostTags"],
    queryFn: async () => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      return getAdminPostTags(session.accessToken);
    },
    staleTime: 10 * 60 * 1000,
  });

  const allCategories = useMemo(() => {
    const map = new Map<string, AdminPostCategory>();
    for (const c of categories) map.set(c.id, c);
    if (post?.category) {
      map.set(post.category.id, post.category);
    }
    return Array.from(map.values());
  }, [categories, post?.category]);

  const allTags = useMemo(() => {
    const map = new Map<string, AdminPostTag>();
    for (const t of tags) map.set(t.id, t);
    for (const pt of post?.postTags ?? []) {
      if (pt.tag) map.set(pt.tag.id, pt.tag);
    }
    return Array.from(map.values());
  }, [tags, post?.postTags]);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<ArticleFormValues>({
    defaultValues: EMPTY_VALUES,
    resolver: zodResolver(articleFormSchema),
  });

  const watchedTitle = watch("title") || "";
  const watchedContent = watch("content") || "";
  const watchedMetaTitle = watch("metaTitle") || "";
  const watchedMetaDescription = watch("metaDescription") || "";
  const watchedMetaKeywords = watch("metaKeywords") || "";
  const watchedFocusKeyword = watch("focusKeyword") || "";
  const watchedCategoryId = watch("categoryId") || NO_CATEGORY;
  const watchedTagIds = watch("tagIds") || [];
  const watchedThumbnailId = watch("thumbnailFileId") || "";
  const watchedCoverId = watch("coverImageFileId") || "";

  useEffect(() => {
    if (!post) return;
    reset(toFormValues(post));
    setImagePreviews({
      thumbnail: post.thumbnailFile?.publicUrl ?? "",
      cover: post.coverImageFile?.publicUrl ?? "",
    });
  }, [post, reset]);

  useEffect(() => {
    if (!postError) return;
    if (postError instanceof Error && postError.message === "No session") {
      router.replace("/admin/login");
    } else if (postError instanceof ApiError && postError.status === 401) {
      clearAdminSession();
      router.replace("/admin/login");
    }
  }, [postError, router]);

  const saveMutation = useMutation({
    mutationFn: async ({
      values,
      targetStatus,
    }: {
      values: ArticleFormValues;
      targetStatus: PostStatus;
    }) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      const payload = toPayload(values, targetStatus);

      if (postId && post) {
        return updateAdminPost(session.accessToken, postId, {
          ...payload,
          expectedUpdatedAt: post.updatedAt,
        });
      } else {
        return createAdminPost(session.accessToken, payload);
      }
    },
    onSuccess: (saved, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      if (postId) void queryClient.invalidateQueries({ queryKey: ["adminPost", postId] });
      void toast.fire({
        icon: "success",
        title:
          variables.targetStatus === "PUBLISHED"
            ? "Đã xuất bản bài viết thành công!"
            : isEdit
              ? "Đã lưu thay đổi."
              : "Đã lưu bản nháp.",
      });
      router.push(`/admin/content/articles/${saved.id}`);
    },
    onError: (error) => {
      void toast.fire({
        icon: "error",
        title: getSubmitErrorMessage(error),
      });
    },
  });

  async function handleImageUpload(field: "thumbnail" | "cover", file: File) {
    const session = getAdminSession();
    if (!session) {
      router.replace("/admin/login");
      return;
    }

    setUploadingField(field);
    try {
      const response = await uploadPostImage(
        session.accessToken,
        file,
        field === "thumbnail" ? "POST_THUMBNAIL" : "POST_COVER",
      );
      setValue(field === "thumbnail" ? "thumbnailFileId" : "coverImageFileId", response.file.id, {
        shouldDirty: true,
      });
      setImagePreviews((previous) => ({ ...previous, [field]: response.file.publicUrl }));
    } catch {
      void toast.fire({ icon: "error", title: "Tải ảnh lên thất bại. Vui lòng thử lại." });
    } finally {
      setUploadingField(null);
    }
  }

  function clearImage(field: "thumbnail" | "cover") {
    setValue(field === "thumbnail" ? "thumbnailFileId" : "coverImageFileId", "", {
      shouldDirty: true,
    });
    setImagePreviews((previous) => ({ ...previous, [field]: "" }));
  }

  function submitWithStatus(targetStatus: PostStatus) {
    return handleSubmit((values: ArticleFormValues) => {
      // Friendly Vietnamese business checks before publishing:
      if (targetStatus === "PUBLISHED") {
        const titleTrimmed = values.title.trim();
        if (titleTrimmed.length < 10) {
          void toast.fire({
            icon: "warning",
            title: "Tiêu đề bài viết cần có từ 10 đến 255 ký tự.",
          });
          return;
        }

        const plainText = stripHtml(values.content);
        const words = countWords(plainText);
        if (words < 300) {
          void toast.fire({
            icon: "warning",
            title: `Nội dung bài viết hiện có ${words} từ. Cần tối thiểu 300 từ để xuất bản.`,
          });
          return;
        }

        if (!values.categoryId || values.categoryId === NO_CATEGORY) {
          void toast.fire({
            icon: "warning",
            title: "Vui lòng chọn Danh mục bài viết ở cột Phân loại bên phải trước khi Xuất bản.",
          });
          return;
        }

        if (!values.thumbnailFileId && !imagePreviews.thumbnail) {
          void toast.fire({
            icon: "warning",
            title: "Vui lòng tải lên Ảnh thumbnail đại diện cho bài viết.",
          });
          return;
        }
      }

      return saveMutation.mutateAsync({ values, targetStatus });
    });
  }

  function handleAutoFillMetaTitle() {
    if (watchedTitle.trim()) {
      setValue("metaTitle", watchedTitle.trim().slice(0, 70), { shouldDirty: true });
    }
  }

  function handleAutoExtractMetaDescription() {
    const plain = stripHtml(watchedContent);
    if (plain) {
      setValue("metaDescription", plain.slice(0, 160).trim(), { shouldDirty: true });
    }
  }

  const isBusy = isSubmitting || saveMutation.isPending || uploadingField !== null;
  const currentStatus: PostStatus = post?.status ?? "DRAFT";

  if (isEdit && isPostLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-[520px] w-full rounded-2xl" />
      </div>
    );
  }

  if (isEdit && (postError || !post)) {
    return (
      <div className="space-y-6">
        <Link href="/admin/content/articles">
          <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
            <CaretLeft size={20} />
            Quay lại danh sách
          </Button>
        </Link>
        <Card className="flex h-64 items-center justify-center border border-slate-200 p-6 text-center">
          <p className="text-error font-medium">Không thể tải bài viết.</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 1. Header Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/admin/content/articles">
            <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
              <CaretLeft size={20} />
              Quay lại danh sách
            </Button>
          </Link>
          <div className="mt-1">
            <h1 className="text-2xl font-bold text-slate-900">
              {isEdit ? "Chỉnh sửa bài viết" : "Viết bài mới"}
            </h1>
            <p className="mt-0.5 text-xs text-slate-500">
              Cập nhật nội dung, phân loại và thông tin SEO của bài viết.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEdit ? (
            <Badge
              tone={
                currentStatus === "PUBLISHED"
                  ? "success"
                  : currentStatus === "ARCHIVED"
                    ? "neutral"
                    : "warning"
              }
            >
              {currentStatus === "PUBLISHED"
                ? "Đã xuất bản"
                : currentStatus === "ARCHIVED"
                  ? "Lưu trữ"
                  : "Bản nháp"}
            </Badge>
          ) : null}
          <Button
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => void submitWithStatus(isEdit ? currentStatus : "DRAFT")()}
          >
            <FloppyDisk size={16} />
            {isEdit ? "Lưu thay đổi" : "Lưu nháp"}
          </Button>
          {currentStatus !== "PUBLISHED" ? (
            <Button
              size="sm"
              disabled={isBusy}
              onClick={() => void submitWithStatus("PUBLISHED")()}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <PaperPlaneTilt size={16} />
              Xuất bản
            </Button>
          ) : null}
        </div>
      </div>

      {/* 2. Two-Column Layout Grid */}
      <form className="grid gap-6 lg:grid-cols-3" onSubmit={submitWithStatus("DRAFT")}>
        {/* Left 2 Columns: Main Editor + Meta Card + SEO Checker */}
        <div className="space-y-6 lg:col-span-2">
          {/* Card 1: Main Title & Content Editor */}
          <Card className="space-y-5 border border-slate-200 p-6 shadow-xs">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-title" className="text-sm font-semibold text-slate-700">
                Tiêu đề <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="article-title"
                placeholder="Nhập tiêu đề bài viết..."
                className="h-11 text-base font-medium"
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-xs font-medium text-red-500">{errors.title.message}</p>
              ) : null}
              {post?.slug ? (
                <p className="text-muted-foreground mt-0.5 flex items-center gap-1 text-xs break-all">
                  <Globe className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span>
                    Đường dẫn:{" "}
                    <span className="font-mono break-all text-emerald-700">
                      {post.slug} (tự sinh từ Tiêu đề)
                    </span>
                  </span>
                </p>
              ) : (
                <p className="text-muted-foreground mt-0.5 text-xs break-all">
                  Đường dẫn:{" "}
                  <span className="font-mono break-all text-slate-500">
                    {watchedTitle
                      ? watchedTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-")
                      : "tieu-de-bai-viet"}{" "}
                    (tự sinh từ Tiêu đề)
                  </span>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold text-slate-700">
                  Nội dung <span className="text-rose-600">*</span>
                </Label>
              </div>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <RichTextEditor
                    key={post?.id ?? "new"}
                    expandable
                    error={Boolean(errors.content)}
                    value={field.value}
                    onChange={field.onChange}
                    placeholder="Viết nội dung bài viết..."
                  />
                )}
              />
              {errors.content ? (
                <p className="text-xs font-medium text-red-500">{errors.content.message}</p>
              ) : null}
            </div>
          </Card>

          {/* Card 2: SEO Meta Settings */}
          <Card className="space-y-5 border border-slate-200 p-6 shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h2 className="text-base font-bold text-slate-900">Tối ưu SEO</h2>
                <p className="text-xs text-slate-500">Thiết lập các thẻ Meta tùy chỉnh.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 gap-1.5 text-xs"
                onClick={() => {
                  handleAutoFillMetaTitle();
                  handleAutoExtractMetaDescription();
                }}
              >
                <Sparkle size={14} className="text-emerald-600" /> Tự động điền
              </Button>
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label
                  htmlFor="article-meta-title"
                  className="text-sm font-semibold text-slate-700"
                >
                  Meta title
                </Label>
                <span className="font-mono text-[11px] text-slate-400">
                  {watchedMetaTitle.length}/70 ký tự
                </span>
              </div>
              <Input
                id="article-meta-title"
                placeholder={watchedTitle || "Tiêu đề hiển thị trên công cụ tìm kiếm"}
                {...register("metaTitle")}
              />
              {errors.metaTitle ? (
                <p className="text-xs font-medium text-red-500">{errors.metaTitle.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="article-meta-desc" className="text-sm font-semibold text-slate-700">
                  Meta description
                </Label>
                <span className="font-mono text-[11px] text-slate-400">
                  {watchedMetaDescription.length}/180 ký tự
                </span>
              </div>
              <Textarea
                id="article-meta-desc"
                rows={3}
                placeholder="Đoạn trích tóm tắt bài viết xuất hiện dưới tiêu đề trên Google..."
                {...register("metaDescription")}
              />
              {errors.metaDescription ? (
                <p className="text-xs font-medium text-red-500">{errors.metaDescription.message}</p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label
                htmlFor="article-meta-keywords"
                className="text-sm font-semibold text-slate-700"
              >
                Meta keywords
              </Label>
              <Input
                id="article-meta-keywords"
                placeholder="tuyển dụng, nghề nghiệp, IT"
                {...register("metaKeywords")}
              />
              <p className="text-muted-foreground text-xs">Các từ khoá cách nhau bằng dấu phẩy.</p>
              {errors.metaKeywords ? (
                <p className="text-xs font-medium text-red-500">{errors.metaKeywords.message}</p>
              ) : null}
            </div>
          </Card>

          {/* Card 3: SEO Analysis & Score Checker (Evaluates the content live) */}
          <SeoChecker
            title={watchedTitle}
            contentHtml={watchedContent}
            metaTitle={watchedMetaTitle}
            metaDescription={watchedMetaDescription}
            metaKeywords={watchedMetaKeywords}
            slug={post?.slug}
            hasCategory={Boolean(watchedCategoryId && watchedCategoryId !== NO_CATEGORY)}
            hasThumbnail={Boolean(watchedThumbnailId || imagePreviews.thumbnail)}
            hasCover={Boolean(watchedCoverId || imagePreviews.cover)}
            thumbnailUrl={imagePreviews.thumbnail}
            focusKeyword={watchedFocusKeyword}
            onFocusKeywordChange={(keyword) =>
              setValue("focusKeyword", keyword, { shouldDirty: true })
            }
            onApplySuggestedMetaTitle={handleAutoFillMetaTitle}
            onApplySuggestedMetaDescription={handleAutoExtractMetaDescription}
          />
        </div>

        {/* Right 1 Column: Classification & Image Uploads */}
        <div className="space-y-6">
          {/* Classification Card */}
          <Card className="space-y-5 border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Phân loại</h2>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Loại bài viết</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Danh mục</Label>
              <Controller
                control={control}
                name="categoryId"
                render={({ field }) => (
                  <Select
                    key={`category-select-${field.value || NO_CATEGORY}-${allCategories.length}`}
                    value={field.value || NO_CATEGORY}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>Không phân loại</SelectItem>
                      {allCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Tag Multi-Select Dropdown */}
            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">Thẻ (tags)</Label>
              <TagMultiSelect
                tags={allTags}
                selectedTagIds={watchedTagIds}
                onChange={(newTagIds) => setValue("tagIds", newTagIds, { shouldDirty: true })}
                placeholder="Chọn hoặc tìm kiếm thẻ..."
              />
            </div>
          </Card>

          {/* Media Images Card */}
          <Card className="space-y-5 border border-slate-200 p-6 shadow-xs">
            <h2 className="text-base font-bold text-slate-900">Hình ảnh</h2>

            <ImageField
              label="Ảnh thumbnail"
              previewUrl={imagePreviews.thumbnail}
              inputRef={thumbnailInputRef}
              isUploading={uploadingField === "thumbnail"}
              onSelect={(file) => void handleImageUpload("thumbnail", file)}
              onClear={() => clearImage("thumbnail")}
            />

            <ImageField
              label="Ảnh bìa"
              previewUrl={imagePreviews.cover}
              inputRef={coverInputRef}
              isUploading={uploadingField === "cover"}
              onSelect={(file) => void handleImageUpload("cover", file)}
              onClear={() => clearImage("cover")}
            />
          </Card>
        </div>
      </form>
    </div>
  );
}

function ImageField({
  label,
  previewUrl,
  inputRef,
  isUploading,
  onSelect,
  onClear,
}: {
  label: string;
  previewUrl: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  isUploading: boolean;
  onSelect: (file: File) => void;
  onClear: () => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label className="text-sm font-semibold text-slate-700">{label}</Label>
      {previewUrl ? (
        <div className="group relative overflow-hidden rounded-xl border border-slate-200">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="h-36 w-full object-cover transition-transform group-hover:scale-105"
          />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 size-8 shadow-sm"
            onClick={onClear}
            aria-label={`Xoá ${label}`}
          >
            <Trash size={14} />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 transition-colors hover:border-emerald-500 hover:bg-emerald-50/50 hover:text-emerald-700 disabled:opacity-60"
        >
          <UploadSimple size={18} />
          {isUploading ? "Đang tải lên…" : "Chọn ảnh"}
        </button>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        aria-label={label}
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onSelect(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
