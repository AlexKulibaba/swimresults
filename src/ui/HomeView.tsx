import { useState, type ReactNode } from "react";
import { homePage, swimmerKey, type Meet, type MeetClock, type SwimmerSwim } from "../meet";
import { useFollows } from "./follows";
import { formatDay } from "./format";
import { MyStartsCard } from "./MyStartsCard";
import { groupSwimsByDay, ResultCardRow } from "./ResultCardRow";
import { SwimAccordionRow } from "./SwimAccordionRow";

const initialFollowedCount = 5;

interface Props {
  meet: Meet;
  clock: MeetClock;
  onOpenSwimmer: (swimmerId: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
  onOpenHeat: (eventId: string, heatId: string) => void;
  search: ReactNode;
}

function rowKey(section: "me" | "recent" | "upcoming", swim: SwimmerSwim): string {
  return `${section}:${swim.swimmer.id}:${swim.eventId}:${swim.ifQualified ? "q" : "e"}`;
}

export function HomeView({ meet, clock, onOpenSwimmer, onOpenSwim, onOpenHeat, search }: Props) {
  const { follows } = useFollows();
  const home = homePage(meet, follows, clock);
  const followsNobody = follows.me === null && follows.swimmers.length === 0 && follows.clubs.length === 0;

  // Default to expanding my next upcoming swim if present.
  const defaultExpanded = home.me?.swims.find((swim) => swim.phase === "next");
  const [expandedKey, setExpandedKey] = useState<string | null>(
    defaultExpanded ? rowKey("me", defaultExpanded) : null,
  );
  const [showAllRecent, setShowAllRecent] = useState(false);
  const [showAllUpcoming, setShowAllUpcoming] = useState(false);

  const toggle = (key: string) => setExpandedKey((current) => (current === key ? null : key));

  const recentSwims = home.followed?.recent ?? [];
  const upcomingSwims = home.followed?.upcoming ?? [];

  return (
    <div className="stack">
      {search}

      {home.me && (
        <MyStartsCard
          swimmer={home.me.swimmer}
          swims={home.me.swims}
          clock={clock}
          expandedKey={expandedKey}
          onToggle={toggle}
          rowKeyFor={(swim) => `me:${home.me!.swimmer.id}:${swim.eventId}:${swim.ifQualified ? "q" : "e"}`}
          onOpenSwimmer={onOpenSwimmer}
          onOpenHeat={onOpenHeat}
          onOpenSwim={onOpenSwim}
        />
      )}

      {recentSwims.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Letzte Ergebnisse</h2>
            <span className="section__count num">{recentSwims.length}</span>
          </div>
          <div className="day-blocks">
            {groupSwimsByDay(showAllRecent ? recentSwims : recentSwims.slice(0, initialFollowedCount)).map((day) => (
              <div key={day.date} className="day-block">
                <div className="day-block__head num">{formatDay(day.date)}</div>
                <ol className="rrow-list">
                  {day.swims.map((swim) => {
                    const key = rowKey("recent", swim);
                    return (
                      <ResultCardRow
                        key={key}
                        swim={swim}
                        swimmer={swim.swimmer}
                        expanded={expandedKey === key}
                        onToggle={() => toggle(key)}
                        showEntryRank={follows.swimmers.includes(swimmerKey(swim.swimmer))}
                        onOpenHeat={onOpenHeat}
                        onOpenSwimmer={onOpenSwimmer}
                        onOpenDetail={() => onOpenSwim(swim.swimmer.id, swim.eventId)}
                      />
                    );
                  })}
                </ol>
              </div>
            ))}
          </div>
          {recentSwims.length > initialFollowedCount && (
            <button type="button" className="section__more" onClick={() => setShowAllRecent((value) => !value)}>
              {showAllRecent ? "Weniger anzeigen" : `Alle ${recentSwims.length} Ergebnisse anzeigen`}
            </button>
          )}
        </section>
      )}

      {upcomingSwims.length > 0 && (
        <section className="section">
          <div className="section__head">
            <h2>Nächste Starts</h2>
            <span className="section__count num">{upcomingSwims.length}</span>
          </div>
          <div className="day-blocks">
            {groupSwimsByDay(showAllUpcoming ? upcomingSwims : upcomingSwims.slice(0, initialFollowedCount)).map(
              (day) => (
                <div key={day.date} className="day-block">
                  <div className="day-block__head num">{formatDay(day.date)}</div>
                  <ol className="swim-list swim-list--in-day">
                    {day.swims.map((swim) => {
                      const key = rowKey("upcoming", swim);
                      return (
                        <SwimAccordionRow
                          key={key}
                          swim={swim}
                          swimmer={swim.swimmer}
                          expanded={expandedKey === key}
                          onToggle={() => toggle(key)}
                          showEntryRank={follows.swimmers.includes(swimmerKey(swim.swimmer))}
                          onOpenHeat={onOpenHeat}
                          onOpenSwimmer={onOpenSwimmer}
                          onOpenDetail={() => onOpenSwim(swim.swimmer.id, swim.eventId)}
                        />
                      );
                    })}
                  </ol>
                </div>
              ),
            )}
          </div>
          {upcomingSwims.length > initialFollowedCount && (
            <button type="button" className="section__more" onClick={() => setShowAllUpcoming((value) => !value)}>
              {showAllUpcoming ? "Weniger anzeigen" : `Alle ${upcomingSwims.length} Starts anzeigen`}
            </button>
          )}
        </section>
      )}

      {!home.me && !home.followed && (
        <p className="hint">
          {followsNobody
            ? "Du folgst noch niemandem. Suche oben nach Schwimmern oder Vereinen und folge ihnen – dann erscheinen ihre Starts hier."
            : "Niemand, dem du folgst, startet bei diesem Wettkampf. Suche oben nach Schwimmern oder Vereinen."}
        </p>
      )}
    </div>
  );
}
