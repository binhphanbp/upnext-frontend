"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * A blocking, screen-wide waiting layer.
 *
 * Rendered through a portal on purpose: the workspace content area is its own stacking context, so a
 * `fixed inset-0` element declared inside it still paints *below* the header and sidebar no matter
 * how high its z-index goes. Only escaping to `document.body` covers the whole screen.
 */
export function FullScreenOverlay({ children }: Readonly<{ children: React.ReactNode }>) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return createPortal(
    <output
      aria-live="polite"
      className="fixed inset-0 z-9999 flex flex-col items-center justify-center gap-4 bg-slate-900/40 px-6 text-center backdrop-blur-sm"
    >
      {children}
    </output>,
    document.body,
  );
}
