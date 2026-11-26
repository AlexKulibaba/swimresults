import { describe, expect, test } from "vitest";
import { comparableSwims, compareSwims, homePage, openMeet, swimDetail, swimmerSchedule, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

// A prelim with two heats (09:00, 09:05) and its final (17:00). Anna swims heat 1 and the final, Lena is disqualified
// in heat 2, Mia withdrew before the meet.
const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>
          <EVENT eventid="10" number="1" gender="F" round="PRE" order="1">
            <SWIMSTYLE name="100m Freistil weiblich (Vorlauf)" stroke="FREE" relaycount="1" distance="100" />
            <HEATS><HEAT heatid="101" number="1" daytime="09:00" /><HEAT heatid="102" number="2" daytime="09:05" /></HEATS>
            <AGEGROUPS><AGEGROUP agegroupid="1" name="Offene Wertung"><RANKINGS><RANKING place="1" resultid="1" /></RANKINGS></AGEGROUP></AGEGROUPS>
          </EVENT>
        </EVENTS>
      </SESSION>
      <SESSION number="2" date="2026-11-12" daytime="17:00">
        <EVENTS>
          <EVENT eventid="11" number="101" gender="F" round="FIN" order="1">
            <SWIMSTYLE name="100m Freistil weiblich (Finale)" stroke="FREE" relaycount="1" distance="100" />
            <HEATS><HEAT heatid="111" number="1" daytime="17:00" /></HEATS>
            <AGEGROUPS><AGEGROUP agegroupid="2" name="Offene Wertung"><RANKINGS><RANKING place="1" resultid="2" /></RANKINGS></AGEGROUP></AGEGROUPS>
          </EVENT>
        </EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" license="100">
            <ENTRIES>
              <ENTRY eventid="10" entrytime="00:01:01.00" heatid="101" lane="4" />
              <ENTRY eventid="11" entrytime="00:01:00.00" heatid="111" lane="4" />
            </ENTRIES>
            <RESULTS>
              <RESULT resultid="1" eventid="10" swimtime="00:01:00.00" reactiontime="+65" heatid="101" lane="4">
                <SPLITS><SPLIT distance="50" swimtime="00:00:29.00" /></SPLITS>
              </RESULT>
              <RESULT resultid="2" eventid="11" swimtime="00:00:59.50" reactiontime="+62" heatid="111" lane="4">
                <SPLITS><SPLIT distance="50" swimtime="00:00:28.80" /></SPLITS>
              </RESULT>
            </RESULTS>
          </ATHLETE>
          <ATHLETE athleteid="2" firstname="Lena" lastname="Becker" birthdate="2010-01-01" gender="F">
            <ENTRIES><ENTRY eventid="10" entrytime="00:01:02.00" heatid="102" lane="5" /></ENTRIES>
            <RESULTS><RESULT resultid="3" eventid="10" swimtime="00:01:01.50" status="DSQ" heatid="102" lane="5" /></RESULTS>
          </ATHLETE>
          <ATHLETE athleteid="3" firstname="Mia" lastname="Wolf" birthdate="2010-01-01" gender="F">
            <ENTRIES><ENTRY eventid="10" entrytime="00:01:03.00" heatid="102" lane="6" /></ENTRIES>
            <RESULTS><RESULT resultid="4" eventid="10" swimtime="00:00:00.00" status="WDR" /></RESULTS>
          </ATHLETE>
        </ATHLETES>
      </CLUB>`,
  }),
);

const beforeThePrelim = "2026-11-12T08:00";
const duringThePrelim = "2026-11-12T09:03";
const beforeTheFinal = "2026-11-12T12:00";
const afterTheFinal = "2026-11-12T18:00";

const anna = { swimmerId: "1", eventId: "10" };
const annaFinal = { swimmerId: "1", eventId: "11" };

describe("a replay shows only what was known at the replay time", () => {
  test("before the prelim: no results or disqualifications yet, finals only possible; entry ranks and withdrawals are known", () => {
    const swims = (swimmerId: string) => swimmerSchedule(meet, swimmerId, beforeThePrelim)?.swims;

    expect({
      anna: swims("1")?.map(({ eventNumber, ifQualified, swimTime, entryRank }) => ({ eventNumber, ifQualified, swimTime, rank: entryRank?.overall.rank })),
      lena: swims("2")?.map((swim) => swim.status),
      mia: swims("3")?.map((swim) => swim.status),
    }).toEqual({
      anna: [
        { eventNumber: 1, ifQualified: false, swimTime: null, rank: 1 },
        { eventNumber: 101, ifQualified: true, swimTime: null, rank: undefined },
      ],
      lena: [null],
      mia: ["WDR"],
    });
  });

  test("before the prelim: the swim has no detail and nothing to compare", () => {
    expect({ detail: swimDetail(meet, "1", "10", beforeThePrelim), offered: comparableSwims(meet, anna, beforeThePrelim) }).toEqual({
      detail: null,
      offered: [],
    });
  });

  test("during the prelim: a finished heat has its time, splits and reaction time, but places wait for the last heat", () => {
    expect(swimDetail(meet, "1", "10", duringThePrelim)).toMatchObject({
      swimTime: 6000,
      reactionTime: 65,
      places: [],
      splits: [
        { to: 50, cumulative: 2900 },
        { to: 100, cumulative: 6000 },
      ],
    });
  });

  test("between prelim and final: places are known and the final line-up is set, but the final has no result", () => {
    const final = swimmerSchedule(meet, "1", beforeTheFinal)?.swims.find((swim) => swim.eventNumber === 101);

    expect({
      prelimPlaces: swimDetail(meet, "1", "10", beforeTheFinal)?.places,
      final: { ifQualified: final?.ifQualified, heat: final?.heat, lane: final?.lane, swimTime: final?.swimTime, status: final?.status },
      finalDetail: swimDetail(meet, "1", "11", beforeTheFinal),
    }).toEqual({
      prelimPlaces: [{ group: "Offene Wertung", place: 1 }],
      final: { ifQualified: false, heat: 1, lane: 4, swimTime: null, status: null },
      finalDetail: null,
    });
  });

  test("between prelim and final: the final can't be compared yet", () => {
    expect({
      offered: comparableSwims(meet, anna, beforeTheFinal).map((swim) => swim.eventId),
      comparison: compareSwims(meet, anna, annaFinal, beforeTheFinal),
    }).toEqual({ offered: [], comparison: { ok: false, reason: "not-swum-yet" } });
  });

  test("before the prelim: the home page shows Anna's next swim without any result", () => {
    const home = homePage(meet, { me: null, swimmers: ["license:100"], clubs: [] }, beforeThePrelim);

    expect(home.followed?.upcoming.map(({ eventNumber, swimTime, phase }) => ({ eventNumber, swimTime, phase }))).toEqual([
      { eventNumber: 1, swimTime: null, phase: "next" },
      { eventNumber: 101, swimTime: null, phase: "later" },
    ]);
  });

  test("after the final: everything is known", () => {
    expect({
      final: swimDetail(meet, "1", "11", afterTheFinal),
      comparison: compareSwims(meet, anna, annaFinal, afterTheFinal),
    }).toMatchObject({
      final: { swimTime: 5950, places: [{ group: "Offene Wertung", place: 1 }], differenceFromPrelim: -50 },
      comparison: { ok: true, difference: -50 },
    });
  });
});
