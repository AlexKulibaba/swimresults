import { useState } from "react";
import type { Meet, MeetClock } from "../meet";
import { ClubScheduleView } from "./ClubScheduleView";
import { ComparisonView } from "./ComparisonView";
import { EventsView } from "./EventsView";
import { HeatDetailView } from "./HeatDetailView";
import { HeatsView } from "./HeatsView";
import { HomeView } from "./HomeView";
import { MeetSearch } from "./MeetSearch";
import { MeetSummaryView } from "./MeetSummaryView";
import { PickComparisonView } from "./PickComparisonView";
import { ReplayBanner, replayStart } from "./Replay";
import { useRouter } from "./router";
import { SwimDetailView } from "./SwimDetailView";
import { SwimmerScheduleView } from "./SwimmerScheduleView";
import { useMeetClock } from "./useMeetClock";

interface Props {
  meet: Meet;
  onRemove: () => void;
}

export function MeetScreen({ meet, onRemove }: Props) {
  const realTime = useMeetClock();
  // A replay sets the meet clock to a past moment; it is deliberately not stored, so every visit starts in real time.
  const [replay, setReplay] = useState<MeetClock | null>(null);
  const clock = replay ?? realTime;
  const { route, navigate, back } = useRouter();

  const openEvents = () => navigate({ kind: "events" });
  const openEvent = (eventId: string) => navigate({ kind: "heats", eventId });
  const openHeat = (eventId: string, heatId: string) => navigate({ kind: "heat", eventId, heatId });
  const openSwimmer = (swimmerId: string) => navigate({ kind: "swimmer", swimmerId });
  const openClub = (clubName: string) => navigate({ kind: "club", clubName });
  const openSwim = (swimmerId: string, eventId: string) => navigate({ kind: "swim", swimmerId, eventId });

  const banner = replay && (
    <ReplayBanner meet={meet} replay={replay} onChange={setReplay} onEnd={() => setReplay(null)} />
  );

  if (route.kind === "home") {
    return (
      <div className="stack">
        {banner}
        <button type="button" className="meet-header" onClick={openEvents}>
          <span className="meet-header__name">{meet.summary.name}</span>
          <span className="meet-header__meta">
            <span>{meet.summary.city}</span>
            <span className="meet-header__cta">Wettkämpfe ({meet.events.length}) →</span>
          </span>
        </button>
        <HomeView
          meet={meet}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onOpenSwim={openSwim}
          onOpenHeat={openHeat}
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
      <div className="nav-bar">
        <button type="button" className="back" onClick={back}>
          ← Zurück
        </button>
        <button type="button" className="back" onClick={() => navigate({ kind: "home" })}>
          Startseite
        </button>
      </div>
      {route.kind === "events" && (
        <EventsView meet={meet} clock={clock} onOpenEvent={openEvent} onOpenHeat={openHeat} />
      )}
      {route.kind === "heats" && (
        <HeatsView meet={meet} eventId={route.eventId} clock={clock} onOpenHeat={openHeat} />
      )}
      {route.kind === "heat" && (
        <HeatDetailView
          meet={meet}
          eventId={route.eventId}
          heatId={route.heatId}
          clock={clock}
          onOpenEvent={openEvent}
          onOpenHeat={openHeat}
          onOpenSwim={openSwim}
        />
      )}
      {route.kind === "swimmer" && (
        <SwimmerScheduleView
          meet={meet}
          swimmerId={route.swimmerId}
          clock={clock}
          onOpenClub={openClub}
          onOpenSwim={openSwim}
        />
      )}
      {route.kind === "club" && (
        <ClubScheduleView
          meet={meet}
          clubName={route.clubName}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onOpenSwim={openSwim}
        />
      )}
      {route.kind === "swim" && (
        <SwimDetailView
          meet={meet}
          swimmerId={route.swimmerId}
          eventId={route.eventId}
          clock={clock}
          onOpenSwimmer={openSwimmer}
          onCompare={() =>
            navigate({ kind: "pick-comparison", first: { swimmerId: route.swimmerId, eventId: route.eventId } })
          }
        />
      )}
      {route.kind === "pick-comparison" && (
        <PickComparisonView
          meet={meet}
          clock={clock}
          first={route.first}
          onPick={(second) => navigate({ kind: "comparison", first: route.first, second })}
        />
      )}
      {route.kind === "comparison" && (
        <ComparisonView meet={meet} first={route.first} second={route.second} clock={clock} />
      )}
    </div>
  );
}
