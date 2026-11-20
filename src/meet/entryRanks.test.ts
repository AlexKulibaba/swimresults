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

const athlete = (id: string, jahrgang: number, entries: string, results = "") => `
  <ATHLETE athleteid="${id}" firstname="S${id}" lastname="Test" birthdate="${jahrgang}-01-01" gender="F">
    <ENTRIES>${entries}</ENTRIES><RESULTS>${results}</RESULTS>
  </ATHLETE>`;
const prelim = (time: string) => `<ENTRY eventid="10" entrytime="${time}" heatid="101" lane="1" />`;

const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>
          <EVENT eventid="10" number="1" gender="F" round="PRE" order="1">
            <SWIMSTYLE name="100m Freistil weiblich (Vorlauf)" stroke="FREE" relaycount="1" distance="100" />
            <HEATS><HEAT heatid="101" number="1" daytime="09:00" /><HEAT heatid="102" number="2" daytime="09:05" /></HEATS>
          </EVENT>
          <EVENT eventid="11" number="101" gender="F" round="FIN" order="2">
            <SWIMSTYLE name="100m Freistil weiblich (Finale)" stroke="FREE" relaycount="1" distance="100" />
            <HEATS><HEAT heatid="111" number="1" daytime="17:00" /></HEATS>
          </EVENT>
        </EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          ${athlete("1", 2010, prelim("00:01:00.00"))}
          ${athlete("2", 2010, prelim("00:01:01.00") + `<ENTRY eventid="11" entrytime="00:01:00.50" heatid="111" lane="4" />`)}
          ${athlete("3", 2010, `<ENTRY eventid="10" entrytime="00:01:01.00" heatid="102" lane="3" />`)}
          ${athlete("4", 2009, prelim("00:00:59.00"))}
          ${athlete("5", 2010, prelim("00:01:02.00"), `<RESULT resultid="5" eventid="10" swimtime="00:00:00.00" status="WDR" />`)}
          ${athlete("6", 2010, prelim("00:01:03.00"))}
          ${athlete("7", 2010, prelim("NT"))}
        </ATHLETES>
      </CLUB>`,
  }),
);

const rankOf = (swimmerId: string, eventNumber = 1) =>
  swimmerSchedule(meet, swimmerId, "2026-11-11T12:00")?.swims.find((swim) => swim.eventNumber === eventNumber)?.entryRank;

describe("entry ranks", () => {
  test("rank the entry time in the swimmer's Jahrgang and in the whole event, across all heats", () => {
    expect(rankOf("1")).toEqual({ jahrgang: { jahrgang: 2010, rank: 1, of: 5 }, overall: { rank: 2, of: 6 } });
  });

  test("equal entry times share a rank", () => {
    expect([rankOf("2"), rankOf("3")]).toEqual([
      { jahrgang: { jahrgang: 2010, rank: 2, of: 5 }, overall: { rank: 3, of: 6 } },
      { jahrgang: { jahrgang: 2010, rank: 2, of: 5 }, overall: { rank: 3, of: 6 } },
    ]);
  });

  test("swimmers who withdrew still count, since the ranks describe the seeding", () => {
    expect(rankOf("6")).toEqual({ jahrgang: { jahrgang: 2010, rank: 5, of: 5 }, overall: { rank: 6, of: 6 } });
  });

  test("an entry without a time has no rank and isn't counted", () => {
    expect(rankOf("7")).toBeNull();
  });

  test("finals have no entry rank", () => {
    expect(rankOf("2", 101)).toBeNull();
  });

  test("the swim detail shows the entry rank too", () => {
    expect(swimDetail(meet, "1", "10", afterEverything)?.entryRank).toEqual(rankOf("1"));
  });
});

const dkm = new URL("../../samples/dkm-2026.lxf", import.meta.url);

// Expected values computed from the file's ENTRY elements for event 52 with a separate script.
describe.skipIf(!existsSync(dkm))("an entry rank in the DKM sample (local only)", () => {
  test("athlete 789 in the 100m Rücken prelim", () => {
    const sample = open(new Uint8Array(readFileSync(dkm)));
    const swim = swimmerSchedule(sample, "789", "2026-11-11T12:00")?.swims.find((candidate) => candidate.eventId === "52");

    expect(swim?.entryRank).toEqual({ jahrgang: { jahrgang: 2007, rank: 8, of: 9 }, overall: { rank: 50, of: 56 } });
  });
});
