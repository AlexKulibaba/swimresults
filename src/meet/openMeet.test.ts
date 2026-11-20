import { readFileSync, existsSync } from "node:fs";
import { describe, expect, test } from "vitest";
import { openMeet } from "./index";

const samplePath = (name: string) => new URL(`../../samples/${name}`, import.meta.url);
const hasSample = (name: string) => existsSync(samplePath(name));
const readSample = (name: string) => new Uint8Array(readFileSync(samplePath(name)));

function openOrFail(bytes: Uint8Array) {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

describe.skipIf(!hasSample("dkm-2026.lxf"))("opening the DKM 2026 sample (git-ignored, local only)", () => {
  test("a zipped .lxf meet opens with its summary", () => {
    const meet = openOrFail(readSample("dkm-2026.lxf"));

    expect(meet.summary).toEqual({
      name: "Deutsche Kurzbahnmeisterschaften im Schwimmen 2026",
      city: "Wuppertal",
      course: "SCM",
      firstDay: "2026-11-12",
      lastDay: "2026-11-15",
    });
  });
});

// Expected values come from each file's MEET header and the session dates listed in samples/README.md.
const otherSamples = [
  {
    file: "dm-2026-berlin.lef",
    summary: { name: "137. Deutsche Meisterschaften Schwimmen", city: "Berlin", course: "LCM", firstDay: "2026-04-23", lastDay: "2026-04-26" },
  },
  {
    file: "dm-2024-berlin.lef",
    summary: { name: "135. Deutsche Meisterschaften Schwimmen", city: "Berlin", course: "LCM", firstDay: "2024-04-25", lastDay: "2024-04-28" },
  },
  {
    file: "hannover-2026.lef",
    summary: { name: "Deutsche Sprint- und Lagenmeisterschaften", city: "Stadionbad Hannover", course: "LCM", firstDay: "2026-07-23", lastDay: "2026-07-26" },
  },
  {
    file: "aue-2026.lef",
    summary: { name: "Auer WISMUTPOKAL 2026", city: "Schwimmhalle Aue", course: "SCM", firstDay: "2026-09-19", lastDay: "2026-09-20" },
  },
  {
    file: "open-lenex-example-results.lxf",
    summary: { name: "Schweizerische Masters Meisterschaften", city: "Nottwil", course: "SCM", firstDay: "2009-09-26", lastDay: "2009-09-27" },
  },
];

describe("opening meets from other timing systems (git-ignored samples, local only)", () => {
  test.skipIf(otherSamples.some(({ file }) => !hasSample(file))).each(otherSamples)("$file opens with its summary", ({ file, summary }) => {
    expect(openOrFail(readSample(file)).summary).toEqual(summary);
  });
});

describe("files that are not a readable LENEX meet", () => {
  const text = (s: string) => new TextEncoder().encode(s);

  test.each([
    { case: "an empty file", bytes: new Uint8Array() },
    { case: "a plain text file", bytes: text("Startliste Abschnitt 1\nLauf 1 Bahn 4") },
    { case: "XML that is not LENEX", bytes: text('<?xml version="1.0"?><results><swim time="1:02.33"/></results>') },
    { case: "LENEX without a meet", bytes: text('<?xml version="1.0"?><LENEX version="3.0"><MEETS></MEETS></LENEX>') },
    { case: "a truncated ZIP archive", bytes: new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00]) },
  ])("$case is rejected as not a LENEX meet", ({ bytes }) => {
    expect(openMeet(bytes)).toEqual({ ok: false, error: "not-a-lenex-meet" });
  });
});
