import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { openMeet, swimmerSchedule, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const beforeTheMeet = "2026-11-11T12:00";

describe("a swimmer's schedule", () => {
  // Session 2's event is listed first in the file, to show that the schedule follows start order, not file order.
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="2" date="2026-11-13" daytime="09:00">
          <EVENTS>
            <EVENT eventid="20" number="7" gender="F" round="PRE" order="1">
              <SWIMSTYLE name="50m Rücken weiblich (Vorlauf)" stroke="BACK" relaycount="1" distance="50" />
              <HEATS>
                <HEAT heatid="201" number="1" daytime="09:00" />
                <HEAT heatid="202" number="2" daytime="09:03" />
              </HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="F" round="PRE" order="1">
              <SWIMSTYLE name="200m Lagen weiblich (Vorlauf)" stroke="MEDLEY" relaycount="1" distance="200" />
              <HEATS>
                <HEAT heatid="101" number="1" daytime="09:00" />
                <HEAT heatid="102" number="2" daytime="09:04" />
                <HEAT heatid="103" number="3" daytime="09:08" />
              </HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>`,
      clubs: `
        <CLUB name="SV Bayer Wuppertal">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
              <ENTRIES>
                <ENTRY eventid="20" entrytime="00:00:31.20" heatid="202" lane="3" />
                <ENTRY eventid="10" entrytime="00:02:25.00" heatid="102" lane="4" />
              </ENTRIES>
            </ATHLETE>
          </ATHLETES>
        </CLUB>`,
    }),
  );

  test("lists the swimmer's swims in start order with session, event, round, scheduled time, heat and lane", () => {
    expect(swimmerSchedule(meet, "1", beforeTheMeet)?.swims).toMatchObject([
      {
        session: 1,
        eventNumber: 1,
        eventName: "200m Lagen weiblich (Vorlauf)",
        round: "PRE",
        date: "2026-11-12",
        time: "09:04",
        timeApproximate: false,
        heat: 2,
        heatCount: 3,
        lane: 4,
      },
      {
        session: 2,
        eventNumber: 7,
        eventName: "50m Rücken weiblich (Vorlauf)",
        round: "PRE",
        date: "2026-11-13",
        time: "09:03",
        timeApproximate: false,
        heat: 2,
        heatCount: 2,
        lane: 3,
      },
    ]);
  });
});

describe("scheduled time when the heat has none", () => {
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="F" round="TIM" order="1" daytime="09:20">
              <SWIMSTYLE name="400m Freistil weiblich" stroke="FREE" relaycount="1" distance="400" />
              <HEATS><HEAT heatid="101" number="1" /></HEATS>
            </EVENT>
            <EVENT eventid="11" number="2" gender="F" round="TIM" order="2">
              <SWIMSTYLE name="50m Brust weiblich" stroke="BREAST" relaycount="1" distance="50" />
              <HEATS><HEAT heatid="111" number="1" /></HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>
        <SESSION number="2" date="2026-11-12">
          <EVENTS>
            <EVENT eventid="20" number="3" gender="F" round="TIM" order="1">
              <SWIMSTYLE name="100m Schmetterling weiblich" stroke="FLY" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="201" number="1" /></HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>`,
      clubs: `
        <CLUB name="SG Essen">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Lena" lastname="Becker" birthdate="2009-01-01" gender="F">
              <ENTRIES>
                <ENTRY eventid="10" entrytime="00:04:40.00" heatid="101" lane="2" />
                <ENTRY eventid="11" entrytime="00:00:34.00" heatid="111" lane="5" />
                <ENTRY eventid="20" entrytime="00:01:08.00" heatid="201" lane="6" />
              </ENTRIES>
            </ATHLETE>
          </ATHLETES>
        </CLUB>`,
    }),
  );

  test("falls back to the event's start, then the session's start, marked as approximate", () => {
    expect(swimmerSchedule(meet, "1", beforeTheMeet)?.swims).toMatchObject([
      { eventNumber: 1, time: "09:20", timeApproximate: true },
      { eventNumber: 2, time: "09:00", timeApproximate: true },
      { eventNumber: 3, time: null, timeApproximate: false },
    ]);
  });
});

const splashSample = new URL("../../samples/open-lenex-example-results.lxf", import.meta.url);

describe.skipIf(!existsSync(splashSample))("the SPLASH sample without heat times (git-ignored, local only)", () => {
  test("never presents a scheduled time as exact", () => {
    const meet = open(new Uint8Array(readFileSync(splashSample)));
    const swims = meet.swimmers.flatMap((swimmer) => swimmerSchedule(meet, swimmer.id, beforeTheMeet)?.swims ?? []);

    expect(swims.length).toBeGreaterThan(0);
    expect(swims.filter((swim) => swim.time !== null && !swim.timeApproximate)).toEqual([]);
  });
});

describe("swims without a lane or without a valid time", () => {
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="M" round="PRE" order="1">
              <SWIMSTYLE name="100m Brust männlich (Vorlauf)" stroke="BREAST" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="101" number="1" daytime="09:00" /></HEATS>
            </EVENT>
            <EVENT eventid="11" number="2" gender="M" round="PRE" order="2">
              <SWIMSTYLE name="50m Freistil männlich (Vorlauf)" stroke="FREE" relaycount="1" distance="50" />
              <HEATS><HEAT heatid="111" number="1" daytime="09:10" /></HEATS>
            </EVENT>
            <EVENT eventid="12" number="3" gender="M" round="PRE" order="3">
              <SWIMSTYLE name="200m Rücken männlich (Vorlauf)" stroke="BACK" relaycount="1" distance="200" />
              <HEATS><HEAT heatid="121" number="1" daytime="09:20" /></HEATS>
            </EVENT>
            <EVENT eventid="13" number="4" gender="M" round="PRE" order="4">
              <SWIMSTYLE name="100m Lagen männlich (Vorlauf)" stroke="MEDLEY" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="131" number="1" daytime="09:30" /></HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>`,
      clubs: `
        <CLUB name="SG Essen">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Jonas" lastname="Wolf" birthdate="2007-01-01" gender="M">
              <ENTRIES>
                <ENTRY eventid="10" entrytime="00:01:05.00" heatid="101" />
              </ENTRIES>
              <RESULTS>
                <RESULT resultid="1" eventid="11" swimtime="00:00:00.00" status="DNS" heatid="111" lane="4" />
                <RESULT resultid="2" eventid="12" swimtime="00:02:10.55" status="DSQ" heatid="121" lane="2" />
                <RESULT resultid="3" eventid="13" swimtime="00:00:00.00" status="WDR" />
              </RESULTS>
            </ATHLETE>
          </ATHLETES>
        </CLUB>`,
    }),
  );

  test("a missing lane or heat stays empty rather than guessed, and swim statuses are kept", () => {
    expect(swimmerSchedule(meet, "1", beforeTheMeet)?.swims).toMatchObject([
      { eventNumber: 1, heat: 1, lane: null, status: null },
      { eventNumber: 2, heat: 1, lane: 4, status: "DNS" },
      { eventNumber: 3, heat: 1, lane: 2, status: "DSQ" },
      { eventNumber: 4, heat: null, lane: null, status: "WDR" },
    ]);
  });
});

describe("the next swim according to the meet clock", () => {
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="F" round="TIM" order="1">
              <SWIMSTYLE name="100m Freistil weiblich" stroke="FREE" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="101" number="1" daytime="09:00" /></HEATS>
            </EVENT>
            <EVENT eventid="11" number="2" gender="F" round="TIM" order="2">
              <SWIMSTYLE name="50m Rücken weiblich" stroke="BACK" relaycount="1" distance="50" />
              <HEATS><HEAT heatid="111" number="1" daytime="09:30" /></HEATS>
            </EVENT>
            <EVENT eventid="12" number="3" gender="F" round="TIM" order="3">
              <SWIMSTYLE name="200m Brust weiblich" stroke="BREAST" relaycount="1" distance="200" />
              <HEATS><HEAT heatid="121" number="1" daytime="10:00" /></HEATS>
            </EVENT>
            <EVENT eventid="13" number="4" gender="F" round="TIM" order="4">
              <SWIMSTYLE name="50m Freistil weiblich" stroke="FREE" relaycount="1" distance="50" />
              <HEATS><HEAT heatid="131" number="1" daytime="10:30" /></HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>`,
      clubs: `
        <CLUB name="SV Bayer Wuppertal">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
              <ENTRIES>
                <ENTRY eventid="10" entrytime="00:01:01.00" heatid="101" lane="4" />
                <ENTRY eventid="11" entrytime="00:00:31.00" heatid="111" lane="4" />
                <ENTRY eventid="12" entrytime="00:02:40.00" heatid="121" lane="4" />
                <ENTRY eventid="13" entrytime="00:00:27.00" heatid="131" lane="4" />
              </ENTRIES>
              <RESULTS>
                <RESULT resultid="1" eventid="11" swimtime="00:00:00.00" status="WDR" heatid="111" lane="4" />
              </RESULTS>
            </ATHLETE>
          </ATHLETES>
        </CLUB>`,
    }),
  );

  const phases = (clock: string) => swimmerSchedule(meet, "1", clock)?.swims.map((swim) => swim.phase);

  test("swims before the clock are done and the first one at or after it is next", () => {
    expect(phases("2026-11-12T09:45")).toEqual(["done", "done", "next", "later"]);
  });

  test("a withdrawn swim is never the next swim", () => {
    expect(phases("2026-11-12T09:15")).toEqual(["done", "later", "next", "later"]);
  });

  test("after the meet every swim is done", () => {
    expect(phases("2026-11-20T12:00")).toEqual(["done", "done", "done", "done"]);
  });
});

describe("events the meet file describes only partly", () => {
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="F" round="TIM" order="1">
              <SWIMSTYLE stroke="BREAST" relaycount="1" distance="200" />
              <HEATS><HEAT heatid="101" number="1" daytime="09:00" /></HEATS>
            </EVENT>
            <EVENT eventid="11" number="2" gender="X" round="TIM" order="2">
              <SWIMSTYLE name="4x50m Freistil mixed" stroke="FREE" relaycount="4" distance="50" />
              <HEATS><HEAT heatid="111" number="1" daytime="09:30" /></HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>`,
      clubs: `
        <CLUB name="SV Bayer Wuppertal">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
              <ENTRIES><ENTRY eventid="10" entrytime="00:02:40.00" heatid="101" lane="4" /></ENTRIES>
            </ATHLETE>
          </ATHLETES>
          <RELAYS>
            <RELAY number="1" gender="X">
              <ENTRIES><ENTRY eventid="11" entrytime="00:01:50.00" heatid="111" lane="3" /></ENTRIES>
              <RESULTS>
                <RESULT resultid="9" eventid="11" swimtime="00:01:49.00" heatid="111" lane="3">
                  <RELAYPOSITIONS><RELAYPOSITION number="1" athleteid="1" /></RELAYPOSITIONS>
                </RESULT>
              </RESULTS>
            </RELAY>
          </RELAYS>
        </CLUB>`,
    }),
  );

  test("an event without a name gets one from distance, stroke and gender", () => {
    expect(swimmerSchedule(meet, "1", beforeTheMeet)?.swims[0]?.eventName).toBe("200m Brust weiblich");
  });

  test("relays appear nowhere in a swimmer's schedule", () => {
    expect(swimmerSchedule(meet, "1", beforeTheMeet)?.swims.map((swim) => swim.eventNumber)).toEqual([1]);
  });
});

describe("entry times in the schedule", () => {
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="F" round="PRE" order="1">
              <SWIMSTYLE name="100m Freistil weiblich (Vorlauf)" stroke="FREE" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="101" number="1" daytime="09:00" /></HEATS>
            </EVENT>
            <EVENT eventid="11" number="2" gender="F" round="TIM" order="2">
              <SWIMSTYLE name="50m Rücken weiblich" stroke="BACK" relaycount="1" distance="50" />
              <HEATS><HEAT heatid="111" number="1" daytime="09:30" /></HEATS>
            </EVENT>
            <EVENT eventid="12" number="101" gender="F" round="FIN" order="3">
              <SWIMSTYLE name="100m Freistil weiblich (Finale)" stroke="FREE" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="121" number="1" daytime="17:00" /></HEATS>
            </EVENT>
          </EVENTS>
        </SESSION>`,
      clubs: `
        <CLUB name="SV Bayer Wuppertal">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
              <ENTRIES>
                <ENTRY eventid="10" entrytime="00:01:02.33" heatid="101" lane="4" />
                <ENTRY eventid="11" entrytime="NT" heatid="111" lane="1" />
                <ENTRY eventid="12" entrytime="00:01:01.80" heatid="121" lane="4" />
              </ENTRIES>
            </ATHLETE>
          </ATHLETES>
        </CLUB>`,
    }),
  );

  test("prelims and timed finals show the entry time; no time stays empty; finals show none", () => {
    expect(swimmerSchedule(meet, "1", beforeTheMeet)?.swims.map((swim) => swim.entryTime)).toEqual([6233, null, null]);
  });
});
