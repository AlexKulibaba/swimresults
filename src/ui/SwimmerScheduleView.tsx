import { swimmerSchedule, type Meet, type MeetClock, type ScheduledSwim } from "../meet";
import { formatDay, formatSwimTime, roundLabel, statusLabel } from "./format";

interface Props {
  meet: Meet;
  swimmerId: string;
  clock: MeetClock;
  onBack: () => void;
}

export function SwimmerScheduleView({ meet, swimmerId, clock, onBack }: Props) {
  const schedule = swimmerSchedule(meet, swimmerId, clock);

  return (
    <section className="stack">
      <button type="button" className="back" onClick={onBack}>
        ← Zurück
      </button>
      {schedule ? (
        <>
          <header>
            <h1>
              {schedule.swimmer.firstName} {schedule.swimmer.lastName}
            </h1>
            <p className="muted">
              {schedule.swimmer.jahrgang ?? "Jahrgang unbekannt"} · {schedule.swimmer.club}
            </p>
          </header>
          {schedule.swims.length === 0 ? (
            <p className="muted">Keine Einzelstarts bei diesem Wettkampf.</p>
          ) : (
            <ol className="swims">
              {schedule.swims.map((swim) => (
                <SwimCard key={`${swim.session}-${swim.eventNumber}`} swim={swim} />
              ))}
            </ol>
          )}
        </>
      ) : (
        <p className="error">Schwimmer nicht gefunden.</p>
      )}
    </section>
  );
}

function SwimCard({ swim }: { swim: ScheduledSwim }) {
  return (
    <li className={`swim swim--${swim.phase}`}>
      {swim.phase === "next" && <span className="swim__badge">Nächster Start</span>}
      <div className="swim__title">
        Wk {swim.eventNumber} · {swim.eventName}
      </div>
      <div className="muted">
        Abschnitt {swim.session} · {roundLabel(swim.round)}
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
        {swim.phase === "done" && (swim.status || swim.swimTime) && (
          <div>
            <dt>Ergebnis</dt>
            <dd className={swim.status ? "swim__status" : undefined}>
              {swim.status ? statusLabel(swim.status) : formatSwimTime(swim.swimTime!)}
            </dd>
          </div>
        )}
      </dl>
      {swim.phase !== "done" && swim.status && <div className="swim__status">{statusLabel(swim.status)}</div>}
    </li>
  );
}
