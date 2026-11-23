import { swimDetail, type Meet } from "../meet";
import { formatDifference, formatEntryRank, formatReactionTime, formatSwimTime, roundLabel, statusLabel } from "./format";

interface Props {
  meet: Meet;
  swimmerId: string;
  eventId: string;
  onOpenSwimmer: (swimmerId: string) => void;
  onCompare: () => void;
}

export function SwimDetailView({ meet, swimmerId, eventId, onOpenSwimmer, onCompare }: Props) {
  const detail = swimDetail(meet, swimmerId, eventId);
  if (!detail) return <p className="error">Start nicht gefunden.</p>;

  return (
    <section className="stack">
      <header>
        <button type="button" className="link swim__swimmer" onClick={() => onOpenSwimmer(detail.swimmer.id)}>
          {detail.swimmer.firstName} {detail.swimmer.lastName}
        </button>
        <h1>
          Wk {detail.eventNumber} · {detail.eventName}
        </h1>
        <p className="muted">{roundLabel(detail.round)}</p>
      </header>

      <div className="result">
        {detail.status ? (
          <span className="result__time swim__status">{statusLabel(detail.status)}</span>
        ) : (
          detail.swimTime !== null && <span className="result__time">{formatSwimTime(detail.swimTime)}</span>
        )}
        <span className="result__official">offiziell</span>
      </div>

      {detail.places.length > 0 && (
        <p className="places">
          {detail.places.map((place) => `${place.place}. ${place.group}`).join(" · ")}
        </p>
      )}

      <dl className="swim__facts">
        {detail.entryTime !== null && (
          <div>
            <dt>Meldezeit</dt>
            <dd>{formatSwimTime(detail.entryTime)}</dd>
          </div>
        )}
        {detail.differenceFromEntryTime !== null && (
          <div>
            <dt>Differenz zur Meldezeit</dt>
            <dd className={detail.differenceFromEntryTime < 0 ? "faster" : "slower"}>
              {formatDifference(detail.differenceFromEntryTime)}
            </dd>
          </div>
        )}
        {detail.prelimTime !== null && (
          <div>
            <dt>Vorlaufzeit</dt>
            <dd>{formatSwimTime(detail.prelimTime)}</dd>
          </div>
        )}
        {detail.differenceFromPrelim !== null && (
          <div>
            <dt>Differenz zum Vorlauf</dt>
            <dd className={detail.differenceFromPrelim < 0 ? "faster" : "slower"}>
              {formatDifference(detail.differenceFromPrelim)}
            </dd>
          </div>
        )}
        {detail.entryRank && (
          <div>
            <dt>Rang nach Meldezeit</dt>
            <dd>{formatEntryRank(detail.entryRank)}</dd>
          </div>
        )}
        {detail.reactionTime !== null && (
          <div>
            <dt>Reaktionszeit</dt>
            <dd>{formatReactionTime(detail.reactionTime)}</dd>
          </div>
        )}
      </dl>

      {detail.swimTime !== null && (
        <div className="actions">
          <button type="button" onClick={onCompare}>
            Mit anderem Start vergleichen
          </button>
        </div>
      )}

      {detail.splits.length > 0 && (
        <table className="splits">
          <thead>
            <tr>
              <th scope="col">Strecke</th>
              <th scope="col">Zwischenzeit</th>
              <th scope="col">Abschnitt</th>
            </tr>
          </thead>
          <tbody>
            {detail.splits.map((split) => (
              <tr key={split.to}>
                <th scope="row">
                  {split.from}–{split.to} m
                </th>
                <td>{formatSwimTime(split.cumulative)}</td>
                <td>{formatSwimTime(split.segment)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
