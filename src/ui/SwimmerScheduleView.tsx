import { swimmerSchedule, type Meet, type MeetClock } from "../meet";
import { SwimCard } from "./SwimCard";

interface Props {
  meet: Meet;
  swimmerId: string;
  clock: MeetClock;
  onOpenClub: (clubName: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
}

export function SwimmerScheduleView({ meet, swimmerId, clock, onOpenClub, onOpenSwim }: Props) {
  const schedule = swimmerSchedule(meet, swimmerId, clock);
  if (!schedule) return <p className="error">Schwimmer nicht gefunden.</p>;

  const { swimmer, swims } = schedule;
  return (
    <section className="stack">
      <header>
        <h1>
          {swimmer.firstName} {swimmer.lastName}
        </h1>
        <p className="muted">
          {swimmer.jahrgang ?? "Jahrgang unbekannt"} ·{" "}
          <button type="button" className="link" onClick={() => onOpenClub(swimmer.club)}>
            {swimmer.club}
          </button>
        </p>
      </header>
      {swims.length === 0 ? (
        <p className="muted">Keine Einzelstarts bei diesem Wettkampf.</p>
      ) : (
        <ol className="swims">
          {swims.map((swim) => (
            <SwimCard key={swim.eventId} swim={swim} onOpenDetail={() => onOpenSwim(swimmer.id, swim.eventId)} />
          ))}
        </ol>
      )}
    </section>
  );
}
