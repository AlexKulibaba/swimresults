import { describe, expect, test } from "vitest";
import { clubSchedule, homePage, openMeet, searchClubs, searchSwimmers, swimmerSchedule, type Meet } from "./index";
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

const entry = (eventId: string) => `<ENTRY eventid="${eventId}" entrytime="00:00:30.00" heatid="${eventId}1" lane="4" />`;

// The same person (license 500) is entered for her club and for a federation team, as in the DM 2026 sample.
const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>${event("1", "1", "09:00")}${event("2", "2", "09:30")}${event("3", "3", "10:00")}</EVENTS>
      </SESSION>`,
    clubs: `
      <CLUB name="SV Bayer Wuppertal">
        <ATHLETES>
          <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" license="500">
            <ENTRIES>${entry("1")}${entry("3")}</ENTRIES>
          </ATHLETE>
        </ATHLETES>
      </CLUB>
      <CLUB name="Deutscher Schwimm-Verband">
        <ATHLETES>
          <ATHLETE athleteid="9" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" license="500">
            <ENTRIES>${entry("2")}</ENTRIES>
          </ATHLETE>
        </ATHLETES>
      </CLUB>`,
  }),
);

const beforeTheMeet = "2026-11-11T12:00";

describe("a swimmer entered for more than one club", () => {
  test("is found once, with every club they start for", () => {
    expect(searchSwimmers(meet, "anna schmidt")).toMatchObject([
      { firstName: "Anna", clubs: ["SV Bayer Wuppertal", "Deutscher Schwimm-Verband"] },
    ]);
  });

  test("has one schedule with all their swims, each showing the club it is for", () => {
    const [anna] = searchSwimmers(meet, "anna schmidt");

    expect(swimmerSchedule(meet, anna!.id, beforeTheMeet)?.swims.map(({ eventNumber, club, phase }) => ({ eventNumber, club, phase }))).toEqual([
      { eventNumber: 1, club: "SV Bayer Wuppertal", phase: "next" },
      { eventNumber: 2, club: "Deutscher Schwimm-Verband", phase: "later" },
      { eventNumber: 3, club: "SV Bayer Wuppertal", phase: "later" },
    ]);
  });

  test("appears on each club's page only with the swims for that club", () => {
    const eventsOf = (club: string) => clubSchedule(meet, club, beforeTheMeet)?.upcoming.map((swim) => swim.eventNumber);

    expect({ wuppertal: eventsOf("SV Bayer Wuppertal"), dsv: eventsOf("Deutscher Schwimm-Verband") }).toEqual({
      wuppertal: [1, 3],
      dsv: [2],
    });
  });

  test("counts as a swimmer of each club", () => {
    expect(searchClubs(meet, "a")).toEqual([
      { name: "Deutscher Schwimm-Verband", swimmerCount: 1 },
      { name: "SV Bayer Wuppertal", swimmerCount: 1 },
    ]);
  });

  test("following one of the clubs shows only that club's swims", () => {
    const home = homePage(meet, { me: null, swimmers: [], clubs: ["Deutscher Schwimm-Verband"] }, beforeTheMeet);

    expect(home.followed?.swims.map((swim) => swim.eventNumber)).toEqual([2]);
  });
});
