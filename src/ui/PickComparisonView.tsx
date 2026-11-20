import { useState } from "react";
import { comparableSwims, type ComparedSwim, type Meet, type MeetClock, type SwimRef } from "../meet";
import { formatSwimTime, roundLabel } from "./format";

interface Props {
  meet: Meet;
  clock: MeetClock;
  first: SwimRef;
  onPick: (second: SwimRef) => void;
}

/** Choosing the second swim: same event first, then other heats and rounds over the same stroke and distance. */
export function PickComparisonView({ meet, clock, first, onPick }: Props) {
  const [query, setQuery] = useState("");
  const swims = comparableSwims(meet, first, clock, query);
  const sameEvent = swims.filter((swim) => swim.eventId === first.eventId);
  const otherRounds = swims.filter((swim) => swim.eventId !== first.eventId);

  return (
    <section className="stack">
      <h1>Vergleichen mit …</h1>
      <label className="search">
        <span className="visually-hidden">Schwimmer suchen</span>
        <input
          type="search"
          placeholder="Schwimmer suchen …"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {swims.length === 0 && <p className="muted">Keine abgeschlossenen Starts über diese Strecke gefunden.</p>}
      <SwimChoices title="Gleicher Wettkampf" swims={sameEvent} onPick={onPick} />
      <SwimChoices title="Andere Läufe und Runden" swims={otherRounds} onPick={onPick} />
    </section>
  );
}

function SwimChoices({ title, swims, onPick }: { title: string; swims: ComparedSwim[]; onPick: (ref: SwimRef) => void }) {
  if (swims.length === 0) return null;
  return (
    <section>
      <h2>{title}</h2>
      <ul className="list">
        {swims.map((swim) => (
          <li key={`${swim.swimmer.id}-${swim.eventId}`}>
            <button
              type="button"
              className="list__item"
              onClick={() => onPick({ swimmerId: swim.swimmer.id, eventId: swim.eventId })}
            >
              <span className="list__title">
                {swim.swimmer.firstName} {swim.swimmer.lastName} · {formatSwimTime(swim.swimTime)}
              </span>
              <span className="muted">
                Wk {swim.eventNumber} · {roundLabel(swim.round)}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
