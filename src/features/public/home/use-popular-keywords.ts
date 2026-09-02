"use client";

import { useEffect, useState } from "react";

import {
  fallbackPopularKeywords,
  fetchPopularKeywords,
  normalizePopularKeywords,
  type PopularKeyword,
  type PopularKeywordLocale,
  type PopularKeywordPlacement,
} from "./popular-keywords";

/**
 * Chip "Tìm kiếm phổ biến", lấy từ bảng `popular_search_keywords` ở backend.
 *
 * Trả về danh sách cứng ngay từ lần render đầu rồi thay bằng dữ liệu thật khi API về:
 * chip là thành phần điều hướng nằm ngay dưới ô tìm kiếm, để trống một nhịp rồi mới hiện
 * sẽ làm layout nhảy và người dùng mất chỗ bấm.
 *
 * `fallbackPopularKeywords` chỉ dành cho trang chủ, nên khi đặt ở chỗ khác thì lần render
 * đầu không có chip — đúng hơn là hiện sai danh sách rồi đổi.
 */
export function usePopularKeywords(
  placement: PopularKeywordPlacement,
  locale: PopularKeywordLocale,
  limit = 24,
) {
  const [keywords, setKeywords] = useState<PopularKeyword[]>(() =>
    placement === "HOME_HERO"
      ? normalizePopularKeywords(fallbackPopularKeywords, {
          locale,
          fallback: fallbackPopularKeywords,
          limit,
        })
      : [],
  );

  useEffect(() => {
    let cancelled = false;

    void fetchPopularKeywords(placement, locale, limit).then((items) => {
      // API lỗi trả về mảng rỗng — giữ nguyên danh sách đang hiện thay vì xoá sạch chip.
      if (cancelled || items.length === 0) return;
      setKeywords(items);
    });

    return () => {
      cancelled = true;
    };
  }, [placement, locale, limit]);

  return keywords;
}
