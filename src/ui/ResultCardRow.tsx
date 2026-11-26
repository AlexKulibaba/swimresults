import type { ScheduledSwim, Swimmer } from "../meet";
import { EntryRankDisplay } from "./EntryRankDisplay";
import { EMPTY_TIME, formatDay, formatEventName, formatSwimTime, roundLabel, statusCode, statusLabel } from "./format";
import { PlacementDisplay, rankTier, shortGroupLabel } from "./PlacementDisplay";

interface Props {
  swim: ScheduledSwim;
  expanded: boolean;
  onToggle: () => void;
  /** Shown on followed lists where multiple swimmers appear. */
  swimmer?: Swimmer;
  /** For swimmers starting for several clubs. */
  showClub?: boolean;
  showEntryRank?: boolean;
  onOpenHeat?: (eventId: string, heatId: string) => void;
  onOpenSwimmer?: (swimmerId: string) => void;
  onOpenDetail?: () => void;
}

interface CapMeta {
  tierClass: string;
  primaryText: string;
  scopeText: string;
  hasRankBorder: boolean;
}

function capMetaOf(swim: ScheduledSwim): CapMeta {
  const completed = swim.phase === "done" && (swim.status !== null || swim.swimTime !== null);

  if (swim.status) {
    return { tierClass: "rcap--status", primaryText: statusCode(swim.status), scopeText: "Status", hasRankBorder: false };
  }
  if (completed && swim.places.length > 0) {
    const primary = swim.places[0]!;
    const tier = rankTier(primary.place, swim.awardsMedals);
    return {
      tierClass: `rcap--${tier}`,
      primaryText: String(primary.place),
      scopeText: swim.awardsMedals ? shortGroupLabel(primary.group) : "Seed",
      hasRankBorder: tier !== "other",
    };
  }
  return {
    tierClass: "rcap--other",
    primaryText: "✓",
    scopeText: "Fertig",
    hasRankBorder: false,
  };
}

/** Groups swims by ISO date while preserving their incoming order. */
export function groupSwimsByDay<T extends { date: string }>(swims: T[]): { date: string; swims: T[] }[] {
  const groups: { date: string; swims: T[] }[] = [];
  for (const swim of swims) {
    const current = groups.at(-1);
    if (current && current.date === swim.date) {
      current.swims.push(swim);
    } else {
      groups.push({ date: swim.date, swims: [swim] });
    }
  }
  return groups;
}

/**
 * Completed swim row inside a day block (V3 flush left placement rail; days themselves are separated like V2).
 */
export function ResultCardRow({
  swim,
  expanded,
  onToggle,
  swimmer,
  showClub,
  showEntryRank,
  onOpenHeat,
  onOpenSwimmer,
  onOpenDetail,
}: Props) {
  const isFinal = swim.round === "FIN";
  const cap = capMetaOf(swim);
  const timeText = swim.time ? `${swim.timeApproximate ? "~" : ""}${swim.time}` : "--:--";
  const entryText = swim.entryTime !== null ? formatSwimTime(swim.entryTime) : EMPTY_TIME;
  const resultText = swim.status
    ? statusCode(swim.status)
    : swim.swimTime !== null
      ? formatSwimTime(swim.swimTime)
      : EMPTY_TIME;
  const extraPlaces = swim.places.length > 1 ? swim.places.slice(1) : [];

  return (
    <li className={`rrow ${cap.tierClass}${expanded ? " rrow--expanded" : ""}`}>
      <button type="button" className="rcard__trigger" aria-expanded={expanded} onClick={onToggle}>
        <span className="rcard__cap">
          <span className="rcard__cap-num mono">{cap.primaryText}</span>
          <span className="rcard__cap-scope">{cap.scopeText}</span>
        </span>

        <span className="rcard__main">
          <span className="rcard__content">
            <span className="swim-row__meta">
              <span className={`tag tag--fixed ${isFinal ? "tag--live" : "tag--round"}`}>{roundLabel(swim.round)}</span>
              <span className="swim-row__clock mono">{timeText}</span>
              <span className="swim-row__wk mono">WK {swim.eventNumber}</span>
            </span>
            <span className="swim-row__event">
              {swimmer && (
                <>
                  <span className="swim-row__swimmer">
                    {swimmer.firstName} {swimmer.lastName}
                  </span>
                  <span className="swim-row__sep" aria-hidden="true">
                    ·
                  </span>
                </>
              )}
              {formatEventName(swim.eventName)}
            </span>
            {extraPlaces.length > 0 && (
              <span className="swim-row__badges">
                <PlacementDisplay places={extraPlaces} compact medals={swim.awardsMedals} />
              </span>
            )}
          </span>

          <span className="swim-row__right mono">
            <span className="swim-row__entry" title="Meldezeit">
              {entryText}
            </span>
            <span
              className={`swim-row__result${
                swim.status
                  ? " swim-row__result--status"
                  : swim.swimTime !== null
                    ? " swim-row__result--done"
                    : " swim-row__result--empty"
              }`}
              title={swim.status ? statusLabel(swim.status) : "Ergebnis"}
            >
              {resultText}
            </span>
          </span>
        </span>
      </button>

      {expanded && (
        <div className="swim-row__body">
          <dl className="swim-row__grid">
            <div>
              <dt>Zeitplan</dt>
              <dd className="num">
                {formatDay(swim.date)} · Abschnitt {swim.session}
              </dd>
            </div>
            <div>
              <dt>Runde</dt>
              <dd>{roundLabel(swim.round)}</dd>
            </div>
            <div>
              <dt>Lauf</dt>
              <dd className="num">{swim.heat ? `${swim.heat} / ${swim.heatCount}` : "–"}</dd>
            </div>
            <div>
              <dt>Bahn</dt>
              <dd className="num">{swim.lane ?? "–"}</dd>
            </div>
            {showClub && (
              <div>
                <dt>Verein</dt>
                <dd>{swim.club}</dd>
              </div>
            )}
          </dl>

          {swim.places.length > 0 && (
            <div className="swim-row__rank">
              <PlacementDisplay places={swim.places} medals={swim.awardsMedals} />
            </div>
          )}

          {showEntryRank && swim.entryRank && (
            <div className="swim-row__rank">
              <EntryRankDisplay entryRank={swim.entryRank} showLabel />
            </div>
          )}

          <div className="swim-row__actions">
            {swim.heatId && onOpenHeat && (
              <button
                type="button"
                className="btn-inline btn-inline--accent"
                onClick={() => onOpenHeat(swim.eventId, swim.heatId!)}
              >
                Lauf {swim.heat} ansehen →
              </button>
            )}
            {onOpenDetail && (
              <button type="button" className="btn-inline" onClick={onOpenDetail}>
                Startdetails →
              </button>
            )}
            {swimmer && onOpenSwimmer && (
              <button type="button" className="btn-inline" onClick={() => onOpenSwimmer(swimmer.id)}>
                {swimmer.firstName} {swimmer.lastName} →
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
