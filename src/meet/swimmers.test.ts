import { describe, expect, test } from "vitest";
import { openMeet, searchSwimmers, type Meet } from "./index";
import { lenexMeet, oneEventSession } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

describe("searching swimmers", () => {
  const meet = open(
    lenexMeet({
      sessions: oneEventSession,
      clubs: `
        <CLUB name="SV Bayer Wuppertal">
          <ATHLETES>
            <ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" />
            <ATHLETE athleteid="2" firstname="Lena" lastname="Becker" birthdate="2009-01-01" gender="F" />
          </ATHLETES>
        </CLUB>
        <CLUB name="SG Essen">
          <ATHLETES>
            <ATHLETE athleteid="3" firstname="Anna" lastname="Schmidt" birthdate="2008-01-01" gender="F" />
          </ATHLETES>
        </CLUB>`,
    }),
  );

  test("swimmers with the same name can be told apart by Jahrgang and club", () => {
    expect(searchSwimmers(meet, "anna schmidt")).toEqual([
      { id: "3", firstName: "Anna", lastName: "Schmidt", jahrgang: 2008, clubs: ["SG Essen"], license: null },
      { id: "1", firstName: "Anna", lastName: "Schmidt", jahrgang: 2010, clubs: ["SV Bayer Wuppertal"], license: null },
    ]);
  });
});
