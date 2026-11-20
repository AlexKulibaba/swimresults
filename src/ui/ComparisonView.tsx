import { compareSwims, type ComparedSwim, type Meet, type MeetClock, type SwimRef } from "../meet";
import { formatDifference, formatSwimTime, roundLabel } from "./format";

interface Props {
  meet: Meet;
  first: SwimRef;
  second: SwimRef;
  clock: MeetClock;
}

const refusals = {
  "different-stroke-or-distance": "Nur Starts über dieselbe Lage und Strecke lassen sich vergleichen.",
  "not-swum-yet": "Einer der Starts hat zur gewählten Zeit noch nicht stattgefunden.",
  "no-valid-time": "Nur Starts mit gültiger Zeit lassen sich vergleichen.",
};

export function ComparisonView({ meet, first, second, clock }: Props) {
  const comparison = compareSwims(meet, first, second, clock);
  if (!comparison.ok) return <p className="error">{refusals[comparison.reason]}</p>;

  return (
    <section className="stack">
      <h1>Vergleich</h1>
      <div className="compare">
        <SwimHeader label="1" swim={comparison.first} />
        <SwimHeader label="2" swim={comparison.second} />
      </div>
      <p className="places">
        Differenz: {formatDifference(comparison.difference)}{" "}
        <span className="muted">({comparison.difference > 0 ? "Start 2 langsamer" : comparison.difference < 0 ? "Start 2 schneller" : "gleich schnell"})</span>
      </p>

      <table className="splits">
        <thead>
          <tr>
            <th scope="col">Strecke</th>
            <th scope="col">Start 1</th>
            <th scope="col">Start 2</th>
            <th scope="col">Abstand</th>
          </tr>
        </thead>
        <tbody>
          {comparison.splits.map((split) => (
            <tr key={split.distance}>
              <th scope="row">{split.distance} m</th>
              <td>{formatSwimTime(split.first)}</td>
              <td>{formatSwimTime(split.second)}</td>
              <td className={split.gap < 0 ? "faster" : split.gap > 0 ? "slower" : undefined}>{formatDifference(split.gap)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted">
        Abstände nur an Zwischenzeiten, die bei beiden Starts gemessen wurden. Was dazwischen passiert ist, ist nicht bekannt.
      </p>
    </section>
  );
}

function SwimHeader({ label, swim }: { label: string; swim: ComparedSwim }) {
  return (
    <div className="compare__swim">
      <span className="muted">Start {label}</span>
      <span className="list__title">
        {swim.swimmer.firstName} {swim.swimmer.lastName}
      </span>
      <span className="muted">
        Wk {swim.eventNumber} · {swim.eventName} · {roundLabel(swim.round)}
      </span>
      <span className="result__time compare__time">{formatSwimTime(swim.swimTime)}</span>
    </div>
  );
}
