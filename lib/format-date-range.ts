import type { StartEndDate } from "@/types/content";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

function formatMonth(yyyyMm: string): string {
  const [year, month] = yyyyMm.split("-");
  const index = Number(month) - 1;
  return MONTHS[index] ? `${MONTHS[index]} ${year}` : yyyyMm;
}

/**
 * `endDate: null` → a single point in time (e.g. "May 2025").
 * `endDate: "present"` → an ongoing range (e.g. "Aug 2025 – Present").
 * Otherwise → a closed range (e.g. "Jun 2023 – Aug 2023").
 */
export function formatDateRange({ startDate, endDate }: StartEndDate): string {
  if (endDate === null) return formatMonth(startDate);
  if (endDate === "present") return `${formatMonth(startDate)} – Present`;
  return `${formatMonth(startDate)} – ${formatMonth(endDate)}`;
}
