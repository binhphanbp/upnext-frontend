/** Turns the API's incomplete-profile signals into a direct, useful next step. */
export function getMissingSignalsDescription(
  missingSignals: readonly string[],
  fallback: string,
  locale: string,
) {
  const signals = new Set(missingSignals.map((signal) => signal.toUpperCase()));
  const isEnglish = locale === "en";
  const missing: string[] = [];

  if (signals.has("SKILLS")) missing.push(isEnglish ? "skills" : "kỹ năng");
  if (signals.has("POSITION")) missing.push(isEnglish ? "a target role" : "vị trí mong muốn");
  if (missing.length === 0) return fallback;

  const items = missing.join(isEnglish ? " and " : " và ");
  return isEnglish
    ? `Add ${items} so UpNext can recommend roles that better match your goals.`
    : `Thêm ${items} để UpNext gợi ý cơ hội sát với mục tiêu của bạn hơn.`;
}
