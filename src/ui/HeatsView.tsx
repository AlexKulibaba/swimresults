import { eventHeats, type EventHeat, type Meet, type MeetClock } from "../meet";
import { EMPTY_TIME, formatDay, formatEventName, formatSwimTime, roundLabel, statusCode, statusLabel } from "./format";

interface Props {
  meet: Meet;
  eventId: string;
  clock: MeetClock;
  onOpenHeat: (eventId: string, heatId: string) => void;
}

const heatStateLabels = {
  finished: "Beendet",
  running: "Läuft",
  scheduled: "Geplant",
} as const;

export function HeatsView({ meet, eventId, clock, onOpenHeat }: Props) {
  const data = eventHeats(meet, eventId, clock);
  if (!data) return <p className="error">Wettkampf nicht gefunden.</p>;

  const { event, heats } = data;

  return (
    <section className="stack">
      <header className="view-header">
        <div className="view-header__badges">
          <span className={`tag ${event.round === "FIN" ? "tag--live" : "tag--round"}`}>{roundLabel(event.round)}</span>
          <span className="view-header__kicker mono">WK {event.number}</span>
          <span className="view-header__kicker num">
            {formatDay(event.date)} · Abschnitt {event.session}
          </span>
        </div>
        <h1>{formatEventName(event.name)}</h1>
      </header>

      {heats.length === 0 ? (
        <p className="muted">Für diesen Wettkampf sind noch keine Läufe eingeteilt.</p>
      ) : (
        <div className="heats-sheet">
          {heats.map((heat) => (
            <HeatSheetBlock
              key={heat.id}
              heat={heat}
              onOpen={() => onOpenHeat(event.id, heat.id)}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function HeatSheetBlock({ heat, onOpen }: { heat: EventHeat; onOpen: () => void }) {
  const showResults = heat.state === "finished";

  return (
    <button
      type="button"
      className={`heat-block heat-block--${heat.state}`}
      onClick={onOpen}
    >
      <div className="heat-block__head">
        <div className="heat-block__title">
          <span className="heat-block__label num">
            Lauf {heat.number} / {heat.heatCount}
          </span>
          {heat.daytime && <span className="heat-block__time mono">ca. {heat.daytime} Uhr</span>}
        </div>
        <span className={`heat-state heat-state--${heat.state}`}>{heatStateLabels[heat.state]}</span>
      </div>

      {heat.lanes.length === 0 ? (
        <div className="heat-block__empty muted">Keine Bahnen belegt</div>
      ) : (
        <table className="pdf-table">
          <thead>
            <tr>
              <th className="pdf-table__lane" scope="col">
                Bahn
              </th>
              <th className="pdf-table__swimmer" scope="col">
                Name
              </th>
              <th className="pdf-table__jg" scope="col">
                Jg.
              </th>
              <th className="pdf-table__club" scope="col">
                Verein
              </th>
              <th className="pdf-table__time" scope="col">
                {showResults ? "Ergebnis" : "Meldezeit"}
              </th>
            </tr>
          </thead>
          <tbody>
            {heat.lanes.map((lane) => {
              const entry = lane.entryTime !== null ? formatSwimTime(lane.entryTime) : EMPTY_TIME;
              const result = lane.status
                ? statusCode(lane.status)
                : lane.swimTime !== null
                  ? formatSwimTime(lane.swimTime)
                  : EMPTY_TIME;

              return (
                <tr key={`${lane.lane ?? "x"}-${lane.swimmer.id}`}>
                  <td className="pdf-table__lane mono">{lane.lane ?? "–"}</td>
                  <td className="pdf-table__swimmer">
                    {lane.swimmer.lastName}, {lane.swimmer.firstName}
                  </td>
                  <td className="pdf-table__jg mono">{lane.swimmer.jahrgang ?? "–"}</td>
                  <td className="pdf-table__club">{lane.club}</td>
                  <td className="pdf-table__time mono" title={lane.status ? statusLabel(lane.status) : undefined}>
                    {showResults ? (
                      <span className={lane.status ? "status-pill" : "pdf-table__result"}>{result}</span>
                    ) : (
                      <span className={lane.status ? "status-pill" : undefined}>
                        {lane.status ? statusCode(lane.status) : entry}
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </button>
  );
}
