import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { lenexMeet } from "./testing/lenexFixture";
import { openMeet, swimDetail, type Meet } from "./index";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const afterEverything = "2100-01-01T00:00";

describe("the detail of a completed swim", () => {
  const meet = open(
    lenexMeet({
      sessions: `
        <SESSION number="1" date="2026-11-12" daytime="09:00">
          <EVENTS>
            <EVENT eventid="10" number="1" gender="F" round="PRE" order="1">
              <SWIMSTYLE name="100m Freistil weiblich (Vorlauf)" stroke="FREE" relaycount="1" distance="100" />
              <HEATS><HEAT heatid="101" number="1" daytime="09:00" /></HEATS>
              <AGEGROUPS>
                <AGEGROUP agegroupid="1" name="Offene Wertung">
                  <RANKINGS><RANKING place="3" resultid="1" /><RANKING place="-1" resultid="2" /></RANKINGS>
                </AGEGROUP>
                <AGEGROUP agegroupid="2" name="Jahrgang 2010">
                  <RANKINGS><RANKING place="1" resultid="1" /></RANKINGS>
                </AGEGROUP>
              </AGEGROUPS>
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
            <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F">
              <ENTRIES>
                <ENTRY eventid="10" entrytime="00:01:02.33" heatid="101" lane="4" />
                <ENTRY eventid="11" entrytime="00:01:01.10" heatid="111" lane="4" />
              </ENTRIES>
              <RESULTS>
                <RESULT resultid="1" eventid="10" swimtime="00:01:01.10" reactiontime="+61" heatid="101" lane="4">
                  <SPLITS>
                    <SPLIT distance="25" swimtime="00:00:13.20" />
                    <SPLIT distance="50" swimtime="00:00:27.10" />
                  </SPLITS>
                </RESULT>
                <RESULT resultid="3" eventid="11" swimtime="00:01:00.95" heatid="111" lane="4" />
              </RESULTS>
            </ATHLETE>
            <ATHLETE athleteid="2" firstname="Lena" lastname="Becker" birthdate="2009-01-01" gender="F">
              <ENTRIES><ENTRY eventid="10" entrytime="00:01:03.00" heatid="101" lane="5" /></ENTRIES>
              <RESULTS>
                <RESULT resultid="2" eventid="10" swimtime="00:01:02.40" status="DSQ" heatid="101" lane="5">
                  <SPLITS><SPLIT distance="50" swimtime="00:00:29.00" /></SPLITS>
                </RESULT>
              </RESULTS>
            </ATHLETE>
          </ATHLETES>
        </CLUB>`,
    }),
  );

  test("shows the time as official, the place in each scoring group, the difference from the entry time and the reaction time", () => {
    expect(swimDetail(meet, "1", "10", afterEverything)).toMatchObject({
      swimTime: 6110,
      official: true,
      places: [
        { group: "Offene Wertung", place: 3 },
        { group: "Jahrgang 2010", place: 1 },
      ],
      entryTime: 6233,
      differenceFromEntryTime: -123,
      reactionTime: 61,
    });
  });

  test("shows each measured split and the time since the previous one; a missing split widens the range instead of being guessed", () => {
    expect(swimDetail(meet, "1", "10", afterEverything)?.splits).toEqual([
      { from: 0, to: 25, cumulative: 1320, segment: 1320 },
      { from: 25, to: 50, cumulative: 2710, segment: 1390 },
      { from: 50, to: 100, cumulative: 6110, segment: 3400 },
    ]);
  });

  test("a swim with a status shows the status instead of a time, place or splits", () => {
    expect(swimDetail(meet, "2", "10", afterEverything)).toMatchObject({
      status: "DSQ",
      swimTime: null,
      places: [],
      differenceFromEntryTime: null,
      splits: [],
    });
  });

  test("a final compares with the original entry time, not with the prelim time it was seeded with", () => {
    expect(swimDetail(meet, "1", "11", afterEverything)).toMatchObject({ entryTime: 6233, differenceFromEntryTime: -138 });
  });

  test("a missing reaction time stays empty", () => {
    expect(swimDetail(meet, "1", "11", afterEverything)?.reactionTime).toBeNull();
  });
});

const sample = (name: string) => new URL(`../../samples/${name}`, import.meta.url);

// Expected values were read directly from the sample files' RESULT, SPLIT, ENTRY and RANKING elements.
describe.skipIf(!existsSync(sample("dkm-2026.lxf")))("a short-course swim with 25 m splits (DKM sample, local only)", () => {
  test("splits every 25 m up to the finish", () => {
    const meet = open(new Uint8Array(readFileSync(sample("dkm-2026.lxf"))));

    expect(swimDetail(meet, "789", "52", afterEverything)).toMatchObject({
      eventName: "100m Rücken männlich (Vorlauf)",
      swimTime: 5867,
      differenceFromEntryTime: 18,
      reactionTime: 58,
      places: [{ group: "Offene Wertung", place: 52 }],
      splits: [
        { from: 0, to: 25, cumulative: 1356, segment: 1356 },
        { from: 25, to: 50, cumulative: 2832, segment: 1476 },
        { from: 50, to: 75, cumulative: 4388, segment: 1556 },
        { from: 75, to: 100, cumulative: 5867, segment: 1479 },
      ],
    });
  });
});

describe.skipIf(!existsSync(sample("dm-2024-berlin.lef")))("a long-course swim placed in two scoring groups (DM 2024 sample, local only)", () => {
  test("splits every 50 m, with the finish counted once, and both places", () => {
    const meet = open(new Uint8Array(readFileSync(sample("dm-2024-berlin.lef"))));

    expect(swimDetail(meet, "1", "28", afterEverything)).toMatchObject({
      swimTime: 6359,
      differenceFromEntryTime: -87,
      reactionTime: 64,
      places: [
        { group: "U23-Wertung", place: 12 },
        { group: "Offene Wertung", place: 19 },
      ],
      splits: [
        { from: 0, to: 50, cumulative: 2939, segment: 2939 },
        { from: 50, to: 100, cumulative: 6359, segment: 3420 },
      ],
    });
  });
});
