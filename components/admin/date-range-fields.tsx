"use client";

import type { StartEndDate } from "@/types/content";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const CURRENT_YEAR = new Date().getFullYear();
// Native <input type="month"> isn't supported in Safari — it silently degrades to a
// text box, which would defeat structured dates entirely. Plain <select>s work everywhere.
const YEARS = Array.from({ length: CURRENT_YEAR - 2000 + 6 }, (_, i) => CURRENT_YEAR + 5 - i);

const selectClass =
  "rounded border border-fg/20 bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-2 focus-visible:ring-fg/70";

function MonthYearSelect({
  value,
  onChange,
}: {
  value: string; // "YYYY-MM" or ""
  onChange: (value: string) => void;
}) {
  const [yyyy = "", mm = ""] = value ? value.split("-") : ["", ""];

  function commit(nextYear: string, nextMonth: string) {
    if (nextYear && nextMonth) onChange(`${nextYear}-${nextMonth}`);
  }

  return (
    <div className="flex gap-2">
      <select
        className={selectClass}
        value={mm}
        onChange={(e) => commit(yyyy || String(CURRENT_YEAR), e.target.value)}
      >
        <option value="" disabled>
          Month
        </option>
        {MONTHS.map((label, i) => (
          <option key={label} value={String(i + 1).padStart(2, "0")}>
            {label}
          </option>
        ))}
      </select>
      <select
        className={selectClass}
        value={yyyy}
        onChange={(e) => commit(e.target.value, mm || "01")}
      >
        <option value="" disabled>
          Year
        </option>
        {YEARS.map((y) => (
          <option key={y} value={y}>
            {y}
          </option>
        ))}
      </select>
    </div>
  );
}

type EndMode = "range" | "present" | "single";

function endModeOf(endDate: StartEndDate["endDate"]): EndMode {
  if (endDate === "present") return "present";
  if (endDate === null) return "single";
  return "range";
}

export function DateRangeFields({
  value,
  onChange,
}: {
  value: StartEndDate;
  onChange: (value: StartEndDate) => void;
}) {
  const endMode = endModeOf(value.endDate);
  const invalid =
    endMode === "range" &&
    typeof value.endDate === "string" &&
    value.endDate !== "present" &&
    value.startDate &&
    value.endDate < value.startDate;

  function setEndMode(mode: EndMode) {
    if (mode === "present") onChange({ ...value, endDate: "present" });
    else if (mode === "single") onChange({ ...value, endDate: null });
    else onChange({ ...value, endDate: value.startDate || "" });
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xs text-dim">{endMode === "single" ? "Date" : "Start"}</span>
        <MonthYearSelect
          value={value.startDate}
          onChange={(startDate) => onChange({ ...value, startDate })}
        />
        <select
          className={selectClass}
          value={endMode}
          onChange={(e) => setEndMode(e.target.value as EndMode)}
        >
          <option value="single">Single date</option>
          <option value="range">Has an end date</option>
          <option value="present">Ongoing (Present)</option>
        </select>
        {endMode === "range" && (
          <>
            <span className="text-xs text-dim">End</span>
            <MonthYearSelect
              value={typeof value.endDate === "string" && value.endDate !== "present" ? value.endDate : ""}
              onChange={(endDate) => onChange({ ...value, endDate })}
            />
          </>
        )}
      </div>
      {invalid && <p className="text-xs text-red-500">End date must be after the start date.</p>}
    </div>
  );
}
