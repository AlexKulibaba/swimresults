import { existsSync, readFileSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { findSwimmer, openMeet, swimmerKey, type Meet } from "./index";
import { lenexMeet, oneEventSession } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const meetWith = (athletes: string, club = "SV Bayer Wuppertal") =>
  open(lenexMeet({ sessions: oneEventSession, clubs: `<CLUB name="${club}"><ATHLETES>${athletes}</ATHLETES></CLUB>` }));

describe("recognising a followed swimmer in another meet", () => {
  test("a swimmer without a license is recognised by name, Jahrgang and club", () => {
    const first = meetWith(`<ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" />`);
    const second = meetWith(`
      <ATHLETE athleteid="7" firstname="Anna" lastname="Schmidt" birthdate="2008-01-01" gender="F" />
      <ATHLETE athleteid="8" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" />`);

    expect(findSwimmer(second, swimmerKey(first.swimmers[0]!))?.id).toBe("8");
  });

  test("without a license, the same name in another club is a different swimmer", () => {
    const first = meetWith(`<ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" />`);
    const second = meetWith(
      `<ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" />`,
      "SG Essen",
    );

    expect(findSwimmer(second, swimmerKey(first.swimmers[0]!))).toBeNull();
  });

  const dm2024 = new URL("../../samples/dm-2024-berlin.lef", import.meta.url);
  const dm2026 = new URL("../../samples/dm-2026-berlin.lef", import.meta.url);

  // Read directly from the files: license 419595 is athlete 31 at "Berliner TSC" in 2024; in 2026 the same
  // license is entered twice, as athlete 31 at "Berliner TSC" and athlete 43 at "Deutscher Schwimm-Verband".
  test.skipIf(!existsSync(dm2024) || !existsSync(dm2026))(
    "a swimmer with a license is recognised by it, as one swimmer with every club they are entered for (DM samples, local only)",
    () => {
      const first = open(new Uint8Array(readFileSync(dm2024)));
      const second = open(new Uint8Array(readFileSync(dm2026)));
      const followed = first.swimmers.find((swimmer) => swimmer.id === "31")!;

      expect(findSwimmer(second, swimmerKey(followed))).toMatchObject({
        id: "31",
        clubs: ["Berliner TSC", "Deutscher Schwimm-Verband"],
      });
    },
  );
});
