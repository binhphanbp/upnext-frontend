"use client";

import { Bell, ChevronDown, Command, Gift, Menu, Plus, Search } from "@/features/recruiter/icons";
import { Link, usePathname } from "@/i18n/navigation";

export function RecruiterTopbar() {
  const pathname = usePathname();
  const isCandidatesPage = pathname.startsWith("/recruiter/candidates");
  const searchPlaceholder = isCandidatesPage
    ? "Tìm kiếm ứng viên, vị trí, kỹ năng..."
    : "Tìm kiếm vị trí, mã tin...";

  return (
    <header className="sticky top-0 z-30 flex h-[72px] items-center justify-between gap-4 border-b border-slate-200/80 bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
      <button
        aria-label="Mở menu"
        className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 lg:hidden"
      >
        <Menu aria-hidden className="h-5 w-5" />
      </button>

      <div
        className={`relative hidden h-11 w-full items-center sm:flex ${
          isCandidatesPage ? "max-w-[500px]" : "max-w-[400px]"
        }`}
      >
        <Search aria-hidden className="absolute left-4 h-5 w-5 text-slate-400" />
        <input
          aria-label={searchPlaceholder}
          className="h-full w-full rounded-lg border border-slate-200 bg-white pr-16 pl-12 text-sm font-semibold text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.04)] transition outline-none placeholder:text-slate-400 focus:border-emerald-300 focus:ring-4 focus:ring-emerald-100"
          placeholder={searchPlaceholder}
          type="search"
        />
        <span className="absolute right-3 inline-flex h-8 items-center gap-1 rounded-md border border-slate-200 bg-slate-50 px-2 text-xs font-bold text-slate-500">
          <Command aria-hidden className="h-3.5 w-3.5" /> K
        </span>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {isCandidatesPage ? (
          <button
            aria-label="Tiện ích"
            className="hidden h-10 w-10 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-50 sm:inline-flex"
          >
            <Gift aria-hidden className="h-5 w-5" />
          </button>
        ) : (
          <Link
            className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 text-sm font-bold text-white shadow-[0_12px_26px_rgba(5,150,105,0.22)] transition hover:bg-emerald-700 sm:h-11 sm:px-5"
            href="/recruiter/job-posts/create"
          >
            <Plus aria-hidden className="h-5 w-5" />
            <span className="hidden sm:inline">Đăng tin mới</span>
          </Link>
        )}

        <button
          aria-label="Thông báo"
          className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg text-slate-800 transition hover:bg-slate-50"
        >
          <Bell aria-hidden className="h-5 w-5" />
          <span className="absolute top-1 right-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] leading-none font-bold text-white">
            8
          </span>
        </button>

        <span className="hidden h-6 w-px bg-slate-200 sm:block" />

        <button className="hidden items-center gap-3 rounded-lg px-1.5 py-1.5 transition hover:bg-slate-50 sm:flex">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-white">
            U
          </span>
          <span className="flex flex-col items-start leading-tight">
            <span className="text-sm font-bold text-slate-950">UpNext Studio</span>
            {isCandidatesPage ? (
              <span className="text-xs font-semibold text-slate-500">Nhà tuyển dụng</span>
            ) : null}
          </span>
          <ChevronDown aria-hidden className="h-4 w-4 text-slate-600" />
        </button>
      </div>
    </header>
  );
}
