import { describe, expect, test } from "vitest";
import { comparableSwims, compareSwims, openMeet, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const event = (id: string, order: number, round: string, name: string, stroke: string, distance: number, daytime: string) => `
  <EVENT eventid="${id}" number="${id}" gender="F" round="${round}" order="${order}">
    <SWIMSTYLE name="${name}" stroke="${stroke}" relaycount="1" distance="${distance}" />
    <HEATS><HEAT heatid="${id}1" number="1" daytime="${daytime}" /><HEAT heatid="${id}2" number="2" daytime="${daytime.replace(/:00$/, ":05")}" /></HEATS>
  </EVENT>`;

const result = (id: string, eventId: string, heat: number, time: string, splits: [number, string][], status = "") => `
  <RESULT resultid="${id}" eventid="${eventId}" swimtime="${time}" heatid="${eventId}${heat}" lane="4"${status ? ` status="${status}"` : ""}>
    <SPLITS>${splits.map(([distance, split]) => `<SPLIT distance="${distance}" swimtime="${split}" />`).join("")}</SPLITS>
  </RESULT>`;

const athlete = (id: string, firstName: string, results: string) => `
  <ATHLETE athleteid="${id}" firstname="${firstName}" lastname="Test" birthdate="2010-01-01" gender="F"><RESULTS>${results}</RESULTS></ATHLETE>`;

const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>
          ${event("10", 1, "PRE", "100m Freistil weiblich (Vorlauf)", "FREE", 100, "09:00")}
          ${event("20", 2, "TIM", "100m Rücken weiblich", "BACK", 100, "09:30")}
          ${event("30", 3, "TIM", "50m Freistil weiblich", "FREE", 50, "10:00")}
        </EVENTS>
      </SESSION>
      <SESSION number="2" date="2026-11-12" daytime="17:00">
        <EVENTS>${event("11", 1, "FIN", "100m Freistil weiblich (Finale)", "FREE", 100, "17:00")}</EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          ${athlete("1", "Anna", result("1", "10", 2, "00:01:00.00", [[25, "00:00:13.50"], [50, "00:00:28.80"], [75, "00:00:44.30"]]) + result("2", "11", 1, "00:00:59.40", [[50, "00:00:28.60"]]))}
          ${athlete("2", "Lena", result("3", "10", 1, "00:01:01.00", [[50, "00:00:28.70"]]))}
          ${athlete("3", "Mia", result("4", "10", 1, "00:01:00.50", [[50, "00:00:29.00"]], "DSQ"))}
          ${athlete("4", "Paula", result("5", "20", 1, "00:01:05.00", []))}
          ${athlete("5", "Emma", result("6", "30", 1, "00:00:27.00", []))}
        </ATHLETES>
      </CLUB>`,
  }),
);

const afterTheMeet = "2026-11-13T12:00";
const annaPrelim = { swimmerId: "1", eventId: "10" };

describe("choosing a swim to compare with", () => {
  const offered = (clock: string, query = "") =>
    comparableSwims(meet, annaPrelim, clock, query).map((swim) => `${swim.swimmer.firstName} ${swim.round}`);

  test("offers completed swims over the same stroke and distance, from any heat or round, without swims with a status", () => {
    expect(offered(afterTheMeet)).toEqual(["Anna FIN", "Lena PRE"]);
  });

  test("offers only swims that have already happened", () => {
    expect(offered("2026-11-12T12:00")).toEqual(["Lena PRE"]);
  });

  test("can be narrowed by swimmer name", () => {
    expect(offered(afterTheMeet, "lena")).toEqual(["Lena PRE"]);
  });
});

describe("comparing two swims", () => {
  test("shows both finish times and the gap, and the gap at every distance both swims measured", () => {
    expect(compareSwims(meet, annaPrelim, { swimmerId: "2", eventId: "10" }, afterTheMeet)).toMatchObject({
      ok: true,
      first: { swimmer: { firstName: "Anna" }, round: "PRE", swimTime: 6000 },
      second: { swimmer: { firstName: "Lena" }, round: "PRE", swimTime: 6100 },
      difference: 100,
      splits: [
        { distance: 50, first: 2880, second: 2870, gap: -10 },
        { distance: 100, first: 6000, second: 6100, gap: 100 },
      ],
    });
  });

  test("a prelim and a final can be compared, each labeled with its round", () => {
    expect(compareSwims(meet, annaPrelim, { swimmerId: "1", eventId: "11" }, afterTheMeet)).toMatchObject({
      ok: true,
      first: { eventName: "100m Freistil weiblich (Vorlauf)", round: "PRE" },
      second: { eventName: "100m Freistil weiblich (Finale)", round: "FIN" },
      difference: -60,
    });
  });

  test("swims over a different stroke or distance can't be compared", () => {
    expect([
      compareSwims(meet, annaPrelim, { swimmerId: "4", eventId: "20" }, afterTheMeet),
      compareSwims(meet, annaPrelim, { swimmerId: "5", eventId: "30" }, afterTheMeet),
    ]).toEqual([
      { ok: false, reason: "different-stroke-or-distance" },
      { ok: false, reason: "different-stroke-or-distance" },
    ]);
  });

  test("a swim with a status can't be compared", () => {
    expect(compareSwims(meet, annaPrelim, { swimmerId: "3", eventId: "10" }, afterTheMeet)).toEqual({ ok: false, reason: "no-valid-time" });
  });
});
