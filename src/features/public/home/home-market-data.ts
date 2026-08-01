const DAY_MS = 24 * 60 * 60 * 1000;

function parseTimestamp(value: string | Date | null | undefined) {
  if (!value) return null;
  const timestamp = value instanceof Date ? value.getTime() : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
}

export function getSalaryBandIndex(value: string, fallbackIndex: number) {
  const normalized = value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/gu, "")
    .toLocaleLowerCase()
    .replace(/\s+/gu, "");
  if (normalized.includes("under") || normalized.includes("duoi") || normalized.includes("<10")) {
    return 0;
  }
  if (/10.*20/u.test(normalized)) return 1;
  if (/20.*30/u.test(normalized)) return 2;
  if (/30.*50/u.test(normalized)) return 3;
  if (
    normalized.includes("over") ||
    normalized.includes("above") ||
    normalized.includes("tren") ||
    normalized.includes(">=50") ||
    normalized.includes("50+")
  ) {
    return 4;
  }
  return Math.min(4, Math.max(0, fallbackIndex));
}

/** Parses both ISO values and the compact `dd/MM` labels emitted by the market aggregate API. */
export function parseMarketPointDate(value: string, from: string, to: string) {
  const shortDate = /^(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?$/u.exec(value.trim());
  if (!shortDate) {
    const timestamp = parseTimestamp(value);
    return timestamp === null ? null : new Date(timestamp);
  }

  const day = Number(shortDate[1]);
  const monthIndex = Number(shortDate[2]) - 1;
  const explicitYear = shortDate[3] ? Number(shortDate[3]) : null;
  const fromTimestamp = parseTimestamp(from);
  const toTimestamp = parseTimestamp(to);
  const fromDate = fromTimestamp === null ? null : new Date(fromTimestamp);
  const toDate = toTimestamp === null ? null : new Date(toTimestamp);
  const years = explicitYear
    ? [explicitYear]
    : Array.from(
        new Set(
          [fromDate?.getFullYear(), toDate?.getFullYear()].filter(
            (year): year is number => year !== undefined,
          ),
        ),
      );
  const candidates = years
    .map((year) => new Date(year, monthIndex, day))
    .filter(
      (date) =>
        date.getDate() === day && date.getMonth() === monthIndex && Number.isFinite(date.getTime()),
    );

  if (candidates.length === 0) return null;
  if (fromTimestamp === null || toTimestamp === null) return candidates[0]!;

  return (
    candidates.find(
      (date) => date.getTime() >= fromTimestamp - DAY_MS && date.getTime() <= toTimestamp + DAY_MS,
    ) ?? candidates[0]!
  );
}
