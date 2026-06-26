"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import Link from "next/link";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  display: "swap",
  variable: "--font-sans",
});

export default function GlobalNotFound() {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        suppressHydrationWarning
        className={`${plusJakartaSans.variable} ${plusJakartaSans.className}`}
      >
        <div className="flex min-h-screen flex-col items-center justify-center bg-white text-zinc-900">
          <div className="text-center">
            <h1 className="mb-4 text-6xl font-bold tracking-tight text-zinc-900">404</h1>
            <h2 className="mb-4 text-2xl font-semibold text-zinc-800">Không tìm thấy trang</h2>
            <p className="mb-8 text-zinc-600">
              Rất tiếc, trang bạn đang tìm kiếm không tồn tại hoặc đã bị gỡ bỏ.
            </p>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-md bg-zinc-900 px-6 py-3 text-sm font-medium text-zinc-50 transition-colors hover:bg-zinc-800 focus:ring-2 focus:ring-zinc-900 focus:ring-offset-2 focus:outline-none"
            >
              Về trang chủ
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
