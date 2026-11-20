import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { openMeet, swimDetail, swimmerSchedule, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const afterEverything = "2100-01-01T00:00";

const event = (id: string, number: string, order: number, round: string, name: string, stroke: string, heats: string[]) => `
  <EVENT eventid="${id}" number="${number}" gender="F" round="${round}" order="${order}">
    <SWIMSTYLE name="${name}" stroke="${stroke}" relaycount="1" distance="50" />
    <HEATS>${heats.map((daytime, index) => `<HEAT heatid="${id}${index + 1}" number="${index + 1}" daytime="${daytime}" />`).join("")}</HEATS>
  </EVENT>`;

const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>
          ${event("10", "1", 1, "PRE", "50m Freistil weiblich (Vorlauf)", "FREE", ["09:00", "09:05"])}
          ${event("20", "2", 2, "TIM", "50m Brust weiblich", "BREAST", ["09:30"])}
        </EVENTS>
      </SESSION>
      <SESSION number="2" date="2026-11-12" daytime="16:30">
        <EVENTS>
          ${event("12", "201", 1, "FIN", "50m Freistil weiblich (B-Finale)", "FREE", ["16:55"])}
          ${event("11", "101", 2, "FIN", "50m Freistil weiblich (A-Finale)", "FREE", ["17:00"])}
          ${event("13", "102", 3, "FIN", "50m Rücken weiblich (Finale)", "BACK", ["17:10"])}
        </EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
            <ENTRIES>
              <ENTRY eventid="10" entrytime="00:00:28.00" heatid="101" lane="4" />
              <ENTRY eventid="11" entrytime="00:00:27.50" heatid="111" lane="4" />
            </ENTRIES>
            <RESULTS>
              <RESULT resultid="1" eventid="10" swimtime="00:00:27.50" heatid="101" lane="4" />
              <RESULT resultid="2" eventid="11" swimtime="00:00:27.20" heatid="111" lane="4" />
            </RESULTS>
          </ATHLETE>
          <ATHLETE athleteid="2" firstname="Lena" lastname="Becker" birthdate="2009-01-01" gender="F">
            <ENTRIES><ENTRY eventid="10" entrytime="00:00:29.00" heatid="102" lane="2" /></ENTRIES>
            <RESULTS><RESULT resultid="3" eventid="10" swimtime="00:00:00.00" status="WDR" /></RESULTS>
          </ATHLETE>
          <ATHLETE athleteid="3" firstname="Mia" lastname="Wolf" birthdate="2011-01-01" gender="F">
            <ENTRIES><ENTRY eventid="20" entrytime="00:00:40.00" heatid="201" lane="1" /></ENTRIES>
          </ATHLETE>
        </ATHLETES>
      </CLUB>`,
  }),
);

const scheduleAt = (swimmerId: string, clock: string) =>
  swimmerSchedule(meet, swimmerId, clock)?.swims.map(({ eventNumber, ifQualified, time, heat, lane }) => ({
    eventNumber,
    ifQualified,
    time,
    heat,
    lane,
  }));

describe("finals in a swimmer's schedule", () => {
  test("until the prelim is over, every matching final is listed as 'if qualified', with its time but no heat or lane", () => {
    expect(scheduleAt("1", "2026-11-12T09:03")).toEqual([
      { eventNumber: 1, ifQualified: false, time: "09:00", heat: 1, lane: 4 },
      { eventNumber: 201, ifQualified: true, time: "16:55", heat: null, lane: null },
      { eventNumber: 101, ifQualified: true, time: "17:00", heat: null, lane: null },
    ]);
  });

  test("once the prelim is over, only the final actually swum is listed", () => {
    expect(scheduleAt("1", "2026-11-12T09:10")).toEqual([
      { eventNumber: 1, ifQualified: false, time: "09:00", heat: 1, lane: 4 },
      { eventNumber: 101, ifQualified: false, time: "17:00", heat: 1, lane: 4 },
    ]);
  });

  test("a withdrawn prelim leads to no possible final", () => {
    expect(scheduleAt("2", "2026-11-12T08:00")?.map((swim) => swim.eventNumber)).toEqual([1]);
  });

  test("events without finals list no possible final", () => {
    expect(scheduleAt("3", "2026-11-12T08:00")?.map((swim) => swim.eventNumber)).toEqual([2]);
  });
});

describe("the detail of a final", () => {
  test("also shows the difference from the swimmer's own prelim", () => {
    expect(swimDetail(meet, "1", "11", afterEverything)).toMatchObject({ prelimTime: 2750, differenceFromPrelim: -30 });
  });

  test("a prelim has no prelim to compare with", () => {
    expect(swimDetail(meet, "1", "10", afterEverything)).toMatchObject({ prelimTime: null, differenceFromPrelim: null });
  });
});

const dkm = new URL("../../samples/dkm-2026.lxf", import.meta.url);

// Read directly from the file: event 1 (200m Schmetterling, Vorlauf) has a B-final (Wk 201, eventid 13, 16:59) and
// an A-final (Wk 101, eventid 14, 17:03). Athlete 41 swam the B-final (2:19.08 → 2:16.66), athlete 264 the A-final
// (2:15.10 → 2:18.81), athlete 108 neither.
describe.skipIf(!existsSync(dkm))("A- and B-finals in the DKM sample (local only)", () => {
  const sample = existsSync(dkm) ? open(new Uint8Array(readFileSync(dkm))) : null;
  const events = (swimmerId: string, clock: string) =>
    swimmerSchedule(sample!, swimmerId, clock)
      ?.swims.filter((swim) => swim.date === "2026-11-12" && ["1", "13", "14"].includes(swim.eventId))
      .map((swim) => `${swim.eventName}${swim.ifQualified ? " bei Qualifikation" : ""}`);

  test("before the prelim, both finals are possible", () => {
    expect(events("108", "2026-11-12T08:00")).toEqual([
      "200m Schmetterling weiblich (Vorlauf)",
      "200m Schmetterling weiblich (B-Finale) bei Qualifikation",
      "200m Schmetterling weiblich (Finale) bei Qualifikation",
    ]);
  });

  test("after the prelim, the B-finalist has the B-final and the swimmer who didn't qualify has none", () => {
    expect({ finalist: events("41", "2026-11-12T12:00"), notQualified: events("108", "2026-11-12T12:00") }).toEqual({
      finalist: ["200m Schmetterling weiblich (Vorlauf)", "200m Schmetterling weiblich (B-Finale)"],
      notQualified: ["200m Schmetterling weiblich (Vorlauf)"],
    });
  });

  test("the A-final detail compares with the prelim", () => {
    expect(swimDetail(sample!, "264", "14", afterEverything)).toMatchObject({ prelimTime: 13510, differenceFromPrelim: 371 });
  });
});
