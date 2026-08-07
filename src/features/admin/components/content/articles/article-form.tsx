"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CaretLeft, FloppyDisk, PaperPlaneTilt, Trash, UploadSimple } from "@phosphor-icons/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import Swal from "sweetalert2";

import {
  createAdminPost,
  getAdminPostCategories,
  getAdminPostDetails,
  getAdminPostTags,
  updateAdminPost,
  uploadPostImage,
  type AdminPostResponse,
  type CreateAdminPostPayload,
  type PostStatus,
} from "@/features/admin/api/posts";
import { clearAdminSession, getAdminSession } from "@/features/admin/session";
import { Link, useRouter } from "@/i18n/navigation";
import { ApiError } from "@/shared/api/http";
import { cn } from "@/shared/lib/cn";
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

const toast = Swal.mixin({
  toast: true,
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
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
  metaTitle: "",
  metaDescription: "",
  metaKeywords: "",
  thumbnailFileId: "",
  coverImageFileId: "",
};

function toFormValues(post: AdminPostResponse): ArticleFormValues {
  return {
    title: post.title ?? "",
    content: post.content ?? "",
    type: post.type ?? "BLOG",
    categoryId: post.categoryId ?? NO_CATEGORY,
    tagIds: (post.postTags ?? []).map((relation) => relation.tagId),
    metaTitle: post.metaTitle ?? "",
    metaDescription: post.metaDescription ?? "",
    metaKeywords: post.metaKeywords ?? "",
    thumbnailFileId: post.thumbnailFileId ?? "",
    coverImageFileId: post.coverImageFileId ?? "",
  };
}

function toPayload(values: ArticleFormValues, status: PostStatus): CreateAdminPostPayload {
  const optionalText = (value: string) => (value.trim() ? value.trim() : undefined);

  return {
    title: values.title.trim(),
    content: values.content,
    status,
    type: values.type,
    // `null` explicitly clears the relation on the backend; `undefined` leaves it alone.
    categoryId: values.categoryId === NO_CATEGORY ? null : values.categoryId,
    thumbnailFileId: values.thumbnailFileId || null,
    coverImageFileId: values.coverImageFileId || null,
    metaTitle: optionalText(values.metaTitle),
    metaDescription: optionalText(values.metaDescription),
    metaKeywords: optionalText(values.metaKeywords),
    tagIds: values.tagIds,
  };
}

function getSubmitErrorMessage(error: unknown) {
  if (error instanceof ApiError) {
    if (error.status === 400) return "Dữ liệu không hợp lệ. Vui lòng kiểm tra lại các trường.";
    if (error.status === 403) return "Bạn không có quyền thực hiện thao tác này.";
    if (error.status === 404) return "Không tìm thấy danh mục hoặc thẻ đã chọn.";
    if (error.status >= 500) return "Hệ thống đang gặp sự cố. Vui lòng thử lại sau.";
    return error.message;
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
    control,
    formState: { errors, isSubmitting },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    watch,
  } = useForm<ArticleFormValues>({
    defaultValues: EMPTY_VALUES,
    resolver: zodResolver(articleFormSchema),
  });

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

  // Seed the form once the post arrives. The editor is keyed on the post id below so
  // it remounts with this content — RichTextEditor only reads `value` on mount.
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
    mutationFn: async ({ values, status }: { values: ArticleFormValues; status: PostStatus }) => {
      const session = getAdminSession();
      if (!session) throw new Error("No session");
      const payload = toPayload(values, status);

      return postId
        ? updateAdminPost(session.accessToken, postId, payload)
        : createAdminPost(session.accessToken, payload);
    },
    onSuccess: (saved, variables) => {
      void queryClient.invalidateQueries({ queryKey: ["adminPosts"] });
      if (postId) void queryClient.invalidateQueries({ queryKey: ["adminPost", postId] });
      void toast.fire({
        icon: "success",
        title:
          variables.status === "PUBLISHED"
            ? "Đã xuất bản bài viết."
            : isEdit
              ? "Đã lưu thay đổi."
              : "Đã lưu bản nháp.",
      });
      router.push(`/admin/content/articles/${saved.id}`);
    },
    onError: (error) => {
      void toast.fire({ icon: "error", title: getSubmitErrorMessage(error) });
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

  function submitWithStatus(status: PostStatus) {
    return handleSubmit((values) => saveMutation.mutateAsync({ values, status }));
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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/content/articles">
          <Button variant="ghost" className="gap-2 pl-0 text-slate-500 hover:text-slate-900">
            <CaretLeft size={20} />
            Quay lại danh sách
          </Button>
        </Link>

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
            >
              <PaperPlaneTilt size={16} />
              Xuất bản
            </Button>
          ) : null}
        </div>
      </div>

      <form className="grid gap-6 lg:grid-cols-3" onSubmit={submitWithStatus("DRAFT")}>
        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-5 border border-slate-200 p-6">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-title" className="text-sm font-semibold text-slate-700">
                Tiêu đề <span className="text-rose-600">*</span>
              </Label>
              <Input
                id="article-title"
                placeholder="Nhập tiêu đề bài viết..."
                {...register("title")}
              />
              {errors.title ? (
                <p className="text-xs font-medium text-red-500">{errors.title.message}</p>
              ) : null}
              {isEdit && post?.slug ? (
                <p className="text-muted-foreground text-xs">
                  Đường dẫn: <span className="font-mono">{post.slug}</span> (tự sinh từ tiêu đề)
                </p>
              ) : null}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label className="text-sm font-semibold text-slate-700">
                Nội dung <span className="text-rose-600">*</span>
              </Label>
              <Controller
                control={control}
                name="content"
                render={({ field }) => (
                  <RichTextEditor
                    // The editor is uncontrolled, so remount it when the loaded post changes.
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

          <Card className="space-y-5 border border-slate-200 p-6">
            <h2 className="text-base font-bold text-slate-900">Tối ưu SEO</h2>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-meta-title" className="text-sm font-semibold text-slate-700">
                Meta title
              </Label>
              <Input id="article-meta-title" {...register("metaTitle")} />
              {errors.metaTitle ? (
                <p className="text-xs font-medium text-red-500">{errors.metaTitle.message}</p>
              ) : null}
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="article-meta-desc" className="text-sm font-semibold text-slate-700">
                Meta description
              </Label>
              <Textarea id="article-meta-desc" rows={3} {...register("metaDescription")} />
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
        </div>

        <div className="space-y-6">
          <Card className="space-y-5 border border-slate-200 p-6">
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
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="h-10 rounded-xl">
                      <SelectValue placeholder="Chọn danh mục" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_CATEGORY}>Không phân loại</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label className="text-sm font-semibold text-slate-700">Thẻ (tags)</Label>
              {tags.length === 0 ? (
                <p className="text-muted-foreground text-xs">Chưa có thẻ nào trong hệ thống.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => {
                    const selected = watch("tagIds").includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          const current = getValues("tagIds");
                          setValue(
                            "tagIds",
                            selected ? current.filter((id) => id !== tag.id) : [...current, tag.id],
                            { shouldDirty: true },
                          );
                        }}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          selected
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-slate-200 bg-white text-slate-600 hover:border-slate-300",
                        )}
                      >
                        {tag.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Card>

          <Card className="space-y-5 border border-slate-200 p-6">
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
        <div className="relative overflow-hidden rounded-xl border border-slate-200">
          {/* Uploaded images are served from the configured storage provider. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={previewUrl} alt={label} className="h-36 w-full object-cover" />
          <Button
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2 size-8"
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
          className="flex h-24 flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-slate-300 text-xs font-semibold text-slate-500 transition-colors hover:border-slate-400 hover:bg-slate-50 disabled:opacity-60"
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
