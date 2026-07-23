"use client";

import { CircleNotch } from "@phosphor-icons/react";
import { useLocale } from "next-intl";
import { type ReactNode } from "react";

import { cn } from "@/shared/lib/cn";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";

interface RecruiterTableLayoutProps {
  loading?: boolean;
  filterBar?: ReactNode;
  actionBar?: ReactNode;
  totalItems?: number;
  currentPage?: number;
  pageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  children: ReactNode;
}

export function RecruiterTableLayout({
  loading = false,
  filterBar,
  actionBar,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  children,
}: RecruiterTableLayoutProps) {
  const locale = useLocale();

  const totalPages = totalItems && pageSize ? Math.ceil(totalItems / pageSize) || 1 : 1;

  const renderPageNumbers = () => {
    if (!currentPage || !totalPages) return null;

    const pages = [];
    const range = 2;
    const start = Math.max(1, currentPage - range);
    const end = Math.min(totalPages, currentPage + range);

    if (start > 1) {
      pages.push(
        <Button
          key={1}
          variant={currentPage === 1 ? "primary" : "outline"}
          className={cn(
            "h-8 w-8 p-0 text-xs font-bold",
            currentPage === 1
              ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
              : "text-slate-600 hover:bg-slate-50 border-slate-200",
          )}
          onClick={() => onPageChange?.(1)}
        >
          1
        </Button>,
      );
      if (start > 2) {
        pages.push(
          <span key="ell-start" className="px-1 text-slate-400">
            ...
          </span>,
        );
      }
    }

    for (let i = start; i <= end; i++) {
      pages.push(
        <Button
          key={i}
          variant={currentPage === i ? "primary" : "outline"}
          className={cn(
            "h-8 w-8 p-0 text-xs font-bold",
            currentPage === i
              ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
              : "text-slate-600 hover:bg-slate-50 border-slate-200",
          )}
          onClick={() => onPageChange?.(i)}
        >
          {i}
        </Button>,
      );
    }

    if (end < totalPages) {
      if (end < totalPages - 1) {
        pages.push(
          <span key="ell-end" className="px-1 text-slate-400">
            ...
          </span>,
        );
      }
      pages.push(
        <Button
          key={totalPages}
          variant={currentPage === totalPages ? "primary" : "outline"}
          className={cn(
            "h-8 w-8 p-0 text-xs font-bold",
            currentPage === totalPages
              ? "bg-emerald-600 text-white hover:bg-emerald-700 border-emerald-600"
              : "text-slate-600 hover:bg-slate-50 border-slate-200",
          )}
          onClick={() => onPageChange?.(totalPages)}
        >
          {totalPages}
        </Button>,
      );
    }

    return pages;
  };

  const showPagination =
    totalItems !== undefined &&
    currentPage !== undefined &&
    pageSize !== undefined &&
    totalItems > 0;

  return (
    <Card className="upnext-shadow w-full min-w-0 overflow-hidden rounded-none border border-slate-200 bg-white p-0">
      {/* Filters & Actions Section */}
      {(filterBar || actionBar) && (
        <div className="border-b border-slate-200 bg-white p-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            {filterBar && (
              <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
                {filterBar}
              </div>
            )}
            {actionBar && (
              <div className="ml-auto flex items-center gap-2.5 self-end md:self-auto">
                {actionBar}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Table Content Container */}
      <div className="relative">
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/60 backdrop-blur-[1px] transition-all duration-200">
            <div className="flex flex-col items-center gap-2">
              <CircleNotch className="mb-1 size-8 animate-spin text-emerald-600" />
              <span className="text-xs font-bold text-emerald-600">
                {locale === "vi" ? "Đang tải dữ liệu..." : "Loading data..."}
              </span>
            </div>
          </div>
        )}

        <div className="w-full overflow-x-auto">
          <table className="w-full min-w-full border-collapse text-sm whitespace-nowrap [&_tbody_td[colspan]]:sticky [&_tbody_td[colspan]]:left-0 [&_tbody_td[colspan]]:w-[calc(100vw-48px)] sm:[&_tbody_td[colspan]]:w-[calc(100vw-280px)] lg:[&_tbody_td[colspan]]:w-full [&_tbody_tr]:border-b [&_tbody_tr]:border-slate-200 hover:[&_tbody_tr]:bg-slate-50/40 [&_tbody_tr:nth-child(even)]:bg-slate-50/80 [&_td]:px-4 [&_td]:py-3 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left [&_th]:text-sm [&_th]:font-bold [&_th]:text-slate-800 [&_thead_tr]:border-b [&_thead_tr]:border-slate-300 [&_thead_tr]:bg-slate-200">
            {children}
          </table>
        </div>
      </div>

      {/* Pagination Section */}
      {showPagination && (
        <div className="flex flex-col gap-4 border-t border-slate-200 bg-slate-50/50 p-4 text-sm font-medium text-slate-600 select-none sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span>
              {locale === "vi" ? `Tổng số: ${totalItems} bản ghi` : `Total: ${totalItems} records`}
            </span>
            <div className="flex items-center gap-1.5">
              <Select
                value={String(pageSize)}
                onValueChange={(val) => {
                  onPageSizeChange?.(Number(val));
                  onPageChange?.(1);
                }}
              >
                <SelectTrigger
                  aria-label="Page Size Selector"
                  className="h-8 w-[80px] rounded border border-slate-200 bg-white px-2 text-xs shadow-none focus:ring-0 focus:ring-offset-0 focus:outline-none"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 20, 50, 100].map((size) => (
                    <SelectItem key={size} value={String(size)}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span>{locale === "vi" ? "bản ghi/trang" : "records/page"}</span>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 border-slate-200 p-0 font-bold text-slate-600 hover:bg-slate-50"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(1)}
              aria-label="First Page"
            >
              &laquo;
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 border-slate-200 p-0 font-bold text-slate-600 hover:bg-slate-50"
              disabled={currentPage === 1}
              onClick={() => onPageChange?.(currentPage - 1)}
              aria-label="Previous Page"
            >
              &lsaquo;
            </Button>
            {renderPageNumbers()}
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 border-slate-200 p-0 font-bold text-slate-600 hover:bg-slate-50"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(currentPage + 1)}
              aria-label="Next Page"
            >
              &rsaquo;
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-8 w-8 border-slate-200 p-0 font-bold text-slate-600 hover:bg-slate-50"
              disabled={currentPage === totalPages}
              onClick={() => onPageChange?.(totalPages)}
              aria-label="Last Page"
            >
              &raquo;
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
