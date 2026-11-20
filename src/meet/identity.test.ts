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

  // The case is found in the raw file text when the test runs, so no swimmer's data is written into this repo:
  // a license entered for two clubs in DM 2026 that also swam DM 2024.
  test.skipIf(!existsSync(dm2024) || !existsSync(dm2026))(
    "a swimmer with a license is recognised by it, as one swimmer with every club they are entered for (DM samples, local only)",
    () => {
      const clubs2024 = clubsByLicense(dm2024);
      const [license, clubs] = [...clubsByLicense(dm2026)].find(([key, clubs]) => clubs.length > 1 && clubs2024.has(key))!;
      const first = open(new Uint8Array(readFileSync(dm2024)));
      const second = open(new Uint8Array(readFileSync(dm2026)));
      const followed = first.swimmers.find((swimmer) => swimmer.license === license)!;

      expect([...(findSwimmer(second, swimmerKey(followed))?.clubs ?? [])].sort()).toEqual([...clubs].sort());
    },
  );
});

/** The clubs each license is entered for, read from the raw file text rather than through the meet module. */
function clubsByLicense(file: URL): Map<string, string[]> {
  const clubs = new Map<string, string[]>();
  for (const chunk of readFileSync(file, "utf-8").split("<CLUB ").slice(1)) {
    const club = /name="([^"&]*)"/.exec(chunk)?.[1];
    if (!club) continue;
    for (const [, license] of chunk.matchAll(/<ATHLETE [^>]*license="(\d+)"/g)) {
      if (!clubs.get(license!)?.includes(club)) clubs.set(license!, [...(clubs.get(license!) ?? []), club]);
    }
  }
  return clubs;
}
