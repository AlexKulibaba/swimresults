import type { ReactNode } from "react";
import { homePage, type Meet, type MeetClock } from "../meet";
import { useFollows } from "./follows";
import { SwimCard } from "./SwimCard";

const maxLatest = 20;

interface Props {
  meet: Meet;
  clock: MeetClock;
  onOpenSwimmer: (swimmerId: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
  /** The search, placed after my own swims and before the follows. */
  search: ReactNode;
}

export function HomeView({ meet, clock, onOpenSwimmer, onOpenSwim, search }: Props) {
  const { follows } = useFollows();
  const home = homePage(meet, follows, clock);
  const followsNobody = follows.me === null && follows.swimmers.length === 0 && follows.clubs.length === 0;

  return (
    <div className="stack">
      {home.me && (
        <section className="stack">
          <h2>
            Meine Starts ·{" "}
            <button type="button" className="link" onClick={() => onOpenSwimmer(home.me!.swimmer.id)}>
              {home.me.swimmer.firstName} {home.me.swimmer.lastName}
            </button>
          </h2>
          {home.me.swims.length === 0 ? (
            <p className="muted">Keine Einzelstarts bei diesem Wettkampf.</p>
          ) : (
            <ol className="swims">
              {home.me.swims.map((swim) => (
                <SwimCard
                  key={swim.eventId}
                  swim={swim}
                  showClub={home.me!.swimmer.clubs.length > 1}
                  onOpenDetail={() => onOpenSwim(swim.swimmer.id, swim.eventId)}
                />
              ))}
            </ol>
          )}
        </section>
      )}

      {search}

      {home.followed ? (
        <section className="stack">
          <h2>{home.followed.mode === "next" ? "Nächste Starts" : "Letzte Starts"}</h2>
          <ol className="swims">
            {(home.followed.mode === "latest" ? home.followed.swims.slice(0, maxLatest) : home.followed.swims).map(
              (swim) => (
                <SwimCard
                  key={`${swim.swimmer.id}-${swim.eventId}`}
                  swim={swim}
                  swimmer={swim.swimmer}
                  onOpenSwimmer={onOpenSwimmer}
                  onOpenDetail={() => onOpenSwim(swim.swimmer.id, swim.eventId)}
                />
              ),
            )}
          </ol>
        </section>
      ) : (
        !home.me && (
          <p className="hint">
            {followsNobody
              ? "Du folgst noch niemandem. Suche oben nach Schwimmern oder Vereinen und folge ihnen – dann erscheinen ihre Starts hier."
              : "Niemand, dem du folgst, startet bei diesem Wettkampf. Suche oben nach Schwimmern oder Vereinen."}
          </p>
        )
      )}
    </div>
  );
}
