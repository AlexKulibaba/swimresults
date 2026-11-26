import type { EntryRank, Round, SwimStatus } from "../meet";

const roundLabels: Record<string, string> = {
  PRE: "Vorlauf",
  SEM: "Halbfinale",
  FIN: "Finale",
  TIM: "Zeitlauf",
};

const statusLabels: Record<string, string> = {
  DNS: "nicht angetreten",
  DSQ: "disqualifiziert",
  WDR: "abgemeldet",
  DNF: "aufgegeben",
};

const statusCodes: Record<string, string> = {
  DNS: "DNS",
  DSQ: "DQ",
  WDR: "WDR",
  DNF: "DNF",
};

export function roundLabel(round: Round): string {
  return roundLabels[round] ?? round;
}

export function statusLabel(status: SwimStatus): string {
  return statusLabels[status] ?? status;
}

/** Compact swim-sheet status code, e.g. "DQ", "DNS", "WDR", "DNF". */
export function statusCode(status: SwimStatus): string {
  return statusCodes[status] ?? status;
}

/** Placeholder for a missing or pending swim time, matching official German PDFs. */
export const EMPTY_TIME = "--:--,--";

/**
 * Official German PDF swim time format: "MM:SS,hh", e.g. 6653 → "01:06,53", 2715 → "00:27,15".
 * For durations >= 1 hour, prepends "H:".
 */
export function formatSwimTime(hundredths: number): string {
  const totalSeconds = Math.floor(hundredths / 100);
  const cs = String(hundredths % 100).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = String(totalMinutes % 60).padStart(2, "0");
  const hours = Math.floor(totalMinutes / 60);
  return hours > 0 ? `${hours}:${minutes}:${seconds},${cs}` : `${minutes}:${seconds},${cs}`;
}

const dayFormat = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** "2026-11-12" → "Do., 12.11." */
export function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(isoDate));
}

/** -123 → "−1,23", 18 → "+0,18", 6233 → "+1:02,33" */
export function formatDifference(hundredths: number): string {
  const sign = hundredths < 0 ? "−" : "+";
  const abs = Math.abs(hundredths);
  const minutes = Math.floor(abs / 6000);
  const seconds = ((abs % 6000) / 100).toFixed(2).replace(".", ",");
  const formatted = minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
  return `${sign}${formatted}`;
}

/** 61 → "+0,61 s", -3 → "−0,03 s" */
export function formatReactionTime(hundredths: number): string {
  return `${formatDifference(hundredths)} s`;
}

/** Strips redundant round suffixes like "(Vorlauf)" when the round is already shown as a badge. */
export function formatEventName(name: string): string {
  return name.replace(/\s*\((Vorlauf|Finale|Zeitlauf|Halbfinale)\)\s*$/i, "").trim();
}

/** "3. von 12 im Jahrgang 2010 · 18. von 64 gesamt" */
export function formatEntryRank({ jahrgang, overall }: EntryRank): string {
  const inJahrgang = jahrgang ? `${jahrgang.rank}. von ${jahrgang.of} im Jahrgang ${jahrgang.jahrgang} · ` : "";
  return `${inJahrgang}${overall.rank}. von ${overall.of} gesamt`;
}
