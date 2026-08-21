"use client";

import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";

import {
  findBlankRows,
  inlineDocumentStyles,
  measureInkedHeight,
  PDF_CAPTURE_SCALE,
  PDF_IMAGE_QUALITY,
  PDF_PAGE_HEIGHT_MM,
  PDF_PAGE_WIDTH_MM,
  pickPageBreak,
} from "@/shared/lib/pdf-capture";

import "./cv-builder.css";
import { CvPreview } from "./cv-preview";
import type { CvData } from "./types";

/** `.cv-document` is authored at exactly A4 @96dpi, so a capture maps 1:1 onto the page. */
const CV_DOCUMENT_WIDTH_PX = 794;
const EXPORT_HOST_CLASS = "cv-pdf-export-host";

/**
 * Renders a Builder snapshot to a real PDF file, entirely in the browser.
 *
 * A Builder CV is stored as `contentJson` and laid out by `CvPreview` + `cv-builder.css`;
 * the API has no HTML renderer, so the browser is the only place the document exists as
 * pixels. The Builder's own "Export" is `window.print()`, which hands the user an OS
 * dialog rather than a file — that is fine as a deliberate flow inside the editor, but a
 * "Tải xuống" button in the profile has to produce bytes.
 *
 * The snapshot is mounted off-screen instead of reusing whatever `CvPreview` happens to be
 * on the page: the visible one is transform-scaled to fit its viewport and may not be
 * mounted at all, and capturing a scaled node bakes that scale into the raster.
 */
export async function renderCvDataToPdfBlob(cvData: CvData): Promise<Blob> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
    import("html2canvas-pro"),
    import("jspdf"),
  ]);

  const host = document.createElement("div");
  // Off-screen rather than `display: none`: a hidden subtree has no layout, so it would
  // capture as a zero-height canvas. `aria-hidden` keeps it out of the accessibility tree.
  host.setAttribute("aria-hidden", "true");
  host.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: -20000px",
    `width: ${CV_DOCUMENT_WIDTH_PX}px`,
    "background: #ffffff",
    "pointer-events: none",
    "z-index: -1",
  ].join("; ");
  // `.cv-document` carries a drop shadow so it reads as paper on the editor's grey
  // backdrop. On actual paper it is just a grey smudge along the page edges.
  const shadowReset = document.createElement("style");
  shadowReset.textContent = `.${EXPORT_HOST_CLASS} .cv-document { box-shadow: none; }`;
  host.className = EXPORT_HOST_CLASS;
  document.body.append(shadowReset, host);

  const root = createRoot(host);
  try {
    // `flushSync` so the DOM exists before the awaits below; a plain `render()` is
    // scheduled and would let the capture run against an empty host.
    flushSync(() => {
      root.render(<CvPreview cvData={cvData} />);
    });

    await document.fonts.ready;
    // One more frame so the browser has applied the freshly-committed layout.
    await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));

    const canvas = await html2canvas(host, {
      scale: PDF_CAPTURE_SCALE,
      useCORS: true,
      backgroundColor: "#ffffff",
      onclone: inlineDocumentStyles,
    });

    return paginateToPdf(canvas, jsPDF);
  } finally {
    // Unmount before removing the host, or React keeps a root attached to a detached node.
    root.unmount();
    host.remove();
    shadowReset.remove();
  }
}

/**
 * Slices one tall capture into A4 pages, breaking on blank rows.
 *
 * Unlike the JD export there is no per-page margin to add: `.cv-document` carries its own
 * print padding, and inserting another one shrinks the text column on every page but the first.
 */
function paginateToPdf(canvas: HTMLCanvasElement, jsPDF: typeof import("jspdf").jsPDF): Blob {
  const pdf = new jsPDF("p", "mm", "a4");
  const pageHeight = Math.floor((canvas.width * PDF_PAGE_HEIGHT_MM) / PDF_PAGE_WIDTH_MM);
  const blankRows = findBlankRows(canvas);
  const contentHeight = measureInkedHeight(canvas, blankRows);

  const pageCanvas = document.createElement("canvas");
  pageCanvas.width = canvas.width;
  pageCanvas.height = pageHeight;
  const context = pageCanvas.getContext("2d");
  if (!context) throw new Error("Canvas 2D context is unavailable");

  let start = 0;
  let pageIndex = 0;

  while (start < contentHeight) {
    const limit = Math.min(start + pageHeight, contentHeight);
    const end =
      limit >= contentHeight ? contentHeight : pickPageBreak(blankRows, start, limit, pageHeight);
    const sliceHeight = Math.max(1, end - start);

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
    context.drawImage(canvas, 0, start, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);

    if (pageIndex > 0) pdf.addPage();
    // JPEG keeps a text-on-white page visually identical to PNG at a fraction of the size;
    // a lossless page costs ~10 MB, which puts a multi-page CV over the 10 MB upload cap.
    pdf.addImage(
      pageCanvas.toDataURL("image/jpeg", PDF_IMAGE_QUALITY),
      "JPEG",
      0,
      0,
      PDF_PAGE_WIDTH_MM,
      PDF_PAGE_HEIGHT_MM,
    );

    start = end;
    pageIndex += 1;
  }

  return pdf.output("blob");
}

/** Strips path separators and characters Windows rejects, so the download always lands. */
export function toCvPdfFileName(title: string) {
  const safe = title
    .replace(/[/:*?"<>|\\]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);

  return `${safe || "UpNext-CV"}.pdf`;
}
