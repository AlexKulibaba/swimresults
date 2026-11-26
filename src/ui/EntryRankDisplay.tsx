import type { EntryRank } from "../meet";
import { formatEntryRank } from "./format";

interface Props {
  entryRank: EntryRank;
  compact?: boolean;
  /** Optional short label prefix, e.g. "Melderang". */
  showLabel?: boolean;
}

/**
 * Compact instrument badge for entry ranks (Melderang), sharing the split-keycap geometry of PlacementDisplay
 * in a quiet non-metallic style so it never competes with final placements.
 * Example: [4/15 | JG 09] [20/59 | OFFEN]
 */
export function EntryRankDisplay({ entryRank, compact = false, showLabel = false }: Props) {
  const fullLabel = `Rang nach Meldezeit: ${formatEntryRank(entryRank)}`;
  const items: { rank: number; of: number; scope: string }[] = [];

  if (entryRank.jahrgang) {
    items.push({
      rank: entryRank.jahrgang.rank,
      of: entryRank.jahrgang.of,
      scope: `Jg ${String(entryRank.jahrgang.jahrgang).slice(2)}`,
    });
  }
  items.push({
    rank: entryRank.overall.rank,
    of: entryRank.overall.of,
    scope: "Offen",
  });

  return (
    <span className={`er-group${compact ? " er-group--compact" : ""}`} title={fullLabel} aria-label={fullLabel}>
      {showLabel && (
        <span className="er-label" aria-hidden="true">
          Melderang
        </span>
      )}
      {items.map((item) => (
        <span key={item.scope} className="er-chip" aria-hidden="true">
          <span className="er-chip__rank mono">
            {item.rank}
            <span className="er-chip__of">/{item.of}</span>
          </span>
          <span className="er-chip__scope">{item.scope}</span>
        </span>
      ))}
    </span>
  );
}
