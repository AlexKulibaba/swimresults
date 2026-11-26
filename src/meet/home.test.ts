import { describe, expect, test } from "vitest";
import { homePage, openMeet, type Follows, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const event = (id: string, number: string, daytime: string) => `
  <EVENT eventid="${id}" number="${number}" gender="F" round="TIM" order="${number}">
    <SWIMSTYLE name="Wk ${number}" stroke="FREE" relaycount="1" distance="50" />
    <HEATS><HEAT heatid="${id}1" number="1" daytime="${daytime}" /></HEATS>
  </EVENT>`;

const athlete = (id: string, firstName: string, license: string, eventIds: string[]) => `
  <ATHLETE athleteid="${id}" firstname="${firstName}" lastname="Test" birthdate="2010-01-01" gender="F" license="${license}">
    <ENTRIES>${eventIds.map((eventId) => `<ENTRY eventid="${eventId}" entrytime="00:00:30.00" heatid="${eventId}1" lane="${id}" />`).join("")}</ENTRIES>
  </ATHLETE>`;

const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>${event("1", "1", "09:00")}${event("2", "2", "09:30")}${event("3", "3", "10:00")}${event("4", "4", "10:30")}</EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          ${athlete("1", "Anna", "100", ["1", "3"])}
          ${athlete("2", "Mia", "200", ["2", "4"])}
        </ATHLETES>
      </CLUB>
      <CLUB name="SG Essen">
        <ATHLETES>
          ${athlete("3", "Lena", "300", ["1", "3"])}
          ${athlete("4", "Paul", "400", ["2"])}
        </ATHLETES>
      </CLUB>`,
  }),
);

const nobody: Follows = { me: null, swimmers: [], clubs: [] };
const label = (swim: { swimmer: { firstName: string }; eventNumber: number }) => `${swim.swimmer.firstName} Wk ${swim.eventNumber}`;

describe("the home page", () => {
  test("shows both upcoming swims (in start order) and recent results (most recent first) for followed swimmers and clubs", () => {
    const home = homePage(meet, { me: null, swimmers: ["license:300"], clubs: ["SV Bayer Wuppertal"] }, "2026-11-12T09:15");

    expect({
      upcoming: home.followed?.upcoming.map(label),
      recent: home.followed?.recent.map(label),
    }).toEqual({
      upcoming: ["Mia Wk 2", "Anna Wk 3", "Lena Wk 3", "Mia Wk 4"],
      recent: ["Lena Wk 1", "Anna Wk 1"],
    });
  });

  test("shows only recent swims once everyone followed has finished", () => {
    const home = homePage(meet, { me: null, swimmers: ["license:300", "license:400"], clubs: [] }, "2026-11-12T12:00");

    expect({
      upcoming: home.followed?.upcoming.map(label),
      recent: home.followed?.recent.map(label),
    }).toEqual({
      upcoming: [],
      recent: ["Lena Wk 3", "Paul Wk 2", "Lena Wk 1"],
    });
  });

  test("in swimmer mode my own swims come first, with my next swim, and are not repeated among the follows", () => {
    const home = homePage(meet, { me: "license:100", swimmers: ["license:300"], clubs: ["SV Bayer Wuppertal"] }, "2026-11-12T09:15");

    expect({
      me: home.me?.swims.map((swim) => `Wk ${swim.eventNumber} ${swim.phase}`),
      upcoming: home.followed?.upcoming.map(label),
      recent: home.followed?.recent.map(label),
    }).toEqual({
      me: ["Wk 1 done", "Wk 3 next"],
      upcoming: ["Mia Wk 2", "Lena Wk 3", "Mia Wk 4"],
      recent: ["Lena Wk 1"],
    });
  });

  test("is empty when following nobody", () => {
    expect(homePage(meet, nobody, "2026-11-12T09:15")).toEqual({ me: null, followed: null });
  });

  test("follows that don't swim at this meet are ignored without an error", () => {
    expect(homePage(meet, { me: "license:999", swimmers: ["license:998"], clubs: ["SC Unbekannt"] }, "2026-11-12T09:15")).toEqual({
      me: null,
      followed: null,
    });
  });
});
