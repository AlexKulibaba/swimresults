import { eventsBySession, type Meet, type MeetClock, type SessionEventSummary } from "../meet";
import { formatDay, formatEventName, roundLabel } from "./format";

interface Props {
  meet: Meet;
  clock: MeetClock;
  onOpenEvent: (eventId: string) => void;
  onOpenHeat: (eventId: string, heatId: string) => void;
}

const genderShort: Record<string, string> = {
  F: "w",
  M: "m",
  X: "mixed",
};

export function EventsView({ meet, clock, onOpenEvent, onOpenHeat }: Props) {
  const sessions = eventsBySession(meet, clock);

  return (
    <section className="stack">
      <header className="view-header">
        <p className="view-header__kicker">{meet.summary.name}</p>
        <h1>Wettkampffolge</h1>
      </header>

      {sessions.map(({ session, events }) => (
        <section key={session.number} className="session-block">
          <div className="session-block__head">
            <h2 className="session-block__title">Abschnitt {session.number}</h2>
            <span className="session-block__meta num">
              {formatDay(session.date)}
              {session.daytime && ` · ${session.daytime} Uhr`}
            </span>
          </div>

          <ol className="wk-list">
            {events.map((event) => (
              <EventRow key={event.id} event={event} onOpenEvent={onOpenEvent} onOpenHeat={onOpenHeat} />
            ))}
          </ol>
        </section>
      ))}
    </section>
  );
}

function EventRow({
  event,
  onOpenEvent,
  onOpenHeat,
}: {
  event: SessionEventSummary;
  onOpenEvent: (eventId: string) => void;
  onOpenHeat: (eventId: string, heatId: string) => void;
}) {
  const gender = genderShort[event.gender];
  const isFinal = event.round === "FIN";
  const isRunning = event.state === "running";
  const isFinished = event.state === "finished";

  return (
    <li className={`wk-row wk-row--${event.state}`}>
      <button type="button" className="wk-row__trigger" onClick={() => onOpenEvent(event.id)}>
        <span className="wk-row__num mono">WK {event.number}</span>
        <span className="wk-row__main">
          <span className="wk-row__name">
            {formatEventName(event.name)}
            {gender && !event.name.toLowerCase().includes("weiblich") && !event.name.toLowerCase().includes("männlich")
              ? ` (${gender})`
              : ""}
          </span>
          <span className="wk-row__sub">
            <span className={`tag tag--fixed ${isFinal ? "tag--live" : "tag--round"}`}>{roundLabel(event.round)}</span>
            {event.heats.length > 0 && (
              <span className="wk-row__heats num">
                {event.heats.length === 1 ? "1 Lauf" : `${event.heats.length} Läufe`}
              </span>
            )}
          </span>
        </span>
        <span className="wk-row__time mono">{event.daytime ?? "--:--"}</span>
      </button>

      {isRunning && event.heats.length > 0 && (
        <div className="heat-cubes" aria-label={`Läufe in WK ${event.number}`}>
          {event.heats.map((heat) => (
            <button
              key={heat.id}
              type="button"
              className={`heat-cube heat-cube--${heat.state} mono`}
              title={`Lauf ${heat.number}${heat.daytime ? ` · ${heat.daytime}` : ""} (${
                heat.state === "finished" ? "beendet" : heat.state === "running" ? "läuft" : "geplant"
              })`}
              onClick={() => onOpenHeat(event.id, heat.id)}
            >
              {heat.number}
            </button>
          ))}
        </div>
      )}

      {isFinished && <span className="visually-hidden">beendet</span>}
    </li>
  );
}
