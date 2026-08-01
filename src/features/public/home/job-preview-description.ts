const SECTION_TITLE = /^(?:mô tả công việc|job description)$/iu;

/**
 * Creates readable preview text from the rich HTML stored on a job post.
 * Paragraph and list boundaries are retained so a dense description can still
 * be scanned inside the compact, scrollable preview surface.
 */
export function getJobPreviewDescription(value: string | null | undefined) {
  if (!value) return undefined;

  const textWithBoundaries = value
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/(?:p|div|li|h[1-6]|summary|section|article|details)>/giu, "\n")
    .replace(/<li\b[^>]*>/giu, "• ")
    .replace(/<[^>]+>/gu, "")
    .replace(/&nbsp;/giu, " ")
    .replace(/&amp;/giu, "&")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&quot;/giu, '"');

  const description = textWithBoundaries
    .split(/\n+/u)
    .map((line) => line.replace(/[\t ]+/gu, " ").trim())
    .filter((line) => line.length > 0 && !SECTION_TITLE.test(line))
    .join("\n");

  return description || undefined;
}
