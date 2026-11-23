import type { Meet, MeetClock } from "../meet";
import { formatDay } from "./format";

/** Starting a replay: the first day of the meet at the first session's start. */
export function replayStart(meet: Meet): MeetClock {
  const first = [...meet.sessions].sort((a, b) => `${a.date}${a.daytime}`.localeCompare(`${b.date}${b.daytime}`))[0];
  return `${first?.date ?? meet.summary.firstDay}T${first?.daytime ?? "08:00"}`;
}

interface BannerProps {
  meet: Meet;
  replay: MeetClock;
  onChange: (replay: MeetClock) => void;
  onEnd: () => void;
}

/** Shown on every screen while a replay is active, so it is never taken for live coverage. */
export function ReplayBanner({ meet, replay, onChange, onEnd }: BannerProps) {
  const [date, time] = replay.split("T") as [string, string];
  const days = [...new Set(meet.sessions.map((session) => session.date))].sort();

  return (
    <section className="replay" aria-label="Wiederholung">
      <div className="replay__title">
        <strong>Wiederholung</strong> – zeigt nur, was zu dieser Zeit bekannt war. Keine Live-Daten.
      </div>
      <div className="replay__controls">
        <label>
          <span className="visually-hidden">Tag</span>
          <select value={date} onChange={(event) => onChange(`${event.target.value}T${time}`)}>
            {days.map((day) => (
              <option key={day} value={day}>
                {formatDay(day)}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span className="visually-hidden">Uhrzeit</span>
          <input
            type="time"
            value={time}
            onChange={(event) => event.target.value && onChange(`${date}T${event.target.value}`)}
          />
        </label>
        <button type="button" onClick={onEnd}>
          Zurück zur Echtzeit
        </button>
      </div>
    </section>
  );
}
