import { z } from "zod";

/** Matches the empty document Tiptap produces, so a blank editor fails `required`. */
const EMPTY_EDITOR_HTML = /^(<p>(\s|&nbsp;|<br\s*\/?>)*<\/p>)*$/u;

export const articleFormSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập tiêu đề bài viết.")
    .max(255, "Tiêu đề tối đa 255 ký tự."),
  content: z
    .string()
    .refine((value) => value.trim().length > 0 && !EMPTY_EDITOR_HTML.test(value.trim()), {
      message: "Vui lòng nhập nội dung bài viết.",
    }),
  type: z.enum(["BLOG", "NEWS", "FAQ"]),
  categoryId: z.string(),
  tagIds: z.array(z.string()),
  focusKeyword: z.string().optional(),
  metaTitle: z.string().trim().max(255, "Meta title tối đa 255 ký tự."),
  metaDescription: z.string().trim().max(500, "Meta description tối đa 500 ký tự."),
  metaKeywords: z.string().trim().max(500, "Meta keywords tối đa 500 ký tự."),
  thumbnailFileId: z.string(),
  coverImageFileId: z.string(),
});

export type ArticleFormValues = z.infer<typeof articleFormSchema>;
