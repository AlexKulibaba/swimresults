import { heatDetail, type HeatLane, type Meet, type MeetClock } from "../meet";
import { EntryRankDisplay } from "./EntryRankDisplay";
import {
  EMPTY_TIME,
  formatDay,
  formatDifference,
  formatEventName,
  formatReactionTime,
  formatSwimTime,
  roundLabel,
  statusCode,
  statusLabel,
} from "./format";
import { PlacementDisplay } from "./PlacementDisplay";

interface Props {
  meet: Meet;
  eventId: string;
  heatId: string;
  clock: MeetClock;
  onOpenEvent: (eventId: string) => void;
  onOpenHeat: (eventId: string, heatId: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
}

const heatStateLabels = {
  finished: "Beendet",
  running: "Läuft",
  scheduled: "Geplant",
} as const;

export function HeatDetailView({
  meet,
  eventId,
  heatId,
  clock,
  onOpenEvent,
  onOpenHeat,
  onOpenSwim,
}: Props) {
  const data = heatDetail(meet, eventId, heatId, clock);
  if (!data) return <p className="error">Lauf nicht gefunden.</p>;

  const { event, heat, prevHeat, nextHeat } = data;
  const finished = heat.state === "finished";

  return (
    <section className="stack">
      <header className="view-header">
        <div className="view-header__badges">
          <span className={`tag ${event.round === "FIN" ? "tag--live" : "tag--round"}`}>{roundLabel(event.round)}</span>
          <span className="view-header__kicker mono">WK {event.number}</span>
          <span className={`heat-state heat-state--${heat.state}`}>{heatStateLabels[heat.state]}</span>
        </div>
        <h1>
          {formatEventName(event.name)} · Lauf {heat.number} / {heat.heatCount}
        </h1>
        <p className="muted num">
          {formatDay(event.date)} · Abschnitt {event.session}
          {heat.daytime && ` · ca. ${heat.daytime} Uhr`}
        </p>
      </header>

      <div className="heat-nav">
        <button
          type="button"
          className="heat-nav__btn"
          disabled={!prevHeat}
          onClick={() => prevHeat && onOpenHeat(event.id, prevHeat.id)}
        >
          ← {prevHeat ? `Lauf ${prevHeat.number}` : "Erster Lauf"}
        </button>
        <button type="button" className="link heat-nav__all" onClick={() => onOpenEvent(event.id)}>
          Alle Läufe
        </button>
        <button
          type="button"
          className="heat-nav__btn"
          disabled={!nextHeat}
          onClick={() => nextHeat && onOpenHeat(event.id, nextHeat.id)}
        >
          {nextHeat ? `Lauf ${nextHeat.number}` : "Letzter Lauf"} →
        </button>
      </div>

      {heat.lanes.length === 0 ? (
        <p className="muted">In diesem Lauf sind keine Bahnen belegt.</p>
      ) : (
        <ol className="lane-list">
          {heat.lanes.map((lane) => (
            <LaneRow
              key={`${lane.lane ?? "x"}-${lane.swimmer.id}`}
              lane={lane}
              finished={finished}
              awardsMedals={event.awardsMedals}
              onOpenSwim={
                finished && (lane.swimTime !== null || lane.status !== null)
                  ? () => onOpenSwim(lane.swimmer.id, event.id)
                  : undefined
              }
            />
          ))}
        </ol>
      )}
    </section>
  );
}

function LaneRow({
  lane,
  finished,
  awardsMedals,
  onOpenSwim,
}: {
  lane: HeatLane;
  finished: boolean;
  awardsMedals: boolean;
  onOpenSwim?: () => void;
}) {
  const entry = lane.entryTime !== null ? formatSwimTime(lane.entryTime) : EMPTY_TIME;
  const result = lane.status
    ? statusCode(lane.status)
    : lane.swimTime !== null
      ? formatSwimTime(lane.swimTime)
      : EMPTY_TIME;

  const content = (
    <>
      <div className="lane-row__lane mono">{lane.lane ?? "–"}</div>

      <div className="lane-row__main">
        <div className="lane-row__swimmer">
          <span className="lane-row__name">
            {lane.swimmer.lastName}, {lane.swimmer.firstName}
          </span>
          {lane.swimmer.jahrgang && <span className="lane-row__jg mono">{lane.swimmer.jahrgang}</span>}
        </div>
        <div className="lane-row__club">{lane.club}</div>

        <div className="lane-row__facts num">
          {finished && lane.places.length > 0 && (
            <PlacementDisplay places={lane.places} compact medals={awardsMedals} />
          )}
          {lane.entryRank && <EntryRankDisplay entryRank={lane.entryRank} compact />}
          {finished && lane.reactionTime !== null && (
            <span className="lane-row__fact">RT {formatReactionTime(lane.reactionTime)}</span>
          )}
          {finished && lane.differenceFromEntryTime !== null && (
            <span
              className={`lane-row__fact mono ${lane.differenceFromEntryTime < 0 ? "faster" : lane.differenceFromEntryTime > 0 ? "slower" : ""}`}
            >
              {formatDifference(lane.differenceFromEntryTime)}
            </span>
          )}
        </div>
      </div>

      <div className="lane-row__times mono">
        <div className="lane-row__entry" title="Meldezeit">
          {entry}
        </div>
        <div
          className={`lane-row__result${
            lane.status
              ? " swim-row__result--status"
              : finished && lane.swimTime !== null
                ? " swim-row__result--done"
                : " swim-row__result--empty"
          }`}
          title={lane.status ? statusLabel(lane.status) : "Ergebnis"}
        >
          {result}
        </div>
      </div>
    </>
  );

  return (
    <li className={`lane-row${onOpenSwim ? " lane-row--clickable" : ""}`}>
      {onOpenSwim ? (
        <button type="button" className="lane-row__trigger" onClick={onOpenSwim}>
          {content}
        </button>
      ) : (
        <div className="lane-row__trigger">{content}</div>
      )}
    </li>
  );
}
