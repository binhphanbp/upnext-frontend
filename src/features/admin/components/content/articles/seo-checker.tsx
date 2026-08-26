"use client";

import {
  Desktop,
  DeviceMobile,
  MagnifyingGlass,
  ArrowClockwise,
  FileText,
  ChatText,
  Target,
  CaretDown,
  CaretUp,
  CheckCircle,
  ListChecks,
  ShareNetwork,
  Info,
} from "@phosphor-icons/react/dist/ssr";
import { useState, useMemo } from "react";

import { cn } from "@/shared/lib/cn";

export interface SeoCheckerProps {
  title: string;
  contentHtml: string;
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  slug?: string | undefined;
  hasCategory?: boolean | undefined;
  hasThumbnail: boolean;
  hasCover: boolean;
  thumbnailUrl?: string | undefined;
  focusKeyword: string;
  onFocusKeywordChange: (keyword: string) => void;
  onApplySuggestedMetaTitle?: (() => void) | undefined;
  onApplySuggestedMetaDescription?: (() => void) | undefined;
}

export type SeoItemStatus = "good" | "warning" | "bad";

export interface SeoAuditItem {
  id: string;
  label: string;
  description: string;
  recommendation?: string;
  status: SeoItemStatus;
  score: number;
  maxScore: number;
}

function stripHtml(html: string): string {
  if (!html) return "";
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function countWords(text: string): number {
  if (!text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function normalizeForSearch(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .trim();
}

function countKeywordOccurrences(text: string, keyword: string): number {
  if (!text || !keyword.trim()) return 0;
  const normText = normalizeForSearch(text);
  const normKeyword = normalizeForSearch(keyword);
  if (!normKeyword) return 0;

  let count = 0;
  let pos = 0;
  while ((pos = normText.indexOf(normKeyword, pos)) !== -1) {
    count++;
    pos += normKeyword.length;
  }
  return count;
}

export function SeoChecker({
  title,
  contentHtml,
  metaTitle,
  metaDescription,
  metaKeywords,
  slug,
  hasCategory,
  hasThumbnail,
  hasCover,
  thumbnailUrl,
  focusKeyword,
  onFocusKeywordChange,
  onApplySuggestedMetaTitle,
  onApplySuggestedMetaDescription,
}: SeoCheckerProps) {
  const [activeTab, setActiveTab] = useState<"detail" | "serp" | "social">("detail");
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "mobile">("desktop");
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleItem = (id: string) => {
    setExpandedItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const effectiveTitle = (metaTitle.trim() || title.trim()) ?? "";
  const effectiveDescription = metaDescription.trim() || stripHtml(contentHtml).slice(0, 155);
  const plainText = useMemo(() => stripHtml(contentHtml), [contentHtml]);
  const wordCount = useMemo(() => countWords(plainText), [plainText]);
  const readingTimeMin = Math.max(1, Math.ceil(wordCount / 200));

  const cleanSlug = useMemo(() => {
    if (slug) return slug;
    return normalizeForSearch(title || "tieu-de-bai-viet")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }, [slug, title]);

  const auditResults = useMemo(() => {
    const items: SeoAuditItem[] = [];
    const kw = focusKeyword.trim();
    const hasKw = kw.length > 0;

    // 1. Focus Keyword
    if (!hasKw) {
      items.push({
        id: "focus-kw",
        label: "Từ khóa chính (Focus Keyword)",
        description: "Chưa nhập từ khóa trọng tâm để hệ thống phân tích và chấm điểm SEO.",
        recommendation:
          "Hãy nhập từ khóa người tìm kiếm sẽ dùng trên Google (VD: tuyển dụng IT, nestjs).",
        status: "bad",
        score: 0,
        maxScore: 15,
      });
    } else {
      items.push({
        id: "focus-kw",
        label: "Từ khóa chính (Focus Keyword)",
        description: `Đang tối ưu theo từ khóa chính: "${kw}".`,
        status: "good",
        score: 15,
        maxScore: 15,
      });
    }

    // 2. SEO Title
    const titleLen = effectiveTitle.length;
    if (titleLen >= 40 && titleLen <= 65) {
      items.push({
        id: "title-len",
        label: "Độ dài tiêu đề SEO",
        description: `Độ dài tiêu đề đạt chuẩn (${titleLen}/60 ký tự), không bị cắt ngắn trên Google.`,
        status: "good",
        score: 15,
        maxScore: 15,
      });
    } else if (titleLen > 0 && titleLen < 40) {
      items.push({
        id: "title-len",
        label: "Độ dài tiêu đề SEO",
        description: `Tiêu đề hơi ngắn (${titleLen} ký tự). Nên viết trong khoảng 40 - 65 ký tự.`,
        recommendation: "Bổ sung thêm tên thương hiệu hoặc từ khóa phụ để tiêu đề đầy đủ hơn.",
        status: "warning",
        score: 8,
        maxScore: 15,
      });
    } else if (titleLen > 65) {
      items.push({
        id: "title-len",
        label: "Độ dài tiêu đề SEO",
        description: `Tiêu đề quá dài (${titleLen} ký tự). Sẽ bị Google cắt dấu ba chấm (...).`,
        recommendation: "Rút gọn tiêu đề dưới 65 ký tự để hiển thị trọn vẹn trên SERP.",
        status: "warning",
        score: 8,
        maxScore: 15,
      });
    } else {
      items.push({
        id: "title-len",
        label: "Độ dài tiêu đề SEO",
        description: "Chưa có tiêu đề bài viết.",
        recommendation: "Vui lòng nhập tiêu đề bài viết trước khi xuất bản.",
        status: "bad",
        score: 0,
        maxScore: 15,
      });
    }

    // 3. Keyword in Title
    if (hasKw) {
      const normTitle = normalizeForSearch(effectiveTitle);
      const normKw = normalizeForSearch(kw);
      if (normTitle.startsWith(normKw)) {
        items.push({
          id: "kw-title",
          label: "Vị trí từ khóa trong tiêu đề",
          description: "Rất tốt! Từ khóa chính nằm ngay vị trí đầu tiên của tiêu đề.",
          status: "good",
          score: 10,
          maxScore: 10,
        });
      } else if (normTitle.includes(normKw)) {
        items.push({
          id: "kw-title",
          label: "Từ khóa trong tiêu đề",
          description: "Tiêu đề có chứa từ khóa chính.",
          status: "good",
          score: 8,
          maxScore: 10,
        });
      } else {
        items.push({
          id: "kw-title",
          label: "Từ khóa trong tiêu đề",
          description: `Tiêu đề chưa chứa từ khóa chính "${kw}".`,
          recommendation: `Hãy thêm từ khóa "${kw}" vào tiêu đề bài viết để cải thiện thứ hạng.`,
          status: "bad",
          score: 0,
          maxScore: 10,
        });
      }
    }

    // 4. Meta Description
    const descLen = metaDescription.trim().length;
    if (descLen >= 120 && descLen <= 160) {
      items.push({
        id: "meta-desc",
        label: "Meta Description",
        description: `Độ dài mô tả chuẩn SEO (${descLen}/160 ký tự).`,
        status: "good",
        score: 15,
        maxScore: 15,
      });
    } else if (descLen > 0 && descLen < 120) {
      items.push({
        id: "meta-desc",
        label: "Meta Description",
        description: `Mô tả hơi ngắn (${descLen} ký tự). Khuyến nghị từ 120 - 160 ký tự.`,
        recommendation: "Viết thêm 1 câu tóm tắt hành động để tăng tỷ lệ click (CTR).",
        status: "warning",
        score: 8,
        maxScore: 15,
      });
    } else if (descLen > 160) {
      items.push({
        id: "meta-desc",
        label: "Meta Description",
        description: `Mô tả hơi dài (${descLen} ký tự). Google sẽ cắt ngắn khi hiển thị.`,
        recommendation: "Cắt ngắn lại dưới 160 ký tự.",
        status: "warning",
        score: 8,
        maxScore: 15,
      });
    } else {
      items.push({
        id: "meta-desc",
        label: "Meta Description",
        description: "Chưa nhập Meta Description cho bài viết.",
        recommendation: "Thêm đoạn tóm tắt 120-160 ký tự để hiển thị dưới link tìm kiếm Google.",
        status: "bad",
        score: 0,
        maxScore: 15,
      });
    }

    // 5. Keyword in Meta Description
    if (hasKw) {
      const normDesc = normalizeForSearch(metaDescription);
      const normKw = normalizeForSearch(kw);
      if (normDesc.includes(normKw)) {
        items.push({
          id: "kw-desc",
          label: "Từ khóa trong Meta Description",
          description: "Meta Description có chứa từ khóa chính.",
          status: "good",
          score: 10,
          maxScore: 10,
        });
      } else {
        items.push({
          id: "kw-desc",
          label: "Từ khóa trong Meta Description",
          description: `Meta Description chưa chứa từ khóa "${kw}".`,
          recommendation: `Lồng ghép từ khóa "${kw}" một cách tự nhiên vào đoạn mô tả.`,
          status: "bad",
          score: 0,
          maxScore: 10,
        });
      }
    }

    // 6. Content Word Count
    if (wordCount >= 600) {
      items.push({
        id: "content-len",
        label: "Độ dài nội dung bài viết",
        description: `Nội dung có chiều sâu rất tốt (${wordCount} từ, ~${readingTimeMin} phút đọc).`,
        status: "good",
        score: 15,
        maxScore: 15,
      });
    } else if (wordCount >= 300) {
      items.push({
        id: "content-len",
        label: "Độ dài nội dung bài viết",
        description: `Nội dung đạt chuẩn tối thiểu (${wordCount} từ). Khuyến nghị viết > 600 từ.`,
        status: "good",
        score: 10,
        maxScore: 15,
      });
    } else if (wordCount > 50) {
      items.push({
        id: "content-len",
        label: "Độ dài nội dung bài viết",
        description: `Nội dung còn quá ngắn (${wordCount} từ). Cần tối thiểu 300 từ.`,
        recommendation: "Viết thêm các luận điểm, ví dụ thực tế hoặc giải thích chi tiết hơn.",
        status: "bad",
        score: 3,
        maxScore: 15,
      });
    } else {
      items.push({
        id: "content-len",
        label: "Độ dài nội dung bài viết",
        description: "Chưa có nội dung bài viết.",
        recommendation: "Soạn thảo nội dung bài viết trong trình soạn thảo bên dưới.",
        status: "bad",
        score: 0,
        maxScore: 15,
      });
    }

    // 7. Keyword Density
    if (hasKw && wordCount > 0) {
      const kwCount = countKeywordOccurrences(plainText, kw);
      const density = ((kwCount * kw.split(/\s+/).length) / wordCount) * 100;
      const densityFixed = density.toFixed(1);

      if (kwCount >= 2 && density >= 0.6 && density <= 3.0) {
        items.push({
          id: "kw-density",
          label: "Mật độ từ khóa trong bài",
          description: `Mật độ từ khóa lý tưởng (${kwCount} lần xuất hiện, tỷ lệ ${densityFixed}%).`,
          status: "good",
          score: 10,
          maxScore: 10,
        });
      } else if (density > 3.0) {
        items.push({
          id: "kw-density",
          label: "Mật độ từ khóa trong bài",
          description: `Nhồi nhét từ khóa (${kwCount} lần, tỷ lệ ${densityFixed}% > 3%).`,
          recommendation: "Giảm bớt số lần lặp lại từ khóa chính để tránh bị thuật toán phạt.",
          status: "warning",
          score: 4,
          maxScore: 10,
        });
      } else if (kwCount === 1) {
        items.push({
          id: "kw-density",
          label: "Mật độ từ khóa trong bài",
          description: `Từ khóa mới xuất hiện 1 lần (${densityFixed}%).`,
          recommendation: "Nên nhắc lại từ khóa tự nhiên 2-3 lần trong các đoạn văn khác nhau.",
          status: "warning",
          score: 5,
          maxScore: 10,
        });
      } else {
        items.push({
          id: "kw-density",
          label: "Mật độ từ khóa trong bài",
          description: `Từ khóa "${kw}" chưa xuất hiện trong thân bài viết.`,
          recommendation: `Bổ sung từ khóa "${kw}" vào phần mở đầu và thân bài viết.`,
          status: "bad",
          score: 0,
          maxScore: 10,
        });
      }
    }

    // 8. Headings (H2 / H3)
    const hasH2 = /<h2[^>]*>/i.test(contentHtml);
    const hasH3 = /<h3[^>]*>/i.test(contentHtml);
    if (hasH2 || hasH3) {
      items.push({
        id: "headings",
        label: "Cấu trúc tiêu đề phụ (H2, H3)",
        description:
          "Bài viết có sử dụng tiêu đề phụ (Heading 2, Heading 3) giúp nội dung rõ ràng.",
        status: "good",
        score: 5,
        maxScore: 5,
      });
    } else if (wordCount > 150) {
      items.push({
        id: "headings",
        label: "Cấu trúc tiêu đề phụ (H2, H3)",
        description: "Bài viết nên có ít nhất một tiêu đề Heading 2 hoặc Heading 3 để phân đoạn.",
        recommendation: "Dùng thanh công cụ chọn H2/H3 cho các đề mục chính.",
        status: "warning",
        score: 1,
        maxScore: 5,
      });
    }

    // 9. Images
    if (hasThumbnail) {
      items.push({
        id: "thumbnail",
        label: "Ảnh đại diện bài viết (Thumbnail)",
        description: "Đã thiết lập ảnh thumbnail đại diện bài viết.",
        status: "good",
        score: 5,
        maxScore: 5,
      });
    } else {
      items.push({
        id: "thumbnail",
        label: "Ảnh đại diện bài viết (Thumbnail)",
        description: "Chưa chọn ảnh thumbnail đại diện.",
        recommendation: "Tải lên ảnh thumbnail ở khung bên phải để tăng 60% lượt click.",
        status: "bad",
        score: 0,
        maxScore: 5,
      });
    }

    // 10. Category
    if (hasCategory) {
      items.push({
        id: "category",
        label: "Danh mục bài viết",
        description: "Đã chọn danh mục phân loại cho bài viết.",
        status: "good",
        score: 5,
        maxScore: 5,
      });
    } else {
      items.push({
        id: "category",
        label: "Danh mục bài viết",
        description: "Chưa chọn danh mục bài viết (bắt buộc khi xuất bản).",
        recommendation: "Hãy chọn 1 danh mục ở cột Phân loại bên phải trước khi xuất bản.",
        status: "bad",
        score: 0,
        maxScore: 5,
      });
    }

    const totalScore = items.reduce((acc, cur) => acc + cur.score, 0);
    const maxScore = items.reduce((acc, cur) => acc + cur.maxScore, 0);
    const percentage = maxScore > 0 ? Math.min(100, Math.round((totalScore / maxScore) * 100)) : 0;

    return {
      items,
      score: percentage,
      issues: items.filter((i) => i.status === "bad" || i.status === "warning"),
      goodCount: items.filter((i) => i.status === "good").length,
      warningCount: items.filter((i) => i.status === "warning").length,
      badCount: items.filter((i) => i.status === "bad").length,
    };
  }, [
    focusKeyword,
    effectiveTitle,
    metaDescription,
    plainText,
    wordCount,
    readingTimeMin,
    contentHtml,
    hasThumbnail,
    hasCategory,
  ]);

  const scoreTheme = useMemo(() => {
    if (auditResults.score >= 80) {
      return {
        label: "Rất tốt",
        badge: "Đạt chuẩn SEO",
        badgeClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
        strokeColor: "#10b981",
        textColor: "text-emerald-700",
      };
    }
    if (auditResults.score >= 50) {
      return {
        label: "Cần cải thiện",
        badge: "Cần tối ưu",
        badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
        strokeColor: "#f59e0b",
        textColor: "text-orange-700",
      };
    }
    return {
      label: "Chưa đạt chuẩn",
      badge: "Cần tối ưu",
      badgeClass: "bg-orange-50 text-orange-700 border-orange-200",
      strokeColor: "#ef4444",
      textColor: "text-rose-700",
    };
  }, [auditResults.score]);

  const kwCount = focusKeyword.trim() ? countKeywordOccurrences(plainText, focusKeyword.trim()) : 0;
  const kwDensity =
    wordCount > 0 && focusKeyword.trim()
      ? ((kwCount * focusKeyword.trim().split(/\s+/).length * 100) / wordCount).toFixed(1)
      : "0";

  return (
    <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
      {/* 1. Header & Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900">Phân tích SEO</h2>
        <p className="mt-1 text-sm text-slate-500">
          Đánh giá toàn diện tiêu đề, nội dung, thẻ Meta và khả năng hiển thị trên Google.
        </p>
      </div>

      {/* 2. Top Row: Score Meter (Left) and Focus Keyword (Right) */}
      <div className="grid grid-cols-1 items-center gap-6 md:grid-cols-2">
        {/* Left: Score Gauge */}
        <div className="flex items-center gap-4">
          <div className="relative flex h-18 w-18 shrink-0 items-center justify-center rounded-full bg-slate-50">
            <svg className="h-18 w-18 -rotate-90 transform" viewBox="0 0 36 36">
              <path
                className="text-slate-100"
                strokeWidth="3"
                stroke="currentColor"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
              <path
                stroke={scoreTheme.strokeColor}
                strokeDasharray={`${auditResults.score}, 100`}
                strokeWidth="3"
                strokeLinecap="round"
                fill="none"
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center leading-none">
              <span className="text-lg font-bold text-slate-900">{auditResults.score}</span>
              <span className="text-[10px] font-medium text-slate-400">/100</span>
            </div>
          </div>

          <div className="space-y-1">
            <h4 className="text-base font-bold text-slate-900">{scoreTheme.label}</h4>
            <span
              className={cn(
                "inline-block rounded-md border px-2.5 py-0.5 text-xs font-semibold",
                scoreTheme.badgeClass,
              )}
            >
              {scoreTheme.badge}
            </span>
            <p className="text-xs text-slate-500">Điểm SEO của bài viết</p>
          </div>
        </div>

        {/* Right: Focus Keyword Input */}
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <label htmlFor="seo-focus-keyword" className="text-xs font-bold text-slate-900">
              Từ khóa chính (Focus Keyword)
            </label>
            <Info className="h-3.5 w-3.5 text-slate-400" />
          </div>
          <div className="relative">
            <MagnifyingGlass className="absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              id="seo-focus-keyword"
              type="text"
              value={focusKeyword}
              onChange={(e) => onFocusKeywordChange(e.target.value)}
              placeholder="VD: tuyển dụng IT, nestjs, laravel"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pr-3.5 pl-9 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 3. Tab Navigation */}
      <div className="flex gap-6 border-b border-slate-200 text-sm">
        <button
          type="button"
          onClick={() => setActiveTab("detail")}
          className={cn(
            "flex items-center gap-2 pb-3 font-semibold transition-all border-b-2",
            activeTab === "detail"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          <ListChecks className="h-4.5 w-4.5" />
          Kiểm tra chi tiết
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("serp")}
          className={cn(
            "flex items-center gap-2 pb-3 font-semibold transition-all border-b-2",
            activeTab === "serp"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          <Desktop className="h-4.5 w-4.5" />
          Xem trước Google Search (SERP)
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("social")}
          className={cn(
            "flex items-center gap-2 pb-3 font-semibold transition-all border-b-2",
            activeTab === "social"
              ? "border-emerald-600 text-emerald-700"
              : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          <ShareNetwork className="h-4.5 w-4.5" />
          Xem trước Mạng xã hội
        </button>
      </div>

      {/* TAB CONTENT 1: DETAIL AUDIT */}
      {activeTab === "detail" && (
        <div className="space-y-6">
          {/* 4 Cards Row */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Card 1: Words */}
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <FileText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Tổng số từ</p>
                <p className="text-lg leading-tight font-bold text-slate-900">{wordCount} từ</p>
                <p className="mt-0.5 text-[11px] text-slate-400">~{readingTimeMin} phút đọc</p>
              </div>
            </div>

            {/* Card 2: SEO Title */}
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 font-serif text-lg font-bold text-emerald-700">
                T
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Tiêu đề SEO</p>
                <p className="text-lg leading-tight font-bold text-slate-900">
                  {effectiveTitle.length} ký tự
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Chuẩn: 40-60 ký tự</p>
              </div>
            </div>

            {/* Card 3: Meta Description */}
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ChatText className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Meta Description</p>
                <p className="text-lg leading-tight font-bold text-slate-900">
                  {metaDescription.trim().length} ký tự
                </p>
                <p className="mt-0.5 text-[11px] text-slate-400">Chuẩn: 120-160 ký tự</p>
              </div>
            </div>

            {/* Card 4: Keyword Density */}
            <div className="flex items-center gap-3.5 rounded-xl border border-slate-200 bg-white p-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Target className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-500">Mật độ từ khóa</p>
                <p className="text-lg leading-tight font-bold text-slate-900">{kwDensity}%</p>
                <p className="mt-0.5 text-[11px] text-slate-400">Lý tưởng: 0.8% - 2.5%</p>
              </div>
            </div>
          </div>

          {/* Issues Section */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-slate-900">
              Các vấn đề cần tối ưu ({auditResults.issues.length})
            </h3>

            <div className="space-y-2.5">
              {auditResults.items.map((item) => {
                const isExpanded = Boolean(expandedItems[item.id]);
                const isGood = item.status === "good";

                return (
                  <div
                    key={item.id}
                    className={cn(
                      "rounded-xl border transition-all overflow-hidden",
                      isGood
                        ? "border-slate-100 bg-slate-50/50"
                        : "border-slate-200 bg-white shadow-2xs",
                    )}
                  >
                    <div
                      onClick={() => toggleItem(item.id)}
                      className="flex cursor-pointer items-center justify-between gap-3 p-3.5 select-none"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        {/* Red / Orange / Green Icon */}
                        {item.status === "bad" && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-rose-600 font-serif text-xs font-bold text-white">
                            !
                          </div>
                        )}
                        {item.status === "warning" && (
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-amber-500 font-serif text-xs font-bold text-white">
                            !
                          </div>
                        )}
                        {item.status === "good" && (
                          <CheckCircle
                            className="h-6 w-6 shrink-0 text-emerald-600"
                            weight="fill"
                          />
                        )}

                        <div className="min-w-0">
                          <h4 className="text-sm leading-tight font-bold text-slate-900">
                            {item.label}
                          </h4>
                          <p className="mt-0.5 max-w-xl truncate text-xs text-slate-500">
                            {item.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <span
                          className={cn(
                            "rounded-md px-2.5 py-1 text-xs font-semibold",
                            item.status === "good"
                              ? "bg-emerald-50 text-emerald-700"
                              : item.status === "warning"
                                ? "bg-orange-50 text-orange-700"
                                : "bg-orange-50 text-orange-700",
                          )}
                        >
                          {item.status === "good" ? "Đạt chuẩn" : "Cần khắc phục"}
                        </span>
                        {isExpanded ? (
                          <CaretUp className="h-4 w-4 text-slate-400" />
                        ) : (
                          <CaretDown className="h-4 w-4 text-slate-400" />
                        )}
                      </div>
                    </div>

                    {/* Accordion Expanded Detail */}
                    {isExpanded && (
                      <div className="space-y-1 border-t border-slate-100 bg-slate-50/70 px-4 pt-1 pb-3.5 text-xs text-slate-600">
                        <p className="leading-relaxed">{item.description}</p>
                        {item.recommendation && (
                          <p className="font-semibold text-emerald-800">
                            💡 Gợi ý: {item.recommendation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: GOOGLE SERP PREVIEW */}
      {activeTab === "serp" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500">
              Mô phỏng hiển thị trên công cụ tìm kiếm Google
            </span>
            <div className="flex items-center rounded-lg bg-slate-100 p-0.5">
              <button
                type="button"
                onClick={() => setPreviewDevice("desktop")}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all",
                  previewDevice === "desktop"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                <Desktop className="h-3.5 w-3.5" /> Máy tính
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice("mobile")}
                className={cn(
                  "flex items-center gap-1 px-3 py-1 rounded-md text-xs font-medium transition-all",
                  previewDevice === "mobile"
                    ? "bg-white text-slate-900 shadow-xs"
                    : "text-slate-500 hover:text-slate-900",
                )}
              >
                <DeviceMobile className="h-3.5 w-3.5" /> Di động
              </button>
            </div>
          </div>

          <div
            className={cn(
              "rounded-2xl border border-slate-200 bg-white p-5 shadow-xs transition-all",
              previewDevice === "mobile" ? "max-w-md mx-auto" : "w-full",
            )}
          >
            <div className="mb-1.5 flex items-center gap-2.5">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-black text-white shadow-xs">
                U
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-[12px] font-semibold text-slate-900">UpNext IT Careers</span>
                <span className="font-mono text-[11px] text-slate-500">
                  https://upnext.works › blog › {cleanSlug}
                </span>
              </div>
            </div>

            <h4 className="line-clamp-2 cursor-pointer text-[18px] leading-snug font-normal text-[#1a0dab] hover:underline">
              {effectiveTitle || "Tiêu đề bài viết sẽ hiển thị ở đây trên Google"}
            </h4>

            <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-[#4d5156]">
              {effectiveDescription ||
                "Hãy nhập Meta Description để tạo đoạn trích dẫn thu hút người tìm kiếm click vào bài viết của bạn trên Google..."}
            </p>
          </div>

          <div className="flex flex-wrap gap-2 pt-2 text-xs">
            {onApplySuggestedMetaTitle && title && (
              <button
                type="button"
                onClick={onApplySuggestedMetaTitle}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ArrowClockwise className="h-3.5 w-3.5" /> Đồng bộ Meta Title từ Tiêu đề
              </button>
            )}
            {onApplySuggestedMetaDescription && plainText && (
              <button
                type="button"
                onClick={onApplySuggestedMetaDescription}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-100 px-3 py-1.5 font-medium text-slate-700 transition-colors hover:bg-emerald-50 hover:text-emerald-700"
              >
                <ArrowClockwise className="h-3.5 w-3.5" /> Trích xuất Meta Description từ nội dung
              </button>
            )}
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: SOCIAL PREVIEW */}
      {activeTab === "social" && (
        <div className="space-y-4">
          <span className="text-xs font-semibold text-slate-500">
            Mô phỏng hiển thị thẻ OpenGraph khi chia sẻ lên Facebook, Zalo, LinkedIn
          </span>

          <div className="mx-auto max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xs">
            <div className="flex h-52 w-full items-center justify-center overflow-hidden border-b border-slate-100 bg-slate-100">
              {thumbnailUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={thumbnailUrl}
                  alt="Thumbnail preview"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-1 text-slate-400">
                  <FileText size={32} />
                  <span className="text-xs">Chưa có ảnh thumbnail</span>
                </div>
              )}
            </div>
            <div className="bg-slate-50 p-4">
              <span className="text-[11px] font-bold tracking-wider text-slate-400 uppercase">
                UPNEXT.WORKS
              </span>
              <h4 className="mt-1 line-clamp-2 text-sm font-bold text-slate-900">
                {effectiveTitle || "Tiêu đề bài viết khi chia sẻ mạng xã hội"}
              </h4>
              <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">
                {effectiveDescription || "Đoạn mô tả ngắn gọn thu hút tương tác khi chia sẻ..."}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
