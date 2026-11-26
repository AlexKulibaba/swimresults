import type { ScheduledSwim, Swimmer } from "../meet";
import { EntryRankDisplay } from "./EntryRankDisplay";
import { EMPTY_TIME, formatDay, formatEventName, formatSwimTime, roundLabel, statusCode, statusLabel } from "./format";
import { PlacementDisplay } from "./PlacementDisplay";

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

export function SwimAccordionRow({
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
  const completed = swim.phase === "done" && (swim.status !== null || swim.swimTime !== null);
  const isFinal = swim.round === "FIN";
  const timeText = swim.time ? `${swim.timeApproximate ? "~" : ""}${swim.time}` : "--:--";
  const entryText = swim.entryTime !== null ? formatSwimTime(swim.entryTime) : EMPTY_TIME;
  const resultText = completed
    ? swim.status
      ? statusCode(swim.status)
      : formatSwimTime(swim.swimTime!)
    : swim.status
      ? statusCode(swim.status)
      : EMPTY_TIME;

  const hasResult = completed && swim.swimTime !== null;
  const hasStatus = swim.status !== null;
  const hasBadges =
    (swim.phase === "next" && !swimmer) || swim.ifQualified || (completed && swim.places.length > 0);

  return (
    <li
      className={`swim-row swim-row--${swim.phase}${swim.ifQualified ? " swim-row--possible" : ""}${
        expanded ? " swim-row--expanded" : ""
      }`}
    >
      <button type="button" className="swim-row__trigger" aria-expanded={expanded} onClick={onToggle}>
        <div className="swim-row__left">
          <div className="swim-row__meta">
            <span className={`tag tag--fixed ${isFinal ? "tag--live" : "tag--round"}`}>{roundLabel(swim.round)}</span>
            <span
              className="swim-row__clock mono"
              title={swim.timeApproximate ? `ca. ${swim.time} Uhr` : undefined}
            >
              {timeText}
            </span>
            <span className="swim-row__wk mono">WK {swim.eventNumber}</span>
          </div>
          <div className="swim-row__event">
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
          </div>
          {hasBadges && (
            <div className="swim-row__badges">
              {swim.phase === "next" && !swimmer && <span className="tag tag--accent">Nächster</span>}
              {swim.ifQualified && <span className="tag tag--muted">bei Quali</span>}
              {completed && swim.places.length > 0 && (
              <PlacementDisplay places={swim.places} compact medals={swim.awardsMedals} />
            )}
            </div>
          )}
        </div>

        <div className="swim-row__right mono">
          <div className="swim-row__entry" title="Meldezeit">
            {entryText}
          </div>
          <div
            className={`swim-row__result${hasStatus ? " swim-row__result--status" : hasResult ? " swim-row__result--done" : " swim-row__result--empty"}`}
            title={swim.status ? statusLabel(swim.status) : "Ergebnis"}
          >
            {resultText}
          </div>
        </div>
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
            {!swim.ifQualified && (
              <>
                <div>
                  <dt>Lauf</dt>
                  <dd className="num">{swim.heat ? `${swim.heat} / ${swim.heatCount}` : "–"}</dd>
                </div>
                <div>
                  <dt>Bahn</dt>
                  <dd className="num">{swim.lane ?? "–"}</dd>
                </div>
              </>
            )}
            {showClub && (
              <div>
                <dt>Verein</dt>
                <dd>{swim.club}</dd>
              </div>
            )}
          </dl>

          {completed && swim.places.length > 0 && (
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
              <button type="button" className="btn-inline btn-inline--accent" onClick={() => onOpenHeat(swim.eventId, swim.heatId!)}>
                Lauf {swim.heat} ansehen →
              </button>
            )}
            {completed && onOpenDetail && (
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
