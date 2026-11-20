import type { Meet, Swimmer } from "./model";

/** Swimmers whose name contains every word of the query, ignoring case and accents. */
export function searchSwimmers(meet: Meet, query: string): Swimmer[] {
  return meet.swimmers
    .filter((swimmer) => matchesEveryWord(`${swimmer.firstName} ${swimmer.lastName}`, query))
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName, "de") ||
        a.firstName.localeCompare(b.firstName, "de") ||
        (a.jahrgang ?? 0) - (b.jahrgang ?? 0),
    );
}

/** True when the text contains every word of a non-empty query, ignoring case and accents. */
export function matchesEveryWord(text: string, query: string): boolean {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  const normalized = normalize(text);
  return words.length > 0 && words.every((word) => normalized.includes(word));
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
