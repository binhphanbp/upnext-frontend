"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

/**
 * Renders a filter/action row into the admin shell header.
 *
 * `AdminTableLayout` does this for screens built on a `<table>`, but screens that
 * render their own layout (card lists, for example) would otherwise leave the
 * header strip empty — and because that container is `empty:hidden`, the whole
 * strip collapses and the page appears to lose its filters.
 */
export function AdminHeaderFilterPortal({
  filterBar,
  actionBar,
}: {
  filterBar?: ReactNode;
  actionBar?: ReactNode;
}) {
  const [headerTarget, setHeaderTarget] = useState<HTMLElement | null>(null);

  useEffect(() => {
    setHeaderTarget(document.getElementById("admin-header-actions"));
  }, []);

  if (!headerTarget || (!filterBar && !actionBar)) return null;

  return createPortal(
    <div className="flex w-full flex-1 flex-wrap items-center justify-between gap-4 border-t border-slate-200 px-8 py-4">
      {filterBar ? (
        <div className="flex min-w-0 flex-wrap items-center gap-3">{filterBar}</div>
      ) : null}
      {actionBar ? (
        <div className="ml-auto flex shrink-0 items-center gap-2.5">{actionBar}</div>
      ) : null}
    </div>,
    headerTarget,
  );
}
