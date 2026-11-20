import { clubSchedule, type ClubSwim, type Meet, type MeetClock } from "../meet";
import { SwimCard } from "./SwimCard";

interface Props {
  meet: Meet;
  clubName: string;
  clock: MeetClock;
  onOpenSwimmer: (swimmerId: string) => void;
}

export function ClubScheduleView({ meet, clubName, clock, onOpenSwimmer }: Props) {
  const schedule = clubSchedule(meet, clubName, clock);
  if (!schedule) return <p className="error">Verein nicht gefunden.</p>;

  const { club, upcoming, completed } = schedule;
  return (
    <section className="stack">
      <header>
        <h1>{club.name}</h1>
        <p className="muted">{club.swimmerCount === 1 ? "1 Schwimmer" : `${club.swimmerCount} Schwimmer`}</p>
      </header>
      <ClubSwims title="Nächste Starts" empty="Keine weiteren Starts." swims={upcoming} onOpenSwimmer={onOpenSwimmer} />
      <ClubSwims title="Beendet" empty="Noch keine Starts beendet." swims={completed} onOpenSwimmer={onOpenSwimmer} />
    </section>
  );
}

function ClubSwims({
  title,
  empty,
  swims,
  onOpenSwimmer,
}: {
  title: string;
  empty: string;
  swims: ClubSwim[];
  onOpenSwimmer: (swimmerId: string) => void;
}) {
  return (
    <section className="stack">
      <h2>{title}</h2>
      {swims.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ol className="swims">
          {swims.map((swim) => (
            <SwimCard
              key={`${swim.swimmer.id}-${swim.session}-${swim.eventNumber}`}
              swim={swim}
              swimmer={swim.swimmer}
              onOpenSwimmer={onOpenSwimmer}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
