import { useMemo, useState } from "react";
import type { Meet, MeetClock, Place, ScheduledSwim } from "../meet";
import { EventsView } from "./EventsView";
import { formatDay } from "./format";
import { HeatDetailView } from "./HeatDetailView";
import { HeatsView } from "./HeatsView";
import { MyStartsCard } from "./MyStartsCard";
import { PlacementDisplay } from "./PlacementDisplay";
import { groupSwimsByDay, ResultCardRow } from "./ResultCardRow";
import { SwimAccordionRow } from "./SwimAccordionRow";

/** Self-contained fixture meet exercising every visual state (finished, running, scheduled, DNS/DSQ, many heats). */
const sampleMeet: Meet = {
  summary: {
    name: "Deutsche Kurzbahnmeisterschaften 2026",
    city: "Wuppertal",
    course: "SCM",
    firstDay: "2026-11-12",
    lastDay: "2026-11-15",
  },
  clubs: [
    { name: "SG Essen" },
    { name: "SV Bayer Wuppertal" },
    { name: "SG Neukölln e.V. Berlin" },
    { name: "SC Magdeburg" },
    { name: "Potsdamer SV" },
    { name: "SV Nikar Heidelberg" },
  ],
  swimmers: [
    { id: "s1", firstName: "Anna", lastName: "Berg", jahrgang: 2006, clubs: ["SG Essen"], license: "1001" },
    { id: "s2", firstName: "Mia", lastName: "Kohl", jahrgang: 2008, clubs: ["SV Bayer Wuppertal"], license: "1002" },
    { id: "s3", firstName: "Lena", lastName: "Wolf", jahrgang: 2005, clubs: ["SG Neukölln e.V. Berlin"], license: "1003" },
    { id: "s4", firstName: "Clara", lastName: "Richter", jahrgang: 2007, clubs: ["SC Magdeburg"], license: "1004" },
    { id: "s5", firstName: "Hannah", lastName: "Becker", jahrgang: 2009, clubs: ["Potsdamer SV"], license: "1005" },
    { id: "s6", firstName: "Lukas", lastName: "Weber", jahrgang: 2004, clubs: ["SV Nikar Heidelberg"], license: "1006" },
  ],
  sessions: [
    { number: 1, date: "2026-11-12", daytime: "09:30" },
    { number: 2, date: "2026-11-12", daytime: "16:30" },
  ],
  events: [
    {
      id: "e1",
      number: 1,
      order: 1,
      session: 1,
      name: "200m Schmetterling weiblich (Vorlauf)",
      round: "PRE",
      gender: "F",
      stroke: "FLY",
      distance: 200,
      daytime: "09:30",
      heats: [
        { id: "e1h1", number: 1, daytime: "09:30" },
        { id: "e1h2", number: 2, daytime: "09:34" },
      ],
    },
    {
      id: "e2",
      number: 2,
      order: 2,
      session: 1,
      name: "100m Brust weiblich (Vorlauf)",
      round: "PRE",
      gender: "F",
      stroke: "BREAST",
      distance: 100,
      daytime: "09:40",
      heats: [
        { id: "e2h1", number: 1, daytime: "09:40" },
        { id: "e2h2", number: 2, daytime: "09:43" },
        { id: "e2h3", number: 3, daytime: "09:46" },
      ],
    },
    {
      id: "e3",
      number: 3,
      order: 3,
      session: 1,
      name: "50m Freistil weiblich (Vorlauf)",
      round: "PRE",
      gender: "F",
      stroke: "FREE",
      distance: 50,
      daytime: "09:50",
      heats: Array.from({ length: 14 }, (_, i) => ({
        id: `e3h${i + 1}`,
        number: i + 1,
        daytime: `09:${String(50 + i).padStart(2, "0")}`,
      })),
    },
    {
      id: "e4",
      number: 4,
      order: 4,
      session: 1,
      name: "400m Lagen männlich (Zeitlauf)",
      round: "TIM",
      gender: "M",
      stroke: "MEDLEY",
      distance: 400,
      daytime: "10:20",
      heats: [
        { id: "e4h1", number: 1, daytime: "10:20" },
        { id: "e4h2", number: 2, daytime: "10:26" },
      ],
    },
    {
      id: "e101",
      number: 101,
      order: 1,
      session: 2,
      name: "200m Schmetterling weiblich (Finale)",
      round: "FIN",
      gender: "F",
      stroke: "FLY",
      distance: 200,
      daytime: "16:30",
      heats: [{ id: "e101h1", number: 1, daytime: "16:30" }],
    },
  ],
  swims: [
    // Event 2, Heat 1 (finished at 09:55)
    {
      swimmerId: "s1",
      eventId: "e2",
      club: "SG Essen",
      heatId: "e2h1",
      lane: 4,
      status: null,
      entryTime: 6653,
      swimTime: 6581,
      reactionTime: 64,
      splits: [
        { distance: 50, time: 3112 },
        { distance: 100, time: 6581 },
      ],
      places: [{ group: "Offene Wertung", place: 3 }],
    },
    {
      swimmerId: "s2",
      eventId: "e2",
      club: "SV Bayer Wuppertal",
      heatId: "e2h1",
      lane: 3,
      status: null,
      entryTime: 6720,
      swimTime: 6795,
      reactionTime: 71,
      splits: [],
      places: [],
    },
    {
      swimmerId: "s3",
      eventId: "e2",
      club: "SG Neukölln e.V. Berlin",
      heatId: "e2h1",
      lane: 5,
      status: "DNS",
      entryTime: 6690,
      swimTime: null,
      reactionTime: null,
      splits: [],
      places: [],
    },
    {
      swimmerId: "s4",
      eventId: "e2",
      club: "SC Magdeburg",
      heatId: "e2h1",
      lane: 2,
      status: "DSQ",
      entryTime: 6810,
      swimTime: null,
      reactionTime: 58,
      splits: [],
      places: [],
    },
    {
      swimmerId: "s5",
      eventId: "e2",
      club: "Potsdamer SV",
      heatId: "e2h1",
      lane: 6,
      status: null,
      entryTime: 6845,
      swimTime: 6802,
      reactionTime: 67,
      splits: [],
      places: [],
    },
    // Event 2, Heat 2 (running when clock = 09:43, finished at 09:55)
    {
      swimmerId: "s1",
      eventId: "e2",
      club: "SG Essen",
      heatId: "e2h2",
      lane: 4,
      status: null,
      entryTime: 6590,
      swimTime: 6540,
      reactionTime: 62,
      splits: [],
      places: [],
    },
    {
      swimmerId: "s3",
      eventId: "e2",
      club: "SG Neukölln e.V. Berlin",
      heatId: "e2h2",
      lane: 3,
      status: null,
      entryTime: 6615,
      swimTime: 6630,
      reactionTime: 69,
      splits: [],
      places: [],
    },
    {
      swimmerId: "s4",
      eventId: "e2",
      club: "SC Magdeburg",
      heatId: "e2h2",
      lane: 5,
      status: null,
      entryTime: 6640,
      swimTime: 6601,
      reactionTime: 65,
      splits: [],
      places: [],
    },
    // Event 2, Heat 3 (scheduled when clock = 09:43)
    {
      swimmerId: "s2",
      eventId: "e2",
      club: "SV Bayer Wuppertal",
      heatId: "e2h3",
      lane: 4,
      status: null,
      entryTime: 6510,
      swimTime: null,
      reactionTime: null,
      splits: [],
      places: [],
    },
    {
      swimmerId: "s5",
      eventId: "e2",
      club: "Potsdamer SV",
      heatId: "e2h3",
      lane: 3,
      status: "WDR",
      entryTime: 6540,
      swimTime: null,
      reactionTime: null,
      splits: [],
      places: [],
    },
  ],
};

const demoSwims: { key: string; swim: ScheduledSwim; swimmer?: Meet["swimmers"][number] }[] = [
  {
    key: "done",
    swim: {
      eventId: "e1",
      club: "SG Essen",
      session: 1,
      eventNumber: 1,
      eventName: "200m Schmetterling weiblich (Vorlauf)",
      round: "PRE",
      ifQualified: false,
      date: "2026-11-12",
      time: "09:34",
      timeApproximate: false,
      heatId: "e1h2",
      heat: 2,
      heatCount: 2,
      lane: 4,
      status: null,
      entryTime: 13450,
      entryRank: { jahrgang: { jahrgang: 2006, rank: 2, of: 14 }, overall: { rank: 6, of: 48 } },
      swimTime: 13312,
      places: [
        { group: "Jahrgang 2006", place: 1 },
        { group: "Offene Wertung", place: 3 },
      ],
      awardsMedals: false,
      phase: "done",
    },
  },
  {
    key: "next",
    swim: {
      eventId: "e2",
      club: "SG Essen",
      session: 1,
      eventNumber: 6,
      eventName: "100m Brust weiblich (Vorlauf)",
      round: "PRE",
      ifQualified: false,
      date: "2026-11-12",
      time: "12:24",
      timeApproximate: false,
      heatId: "e2h2",
      heat: 2,
      heatCount: 3,
      lane: 4,
      status: null,
      entryTime: 6653,
      entryRank: { jahrgang: { jahrgang: 2006, rank: 1, of: 11 }, overall: { rank: 4, of: 62 } },
      swimTime: null,
      places: [],
      awardsMedals: false,
      phase: "next",
    },
  },
  {
    key: "final-done",
    swim: {
      eventId: "e101",
      club: "SG Essen",
      session: 2,
      eventNumber: 139,
      eventName: "200m Schmetterling weiblich (A-Finale)",
      round: "FIN",
      ifQualified: false,
      date: "2026-11-12",
      time: "11:10",
      timeApproximate: false,
      heatId: "e101h1",
      heat: 1,
      heatCount: 1,
      lane: 4,
      status: null,
      entryTime: 13312,
      entryRank: null,
      swimTime: 13184,
      places: [{ group: "Offene Wertung", place: 1 }],
      awardsMedals: true,
      phase: "done",
    },
  },
  {
    key: "possible",
    swim: {
      eventId: "e101",
      club: "SG Essen",
      session: 2,
      eventNumber: 101,
      eventName: "100m Brust weiblich (Finale)",
      round: "FIN",
      ifQualified: true,
      date: "2026-11-13",
      time: "17:05",
      timeApproximate: true,
      heatId: null,
      heat: null,
      heatCount: 1,
      lane: null,
      status: null,
      entryTime: 6653,
      entryRank: null,
      swimTime: null,
      places: [],
      awardsMedals: true,
      phase: "later",
    },
  },
  {
    key: "followed-dns",
    swimmer: sampleMeet.swimmers[2],
    swim: {
      eventId: "e2",
      club: "SG Neukölln e.V. Berlin",
      session: 3,
      eventNumber: 2,
      eventName: "100m Brust weiblich (Vorlauf)",
      round: "PRE",
      ifQualified: false,
      date: "2026-11-13",
      time: "09:40",
      timeApproximate: false,
      heatId: "e2h1",
      heat: 1,
      heatCount: 3,
      lane: 5,
      status: "DNS",
      entryTime: 6690,
      entryRank: null,
      swimTime: null,
      places: [],
      awardsMedals: false,
      phase: "done",
    },
  },
];

const placementSamples: { label: string; places: Place[] }[] = [
  {
    label: "1. Jg + 3. Offen",
    places: [
      { group: "Jahrgang 2006", place: 1 },
      { group: "Offene Wertung", place: 3 },
    ],
  },
  {
    label: "2. Jg + 6. Offen",
    places: [
      { group: "Jahrgang 2008", place: 2 },
      { group: "Offene Wertung", place: 6 },
    ],
  },
  {
    label: "3. Jg + 14. Offen",
    places: [
      { group: "Jahrgang 2009", place: 3 },
      { group: "Offene Wertung", place: 14 },
    ],
  },
  {
    label: "5. U23 + 19. Offen",
    places: [
      { group: "U23-Wertung", place: 5 },
      { group: "Offene Wertung", place: 19 },
    ],
  },
  {
    label: "12. Jg 08 u.ä.",
    places: [{ group: "Jahrgang 2008 und älter", place: 12 }],
  },
];

export function DevComponentsPage() {
  const [expandedKey, setExpandedKey] = useState<string | null>("next");
  const [expandedMyStarts, setExpandedMyStarts] = useState<string | null>(null);
  const [narrow393, setNarrow393] = useState(true);
  const [heatTab, setHeatTab] = useState<"finished" | "running" | "scheduled">("finished");
  const [lastClick, setLastClick] = useState<string | null>(null);

  // Clock for EventsView: WK 1 & 2 finished, WK 3 running on heat 6 of 14, WK 4 & 101 scheduled.
  const eventsClock: MeetClock = "2026-11-12T09:55";
  // Clock for HeatsView & HeatDetailView on e2: heat 1 finished, heat 2 running, heat 3 scheduled.
  const heatsClock: MeetClock = "2026-11-12T09:43";

  const activeHeatId = useMemo(
    () => (heatTab === "finished" ? "e2h1" : heatTab === "running" ? "e2h2" : "e2h3"),
    [heatTab],
  );

  return (
    <div className="stack">
      <header className="view-header">
        <div className="view-header__badges">
          <span className="tag tag--live">DEV</span>
          <a href="/" className="link">
            ← Zur App
          </a>
        </div>
        <h1>Component Test Page</h1>
        <p className="muted">
          Alle neuen Komponenten und Zustände auf einer Seite.
          {lastClick && ` Letzter Klick: ${lastClick}`}
        </p>
      </header>

      {/* 0. PlacementDisplay (metallic split keycap) */}
      <section className="dev-showcase">
        <h2 className="dev-showcase__title">0. PlacementDisplay (Gold · Silver · Bronze · Top 8 · Field)</h2>
        <div className="pl-lab">
          <div className="pl-lab__card">
            <div className="pl-lab__name">Normal</div>
            {placementSamples.map((sample) => (
              <div key={sample.label} className="pl-lab__row">
                <span className="pl-lab__label">{sample.label}</span>
                <PlacementDisplay places={sample.places} />
              </div>
            ))}
          </div>
          <div className="pl-lab__card">
            <div className="pl-lab__name">Compact</div>
            {placementSamples.map((sample) => (
              <div key={sample.label} className="pl-lab__row">
                <span className="pl-lab__label">{sample.label}</span>
                <PlacementDisplay places={sample.places} compact />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 1. Meet header */}
      <section className="dev-showcase">
        <h2 className="dev-showcase__title">1. Meet Header</h2>
        <button
          type="button"
          className="meet-header"
          onClick={() => setLastClick("MeetHeader → /events")}
        >
          <span className="meet-header__name">{sampleMeet.summary.name}</span>
          <span className="meet-header__meta">
            <span>{sampleMeet.summary.city}</span>
            <span className="meet-header__cta">Wettkämpfe ({sampleMeet.events.length}) →</span>
          </span>
        </button>
      </section>

      {/* 1b. MyStartsCard (Flighty "My Flights" inspired sheet) */}
      <section className="dev-showcase">
        <div className="dev-showcase__head">
          <h2 className="dev-showcase__title">1b. Meine Starts Sheet (Flighty &ldquo;My Flights&rdquo; style)</h2>
          <div className="actions">
            <button type="button" className={narrow393 ? "primary" : undefined} onClick={() => setNarrow393(true)}>
              393px (iPhone)
            </button>
            <button type="button" className={!narrow393 ? "primary" : undefined} onClick={() => setNarrow393(false)}>
              Full width
            </button>
          </div>
        </div>
        <div style={{ maxWidth: narrow393 ? 393 : undefined }}>
          <MyStartsCard
            swimmer={sampleMeet.swimmers[0]!}
            swims={demoSwims.filter((d) => !d.swimmer).map((d) => d.swim)}
            clock="2026-11-12T12:06"
            expandedKey={expandedMyStarts}
            onToggle={(key) => setExpandedMyStarts((cur) => (cur === key ? null : key))}
            rowKeyFor={(swim) => `${swim.eventId}:${swim.eventNumber}:${swim.ifQualified ? "q" : "e"}`}
            onOpenSwimmer={(id) => setLastClick(`openSwimmer(${id})`)}
            onOpenHeat={(eventId, heatId) => setLastClick(`openHeat(${eventId}, ${heatId})`)}
            onOpenSwim={(swimmerId, eventId) => setLastClick(`openSwim(${swimmerId}, ${eventId})`)}
          />
        </div>
      </section>

      {/* 2. ResultCardRow (V2) + SwimAccordionRow */}
      <section className="dev-showcase">
        <div className="dev-showcase__head">
          <h2 className="dev-showcase__title">2. Result Cards (V2) &amp; Upcoming Swim Rows</h2>
          <div className="actions">
            <button type="button" className={narrow393 ? "primary" : undefined} onClick={() => setNarrow393(true)}>
              393px (iPhone)
            </button>
            <button type="button" className={!narrow393 ? "primary" : undefined} onClick={() => setNarrow393(false)}>
              Full width
            </button>
          </div>
        </div>

        <div className="stack" style={{ maxWidth: narrow393 ? 393 : undefined }}>
          <div className="section">
            <h2>Letzte Ergebnisse (V3 pro Tag · Tage getrennt wie V2)</h2>
            <div className="day-blocks">
              {groupSwimsByDay(
                demoSwims
                  .filter((d) => d.swim.phase === "done")
                  .map((d) => ({ ...d, date: d.swim.date })),
              ).map((day) => (
                <div key={day.date} className="day-block">
                  <div className="day-block__head num">{formatDay(day.date)}</div>
                  <ol className="rrow-list">
                    {day.swims.map(({ key, swim, swimmer }) => (
                      <ResultCardRow
                        key={key}
                        swim={swim}
                        swimmer={swimmer}
                        expanded={expandedKey === `r:${key}`}
                        onToggle={() => setExpandedKey((current) => (current === `r:${key}` ? null : `r:${key}`))}
                        showEntryRank
                        onOpenHeat={(eventId, heatId) => setLastClick(`openHeat(${eventId}, ${heatId})`)}
                        onOpenSwimmer={(id) => setLastClick(`openSwimmer(${id})`)}
                        onOpenDetail={() => setLastClick(`openSwim(${swim.eventId})`)}
                      />
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </div>

          <div className="section">
            <h2>Nächste Starts (SwimAccordionRow)</h2>
            <ol className="swim-list">
              {demoSwims
                .filter((d) => d.swim.phase !== "done")
                .map(({ key, swim, swimmer }) => (
                  <SwimAccordionRow
                    key={key}
                    swim={swim}
                    swimmer={swimmer}
                    expanded={expandedKey === key}
                    onToggle={() => setExpandedKey((current) => (current === key ? null : key))}
                    showEntryRank
                    onOpenHeat={(eventId, heatId) => setLastClick(`openHeat(${eventId}, ${heatId})`)}
                    onOpenSwimmer={(id) => setLastClick(`openSwimmer(${id})`)}
                    onOpenDetail={() => setLastClick(`openSwim(${swim.eventId})`)}
                  />
                ))}
            </ol>
          </div>
        </div>
      </section>

      {/* 3. Events (WKs) view + heat cubes */}
      <section className="dev-showcase">
        <h2 className="dev-showcase__title">3. Events View (muted done · running with 14 heat cubes · scheduled)</h2>
        <EventsView
          meet={sampleMeet}
          clock={eventsClock}
          onOpenEvent={(eventId) => setLastClick(`openEvent(${eventId})`)}
          onOpenHeat={(eventId, heatId) => setLastClick(`openHeat(${eventId}, ${heatId})`)}
        />
      </section>

      {/* 4. Heats view (PDF Meldeergebnis) */}
      <section className="dev-showcase">
        <h2 className="dev-showcase__title">4. Heats View (finished · running · scheduled)</h2>
        <HeatsView
          meet={sampleMeet}
          eventId="e2"
          clock={heatsClock}
          onOpenHeat={(eventId, heatId) => setLastClick(`openHeat(${eventId}, ${heatId})`)}
        />
      </section>

      {/* 5. Heat detail view */}
      <section className="dev-showcase">
        <div className="dev-showcase__head">
          <h2 className="dev-showcase__title">5. Heat Detail View</h2>
          <div className="actions">
            {(["finished", "running", "scheduled"] as const).map((state) => (
              <button
                key={state}
                type="button"
                className={heatTab === state ? "primary" : undefined}
                onClick={() => setHeatTab(state)}
              >
                {state === "finished" ? "Beendet (Lauf 1)" : state === "running" ? "Läuft (Lauf 2)" : "Geplant (Lauf 3)"}
              </button>
            ))}
          </div>
        </div>
        <HeatDetailView
          meet={sampleMeet}
          eventId="e2"
          heatId={activeHeatId}
          clock={heatsClock}
          onOpenEvent={(eventId) => setLastClick(`openEvent(${eventId})`)}
          onOpenHeat={(_, heatId) => {
            setHeatTab(heatId === "e2h1" ? "finished" : heatId === "e2h2" ? "running" : "scheduled");
          }}
          onOpenSwim={(swimmerId, eventId) => setLastClick(`openSwim(${swimmerId}, ${eventId})`)}
        />
      </section>
    </div>
  );
}
