import { useState } from "react";
import type { Meet } from "../meet";
import { ClubScheduleView } from "./ClubScheduleView";
import { HomeView } from "./HomeView";
import { MeetSearch } from "./MeetSearch";
import { MeetSummaryView } from "./MeetSummaryView";
import { SwimDetailView } from "./SwimDetailView";
import { SwimmerScheduleView } from "./SwimmerScheduleView";
import { useMeetClock } from "./useMeetClock";

type View =
  | { kind: "swimmer"; swimmerId: string }
  | { kind: "club"; clubName: string }
  | { kind: "swim"; swimmerId: string; eventId: string };

interface Props {
  meet: Meet;
  onRemove: () => void;
}

export function MeetScreen({ meet, onRemove }: Props) {
  const clock = useMeetClock();
  // Pages opened from the search, most recent last; "Zurück" goes one step back.
  const [history, setHistory] = useState<View[]>([]);
  const view = history.at(-1);

  const go = (next: View) => setHistory((views) => [...views, next]);
  const openSwimmer = (swimmerId: string) => go({ kind: "swimmer", swimmerId });
  const openClub = (clubName: string) => go({ kind: "club", clubName });
  const openSwim = (swimmerId: string, eventId: string) => go({ kind: "swim", swimmerId, eventId });

  if (!view) {
    return (
      <div className="stack">
        <p className="meet-name">{meet.summary.name}</p>
        <HomeView
          meet={meet}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onOpenSwim={openSwim}
          search={<MeetSearch meet={meet} onOpenSwimmer={openSwimmer} onOpenClub={openClub} />}
        />
        <MeetSummaryView summary={meet.summary} onRemove={onRemove} />
      </div>
    );
  }

  return (
    <div className="stack">
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
        <SwimDetailView meet={meet} swimmerId={view.swimmerId} eventId={view.eventId} onOpenSwimmer={openSwimmer} />
      )}
    </div>
  );
}
