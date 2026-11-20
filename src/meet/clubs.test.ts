import { describe, expect, test } from "vitest";
import { clubSchedule, openMeet, searchClubs, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>
          <EVENT eventid="10" number="1" gender="F" round="TIM" order="1">
            <SWIMSTYLE name="100m Freistil weiblich" stroke="FREE" relaycount="1" distance="100" />
            <HEATS>
              <HEAT heatid="101" number="1" daytime="09:00" />
              <HEAT heatid="102" number="2" daytime="09:05" />
            </HEATS>
          </EVENT>
          <EVENT eventid="11" number="2" gender="M" round="TIM" order="2">
            <SWIMSTYLE name="100m Freistil männlich" stroke="FREE" relaycount="1" distance="100" />
            <HEATS><HEAT heatid="111" number="1" daytime="09:30" /></HEATS>
          </EVENT>
          <EVENT eventid="12" number="3" gender="F" round="TIM" order="3">
            <SWIMSTYLE name="50m Rücken weiblich" stroke="BACK" relaycount="1" distance="50" />
            <HEATS><HEAT heatid="121" number="1" daytime="10:00" /></HEATS>
          </EVENT>
        </EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
            <ENTRIES>
              <ENTRY eventid="10" entrytime="00:01:01.00" heatid="102" lane="4" />
              <ENTRY eventid="12" entrytime="00:00:31.00" heatid="121" lane="5" />
            </ENTRIES>
          </ATHLETE>
          <ATHLETE athleteid="2" firstname="Jonas" lastname="Wolf" birthdate="2008-01-01" gender="M">
            <ENTRIES><ENTRY eventid="11" entrytime="00:00:55.00" heatid="111" lane="3" /></ENTRIES>
          </ATHLETE>
          <ATHLETE athleteid="3" firstname="Mia" lastname="Wolf" birthdate="2011-01-01" gender="F">
            <ENTRIES><ENTRY eventid="10" entrytime="00:01:08.00" heatid="101" lane="2" /></ENTRIES>
          </ATHLETE>
        </ATHLETES>
      </CLUB>
      <CLUB name="SG Essen">
        <ATHLETES>
          <ATHLETE athleteid="4" firstname="Lena" lastname="Becker" birthdate="2009-01-01" gender="F">
            <ENTRIES><ENTRY eventid="10" entrytime="00:01:00.00" heatid="102" lane="5" /></ENTRIES>
          </ATHLETE>
        </ATHLETES>
      </CLUB>
      <CLUB name="Wasserfreunde Wuppertal">
        <ATHLETES />
      </CLUB>`,
  }),
);

describe("searching clubs", () => {
  test("finds clubs by part of their name, with how many swimmers they have at the meet", () => {
    expect(searchClubs(meet, "wupper")).toEqual([
      { name: "SV Bayer Wuppertal", swimmerCount: 3 },
      { name: "Wasserfreunde Wuppertal", swimmerCount: 0 },
    ]);
  });
});

describe("a club's page", () => {
  const swimsOn = (clock: string) => {
    const page = clubSchedule(meet, "SV Bayer Wuppertal", clock);
    const label = (swim: { swimmer: { firstName: string }; eventNumber: number; heat: number | null }) =>
      `${swim.swimmer.firstName} Wk ${swim.eventNumber} Lauf ${swim.heat}`;
    return { upcoming: page?.upcoming.map(label), completed: page?.completed.map(label) };
  };

  test("lists members' upcoming swims in start order and completed swims latest first", () => {
    expect(swimsOn("2026-11-12T09:20")).toEqual({
      upcoming: ["Jonas Wk 2 Lauf 1", "Anna Wk 3 Lauf 1"],
      completed: ["Anna Wk 1 Lauf 2", "Mia Wk 1 Lauf 1"],
    });
  });

  test("before the meet every swim is upcoming", () => {
    expect(swimsOn("2026-11-11T12:00")).toEqual({
      upcoming: ["Mia Wk 1 Lauf 1", "Anna Wk 1 Lauf 2", "Jonas Wk 2 Lauf 1", "Anna Wk 3 Lauf 1"],
      completed: [],
    });
  });

  test("a club that is not in the meet has no page", () => {
    expect(clubSchedule(meet, "SC Unbekannt", "2026-11-12T09:20")).toBeNull();
  });
});
