import { addDays } from "./buildPlan";
import { formatNumber } from "@/i18n/format";

const FALLBACK_MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthAndDay(dateString: string, language: string): { month: string; day: string } {
  const [year, month, day] = dateString.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  try {
    const parts = new Intl.DateTimeFormat(language, { month: "short", day: "numeric", timeZone: "UTC" }).formatToParts(date);
    return {
      month: parts.find((part) => part.type === "month")?.value ?? FALLBACK_MONTHS[month - 1],
      day: formatNumber(parts.find((part) => part.type === "day")?.value ?? day, language),
    };
  } catch {
    return { month: FALLBACK_MONTHS[month - 1], day: formatNumber(day, language) };
  }
}

/** "Oct 19–25" for the Monday-to-Sunday week starting at `weekStart`. */
export function formatWeekRange(weekStart: string, language: string): string {
  const start = monthAndDay(weekStart, language);
  const end = monthAndDay(addDays(weekStart, 6), language);
  const sameMonth = start.month === end.month;
  if (language === "en") {
    return sameMonth ? `${start.month} ${start.day}–${end.day}` : `${start.month} ${start.day}–${end.month} ${end.day}`;
  }
  return sameMonth ? `${start.day}–${end.day} ${start.month}` : `${start.day} ${start.month}–${end.day} ${end.month}`;
}
