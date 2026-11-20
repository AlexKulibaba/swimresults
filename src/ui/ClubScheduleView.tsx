import { clubSchedule, swimmerKey, type Meet, type MeetClock, type SwimmerSwim } from "../meet";
import { useFollows } from "./follows";
import { ClubFollowButton } from "./FollowButtons";
import { SwimCard } from "./SwimCard";

interface Props {
  meet: Meet;
  clubName: string;
  clock: MeetClock;
  onOpenSwimmer: (swimmerId: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
}

export function ClubScheduleView({ meet, clubName, clock, onOpenSwimmer, onOpenSwim }: Props) {
  const schedule = clubSchedule(meet, clubName, clock);
  if (!schedule) return <p className="error">Verein nicht gefunden.</p>;

  const { club, upcoming, completed } = schedule;
  return (
    <section className="stack">
      <header>
        <h1>{club.name}</h1>
        <p className="muted">{club.swimmerCount === 1 ? "1 Schwimmer" : `${club.swimmerCount} Schwimmer`}</p>
      </header>
      <ClubFollowButton clubName={club.name} />
      <ClubSwims title="Nächste Starts" empty="Keine weiteren Starts." swims={upcoming} {...{ onOpenSwimmer, onOpenSwim }} />
      <ClubSwims title="Beendet" empty="Noch keine Starts beendet." swims={completed} {...{ onOpenSwimmer, onOpenSwim }} />
    </section>
  );
}

function ClubSwims({
  title,
  empty,
  swims,
  onOpenSwimmer,
  onOpenSwim,
}: {
  title: string;
  empty: string;
  swims: SwimmerSwim[];
  onOpenSwimmer: (swimmerId: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
}) {
  const { follows } = useFollows();
  const isMeOrFollowed = (key: string) => follows.me === key || follows.swimmers.includes(key);

  return (
    <section className="stack">
      <h2>{title}</h2>
      {swims.length === 0 ? (
        <p className="muted">{empty}</p>
      ) : (
        <ol className="swims">
          {swims.map((swim) => (
            <SwimCard
              key={`${swim.swimmer.id}-${swim.eventId}`}
              swim={swim}
              swimmer={swim.swimmer}
              showEntryRank={isMeOrFollowed(swimmerKey(swim.swimmer))}
              onOpenSwimmer={onOpenSwimmer}
              onOpenDetail={() => onOpenSwim(swim.swimmer.id, swim.eventId)}
            />
          ))}
        </ol>
      )}
    </section>
  );
}
