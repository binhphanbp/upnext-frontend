"use client";

import { CaretRight, House } from "@phosphor-icons/react";
import * as React from "react";

import { Link } from "@/i18n/navigation";
import { cn } from "@/shared/lib/cn";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHomeIcon?: boolean;
  className?: string;
}

export function Breadcrumb({ items, showHomeIcon = true, className }: BreadcrumbProps) {
  return (
    <nav
      className={cn("flex flex-wrap items-center gap-2 text-xs text-slate-500", className)}
      aria-label="Breadcrumb"
    >
      {items.map((item, index) => {
        const isLast = index === items.length - 1;
        const isHome = index === 0 && (item.label === "Trang chủ" || item.label === "Home");

        return (
          <React.Fragment key={index}>
            {index > 0 && (
              <CaretRight aria-hidden="true" size={10} className="shrink-0 text-slate-400" />
            )}

            {isLast ? (
              <span className="max-w-[240px] truncate font-medium text-slate-900 sm:max-w-none">
                {item.label}
              </span>
            ) : item.href ? (
              <Link
                href={item.href}
                className="flex items-center gap-1.5 rounded transition-colors hover:text-emerald-600 focus-visible:text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
              >
                {isHome && showHomeIcon && (
                  <House aria-hidden="true" size={14} className="shrink-0 text-slate-400" />
                )}
                <span>{item.label}</span>
              </Link>
            ) : (
              <button
                type="button"
                onClick={item.onClick}
                className="flex cursor-pointer items-center gap-1.5 rounded transition-colors hover:text-emerald-600 focus-visible:text-emerald-600 focus-visible:ring-2 focus-visible:ring-emerald-500/30 focus-visible:outline-none"
              >
                {isHome && showHomeIcon && (
                  <House aria-hidden="true" size={14} className="shrink-0 text-slate-400" />
                )}
                <span>{item.label}</span>
              </button>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
