import { useState } from "react";
import type { Meet, MeetClock, SwimRef } from "../meet";
import { ClubScheduleView } from "./ClubScheduleView";
import { ComparisonView } from "./ComparisonView";
import { HomeView } from "./HomeView";
import { MeetSearch } from "./MeetSearch";
import { MeetSummaryView } from "./MeetSummaryView";
import { PickComparisonView } from "./PickComparisonView";
import { ReplayBanner, replayStart } from "./Replay";
import { SwimDetailView } from "./SwimDetailView";
import { SwimmerScheduleView } from "./SwimmerScheduleView";
import { useMeetClock } from "./useMeetClock";

type View =
  | { kind: "swimmer"; swimmerId: string }
  | { kind: "club"; clubName: string }
  | { kind: "swim"; swimmerId: string; eventId: string }
  | { kind: "pick-comparison"; first: SwimRef }
  | { kind: "comparison"; first: SwimRef; second: SwimRef };

interface Props {
  meet: Meet;
  onRemove: () => void;
}

export function MeetScreen({ meet, onRemove }: Props) {
  const realTime = useMeetClock();
  // A replay sets the meet clock to a past moment; it is deliberately not stored, so every visit starts in real time.
  const [replay, setReplay] = useState<MeetClock | null>(null);
  const clock = replay ?? realTime;
  // Pages opened from the search, most recent last; "Zurück" goes one step back.
  const [history, setHistory] = useState<View[]>([]);
  const view = history.at(-1);

  const go = (next: View) => setHistory((views) => [...views, next]);
  const openSwimmer = (swimmerId: string) => go({ kind: "swimmer", swimmerId });
  const openClub = (clubName: string) => go({ kind: "club", clubName });
  const openSwim = (swimmerId: string, eventId: string) => go({ kind: "swim", swimmerId, eventId });

  const banner = replay && (
    <ReplayBanner meet={meet} replay={replay} onChange={setReplay} onEnd={() => setReplay(null)} />
  );

  if (!view) {
    return (
      <div className="stack">
        {banner}
        <p className="meet-name">{meet.summary.name}</p>
        <HomeView
          meet={meet}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onOpenSwim={openSwim}
          search={<MeetSearch meet={meet} onOpenSwimmer={openSwimmer} onOpenClub={openClub} />}
        />
        {!replay && (
          <div className="actions">
            <button type="button" onClick={() => setReplay(replayStart(meet))}>
              Wettkampf als Wiederholung ansehen
            </button>
          </div>
        )}
        <MeetSummaryView summary={meet.summary} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div className="stack">
      {banner}
      <button type="button" className="back" onClick={() => setHistory((views) => views.slice(0, -1))}>
        ← Zurück
      </button>
      {view.kind === "swimmer" && (
        <SwimmerScheduleView
          meet={meet}
          swimmerId={view.swimmerId}
          clock={clock}
          onOpenClub={openClub}
          onOpenSwim={openSwim}
        />
      )}
      {view.kind === "club" && (
        <ClubScheduleView
          meet={meet}
          clubName={view.clubName}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onOpenSwim={openSwim}
        />
      )}
      {view.kind === "swim" && (
        <SwimDetailView
          meet={meet}
          swimmerId={view.swimmerId}
          eventId={view.eventId}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onCompare={() => go({ kind: "pick-comparison", first: { swimmerId: view.swimmerId, eventId: view.eventId } })}
        />
      )}
      {view.kind === "pick-comparison" && (
        <PickComparisonView
          meet={meet}
          clock={clock}
          first={view.first}
          onPick={(second) => go({ kind: "comparison", first: view.first, second })}
        />
      )}
      {view.kind === "comparison" && (
        <ComparisonView meet={meet} first={view.first} second={view.second} clock={clock} />
      )}
    </div>
  );
}
