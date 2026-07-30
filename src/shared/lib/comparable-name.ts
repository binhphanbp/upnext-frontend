const COMBINING_MARKS = /[̀-ͯ]/g;

/**
 * Collapses a catalog name to the key used for duplicate detection, matching the backend rule in
 * `src/common/utils/comparable-name.ts`: case, diacritics and separators are noise, so "ReactJS",
 * "React JS" and "react.js" are one skill. `+` and `#` survive so C, C++ and C# stay distinct.
 */
export function toComparableName(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(COMBINING_MARKS, "")
    .replace(/[đ]/g, "d")
    .replace(/[^a-z0-9+#]+/g, "");
}
