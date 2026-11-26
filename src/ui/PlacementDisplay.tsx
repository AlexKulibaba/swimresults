import type { Place } from "../meet";

interface Props {
  places: Place[];
  compact?: boolean;
  /** True when medals are awarded in this round; false for prelims feeding into a final (seed/rank only). */
  medals?: boolean;
}

export type RankTier = "gold" | "silver" | "bronze" | "top8" | "other";

export function rankTier(place: number, medals = true): RankTier {
  if (!medals) return "other";
  if (place === 1) return "gold";
  if (place === 2) return "silver";
  if (place === 3) return "bronze";
  if (place <= 8) return "top8";
  return "other";
}

/**
 * Compacts verbose German LENEX scoring group names into dense instrument labels:
 * - "Offene Wertung" → "Offen"
 * - "Jahrgang 2006" → "Jg 06"
 * - "Jahrgang 2008 und älter" → "Jg ≤08"
 * - "Jahrgang 2014 bis 2018" → "Jg 14–18"
 * - "U23-Wertung" → "U23"
 */
export function shortGroupLabel(group: string): string {
  const trimmed = group.trim();
  if (/^offene(\s+wertung)?$/i.test(trimmed)) return "Offen";

  const range = trimmed.match(/^jahrgang\s+(\d{4})\s+(?:bis|-|–)\s+(\d{4})$/i);
  if (range) return `Jg ${range[1]!.slice(2)}–${range[2]!.slice(2)}`;

  const older = trimmed.match(/^jahrgang\s+(\d{4})\s+und\s+älter$/i);
  if (older) return `Jg ≤${older[1]!.slice(2)}`;

  const younger = trimmed.match(/^jahrgang\s+(\d{4})\s+und\s+jünger$/i);
  if (younger) return `Jg ≥${younger[1]!.slice(2)}`;

  const single = trimmed.match(/^jahrgang\s+(\d{4})$/i);
  if (single) return `Jg ${single[1]!.slice(2)}`;

  return trimmed.replace(/-?Wertung$/i, "").trim();
}

export function PlacementDisplay({ places, compact = false, medals = true }: Props) {
  if (places.length === 0) return null;

  return (
    <span className={`pl-group${compact ? " pl-group--compact" : ""}`}>
      {places.map((p) => {
        const tier = rankTier(p.place, medals);
        const label = medals ? `${p.place}. Platz, ${p.group}` : `${p.place}. Vorlauf, ${p.group}`;
        return (
          <span
            key={`${p.group}-${p.place}`}
            className={`pl-split pl-tier--${tier}`}
            title={label}
            aria-label={label}
          >
            <span className="pl-split__rank mono" aria-hidden="true">
              <span className="pl-split__rank-num">{p.place}</span>
            </span>
            <span className="pl-split__scope" aria-hidden="true">
              {shortGroupLabel(p.group)}
            </span>
          </span>
        );
      })}
    </span>
  );
}
