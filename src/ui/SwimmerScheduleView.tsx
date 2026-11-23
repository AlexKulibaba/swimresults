import { swimmerSchedule, type Meet, type MeetClock } from "../meet";
import { SwimmerFollowButtons } from "./FollowButtons";
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
          {swimmer.clubs.map((club, index) => (
            <span key={club}>
              {index > 0 && ", "}
              <button type="button" className="link" onClick={() => onOpenClub(club)}>
                {club}
              </button>
            </span>
          ))}
        </p>
      </header>
      <SwimmerFollowButtons swimmer={swimmer} />
      {swims.length === 0 ? (
        <p className="muted">Keine Einzelstarts bei diesem Wettkampf.</p>
      ) : (
        <ol className="swims">
          {swims.map((swim) => (
            <SwimCard
              key={swim.eventId}
              swim={swim}
              showClub={swimmer.clubs.length > 1}
              showEntryRank
              onOpenDetail={() => onOpenSwim(swimmer.id, swim.eventId)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
