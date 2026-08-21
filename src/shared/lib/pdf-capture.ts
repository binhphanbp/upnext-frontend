/**
 * Primitives shared by every "rasterise a document, slice it into A4 pages" export
 * in the app (AI job descriptions, CV Builder snapshots).
 *
 * They were written for the AI JD export and lived inside that component; the CV
 * download needs exactly the same page-break arithmetic, and re-deriving it is how
 * one exporter ends up silently dropping content the other one keeps.
 */

export const PDF_PAGE_WIDTH_MM = 210;
export const PDF_PAGE_HEIGHT_MM = 297;
export const PDF_IMAGE_QUALITY = 0.95;
export const PDF_CAPTURE_SCALE = 2;

/**
 * html2canvas clones the document into an iframe and resolves styles there, but the clone's own
 * <link> stylesheets race the render: often enough they lose, and the capture comes out with no app
 * CSS at all (serif text, no colours, no layout). Injecting the live CSS synchronously into the
 * clone removes the race, so every export is identical instead of occasionally unusable.
 */
export function inlineDocumentStyles(clonedDocument: Document) {
  const css = Array.from(document.styleSheets)
    .flatMap((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText);
      } catch {
        // Cross-origin sheets are unreadable and never carry this document's design.
        return [];
      }
    })
    // Re-declaring @font-face makes the iframe re-download the font, and text is measured before
    // it arrives — which visibly eats the spaces between words. The already-loaded FontFace
    // objects are handed over below instead.
    .filter((rule) => !rule.startsWith("@font-face"))
    .join("\n");

  document.fonts.forEach((font) => {
    if (font.status === "loaded") clonedDocument.fonts.add(font);
  });

  if (!css) return;

  const style = clonedDocument.createElement("style");
  style.textContent = css;
  clonedDocument.head.append(style);
}

/**
 * Marks every horizontal row of the render that carries no ink.
 *
 * Page breaks are chosen from these rows rather than from DOM rectangles: element and line boxes
 * do not map onto the rasterised canvas closely enough, and being a few pixels out slices a row of
 * glyphs in half. A blank row provably cannot.
 */
export function findBlankRows(canvas: HTMLCanvasElement) {
  const blank = new Uint8Array(canvas.height);
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return blank;

  const { data } = context.getImageData(0, 0, canvas.width, canvas.height);
  const rowBytes = canvas.width * 4;

  for (let y = 0; y < canvas.height; y += 1) {
    const rowStart = y * rowBytes;
    let isBlank = 1;
    for (let index = rowStart; index < rowStart + rowBytes; index += 4) {
      // Near-white is background: only real ink should block a break.
      if (data[index]! < 245 || data[index + 1]! < 245 || data[index + 2]! < 245) {
        isBlank = 0;
        break;
      }
    }
    blank[y] = isBlank;
  }

  return blank;
}

export function isBlankRange(blankRows: Uint8Array, from: number, to: number) {
  for (let y = Math.max(0, from); y < to; y += 1) {
    if (!blankRows[y]) return false;
  }
  return true;
}

/**
 * Picks where one page ends: the lowest blank row that still fills most of the page, falling back
 * to a hard cut so a solid block taller than a page can never stall the loop or lose content.
 */
export function pickPageBreak(
  blankRows: Uint8Array,
  start: number,
  limit: number,
  available: number,
) {
  const earliest = start + Math.floor(available * 0.75);

  for (let y = limit; y > earliest; y -= 1) {
    if (blankRows[y]) return y;
  }

  return limit;
}

/**
 * Drops the trailing blank rows of a capture.
 *
 * A short document is padded out to a full page by `min-height`, and that padding is
 * not content: spilling it costs a whole extra sheet of blank paper.
 */
export function measureInkedHeight(canvas: HTMLCanvasElement, blankRows: Uint8Array) {
  let contentHeight = canvas.height;
  while (contentHeight > 1 && blankRows[contentHeight - 1]) contentHeight -= 1;
  return contentHeight;
}
