import { describe, expect, test } from "vitest";
import { eventHeats, heatDetail, openMeet, type Meet } from "./index";
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
          <EVENT eventid="1" number="1" gender="F" round="PRE" order="1" daytime="09:00">
            <SWIMSTYLE name="100m Brust weiblich (Vorlauf)" stroke="BREAST" relaycount="1" distance="100" />
            <HEATS>
              <HEAT heatid="h1" number="1" daytime="09:00" />
              <HEAT heatid="h2" number="2" daytime="09:05" />
            </HEATS>
          </EVENT>
        </EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SG Essen">
        <ATHLETES>
          <ATHLETE athleteid="1" firstname="Anna" lastname="Berg" birthdate="2008-05-01" gender="F" license="100">
            <ENTRIES><ENTRY eventid="1" entrytime="00:01:12.50" heatid="h1" lane="4" /></ENTRIES>
            <RESULTS><RESULT eventid="1" swimtime="00:01:11.20" reactiontime="+62" heatid="h1" lane="4" /></RESULTS>
          </ATHLETE>
          <ATHLETE athleteid="2" firstname="Mia" lastname="Kohl" birthdate="2009-02-01" gender="F" license="200">
            <ENTRIES><ENTRY eventid="1" entrytime="00:01:14.00" heatid="h1" lane="3" /></ENTRIES>
            <RESULTS><RESULT eventid="1" status="DNS" heatid="h1" lane="3" /></RESULTS>
          </ATHLETE>
          <ATHLETE athleteid="3" firstname="Lena" lastname="Wolf" birthdate="2007-08-01" gender="F" license="300">
            <ENTRIES><ENTRY eventid="1" entrytime="00:01:08.00" heatid="h2" lane="4" /></ENTRIES>
            <RESULTS><RESULT eventid="1" swimtime="00:01:07.50" heatid="h2" lane="4" /></RESULTS>
          </ATHLETE>
        </ATHLETES>
      </CLUB>`,
  }),
);

describe("eventHeats & heatDetail", () => {
  test("lists heats in order with lanes sorted by lane number and hides future results", () => {
    const view = eventHeats(meet, "1", "2026-11-12T09:05");
    expect(view).not.toBeNull();
    expect(view?.heats.map((h) => `${h.number}:${h.state}`)).toEqual(["1:finished", "2:running"]);

    const heat1 = view!.heats[0]!;
    expect(heat1.lanes.map((l) => `${l.lane}:${l.swimmer.firstName}`)).toEqual(["3:Mia", "4:Anna"]);
    expect(heat1.lanes[0]?.status).toBe("DNS");
    expect(heat1.lanes[1]?.swimTime).toBe(7120);
    expect(heat1.lanes[1]?.differenceFromEntryTime).toBe(-130);
    expect(heat1.lanes[1]?.reactionTime).toBe(62);

    // Heat 2 is running, not finished: result must not leak.
    const heat2 = view!.heats[1]!;
    expect(heat2.lanes[0]?.swimTime).toBeNull();
    expect(heat2.lanes[0]?.entryTime).toBe(6800);
  });

  test("returns prev and next heat links in heatDetail", () => {
    const first = heatDetail(meet, "1", "h1", "2026-11-12T09:05");
    expect(first?.prevHeat).toBeNull();
    expect(first?.nextHeat).toEqual({ id: "h2", number: 2 });

    const second = heatDetail(meet, "1", "h2", "2026-11-12T09:05");
    expect(second?.prevHeat).toEqual({ id: "h1", number: 1 });
    expect(second?.nextHeat).toBeNull();
  });
});
