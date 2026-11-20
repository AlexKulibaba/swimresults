import type { Meet, Swimmer } from "./model";

/** Swimmers whose name contains every word of the query, ignoring case and accents. */
export function searchSwimmers(meet: Meet, query: string): Swimmer[] {
  const words = normalize(query).split(/\s+/).filter(Boolean);
  if (words.length === 0) return [];

  return meet.swimmers
    .filter((swimmer) => {
      const name = normalize(`${swimmer.firstName} ${swimmer.lastName}`);
      return words.every((word) => name.includes(word));
    })
    .sort(
      (a, b) =>
        a.lastName.localeCompare(b.lastName, "de") ||
        a.firstName.localeCompare(b.firstName, "de") ||
        (a.jahrgang ?? 0) - (b.jahrgang ?? 0),
    );
}

function normalize(text: string): string {
  return text.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase();
}
