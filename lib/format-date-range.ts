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
 * Plain words, no dash (v2):
 * `endDate: null` → a single point ("May 2025").
 * `endDate: "present"` → "Since Aug 2025".
 * Same year → the year once ("May to Aug 2026"); otherwise "Jun 2023 to Aug 2025".
 */
export function formatDateRange({ startDate, endDate }: StartEndDate): string {
  if (endDate === null) return formatMonth(startDate);
  if (endDate === "present") return `Since ${formatMonth(startDate)}`;
  if (startDate.slice(0, 4) === endDate.slice(0, 4)) {
    return `${formatMonth(startDate).split(" ")[0]} to ${formatMonth(endDate)}`;
  }
  return `${formatMonth(startDate)} to ${formatMonth(endDate)}`;
}
