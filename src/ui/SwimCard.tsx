import type { ScheduledSwim, Swimmer } from "../meet";
import { formatDay, formatSwimTime, roundLabel, statusLabel } from "./format";

interface Props {
  swim: ScheduledSwim;
  /** Shown on lists with several swimmers, e.g. a club page. */
  swimmer?: Swimmer;
  /** For swimmers starting for several clubs: shows which club this swim is for. */
  showClub?: boolean;
  onOpenSwimmer?: (swimmerId: string) => void;
  /** Opens the detail of a completed swim. */
  onOpenDetail?: () => void;
}

export function SwimCard({ swim, swimmer, showClub, onOpenSwimmer, onOpenDetail }: Props) {
  const completed = swim.phase === "done" && (swim.status !== null || swim.swimTime !== null);
  return (
    <li className={`swim swim--${swim.phase}`}>
      {swim.phase === "next" && !swimmer && <span className="swim__badge">Nächster Start</span>}
      {swimmer && (
        <button type="button" className="link swim__swimmer" onClick={() => onOpenSwimmer?.(swimmer.id)}>
          {swimmer.firstName} {swimmer.lastName}
          {swimmer.jahrgang && <span className="muted"> · {swimmer.jahrgang}</span>}
        </button>
      )}
      <div className="swim__title">
        Wk {swim.eventNumber} · {swim.eventName}
      </div>
      <div className="muted">
        Abschnitt {swim.session} · {roundLabel(swim.round)}
        {showClub && ` · für ${swim.club}`}
      </div>
      <dl className="swim__facts">
        <div>
          <dt>Zeitplan</dt>
          <dd>
            {formatDay(swim.date)}
            {swim.time && `, ${swim.timeApproximate ? "ca. " : ""}${swim.time} Uhr`}
          </dd>
        </div>
        <div>
          <dt>Lauf</dt>
          <dd>{swim.heat ? `${swim.heat} von ${swim.heatCount}` : "–"}</dd>
        </div>
        <div>
          <dt>Bahn</dt>
          <dd>{swim.lane ?? "nicht zugeteilt"}</dd>
        </div>
        {swim.entryTime !== null && (
          <div>
            <dt>Meldezeit</dt>
            <dd>{formatSwimTime(swim.entryTime)}</dd>
          </div>
        )}
        {completed && (
          <div>
            <dt>Ergebnis</dt>
            <dd className={swim.status ? "swim__status" : undefined}>
              {swim.status ? statusLabel(swim.status) : formatSwimTime(swim.swimTime!)}
            </dd>
          </div>
        )}
      </dl>
      {swim.phase !== "done" && swim.status && <div className="swim__status">{statusLabel(swim.status)}</div>}
      {completed && onOpenDetail && (
        <button type="button" className="link swim__more" onClick={onOpenDetail}>
          Details →
        </button>
      )}
    </li>
  );
}
