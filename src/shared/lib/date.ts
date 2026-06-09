import {
  format,
  formatDistanceToNowStrict,
  isValid,
  parseISO,
  type Locale as DateFnsLocale,
} from "date-fns";
import { enUS, vi } from "date-fns/locale";

import { type Locale } from "@/i18n/routing";

const dateLocales = {
  en: enUS,
  vi,
} satisfies Record<Locale, DateFnsLocale>;

export function toDate(value: Date | number | string) {
  const date = typeof value === "string" ? parseISO(value) : new Date(value);

  if (!isValid(date)) {
    throw new Error("Invalid date value");
  }

  return date;
}

export function formatAppDate(value: Date | number | string, locale: Locale = "vi") {
  return format(toDate(value), "dd/MM/yyyy", {
    locale: dateLocales[locale],
  });
}

export function formatRelativeTime(value: Date | number | string, locale: Locale = "vi") {
  return formatDistanceToNowStrict(toDate(value), {
    addSuffix: true,
    locale: dateLocales[locale],
  });
}
