import type { Round, SwimStatus } from "../meet";

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

export function roundLabel(round: Round): string {
  return roundLabels[round] ?? round;
}

export function statusLabel(status: SwimStatus): string {
  return statusLabels[status] ?? status;
}

/** 6233 → "1:02.33", 2715 → "27.15" */
export function formatSwimTime(hundredths: number): string {
  const minutes = Math.floor(hundredths / 6000);
  const seconds = ((hundredths % 6000) / 100).toFixed(2).padStart(5, "0");
  return minutes > 0 ? `${minutes}:${seconds}` : seconds.replace(/^0(?=\d\.)/, "");
}

const dayFormat = new Intl.DateTimeFormat("de-DE", { weekday: "short", day: "2-digit", month: "2-digit", timeZone: "UTC" });

/** "2026-11-12" → "Do., 12.11." */
export function formatDay(isoDate: string): string {
  return dayFormat.format(new Date(isoDate));
}
