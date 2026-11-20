import { describe, expect, test } from "vitest";
import { lenexMeet, oneEventSession } from "../meet/testing/lenexFixture";
import { createMeetLibrary } from "./meetLibrary";
import { memoryStorage } from "./memoryStorage";

const meetFile = (name: string) =>
  lenexMeet({
    sessions: oneEventSession,
    clubs: `<CLUB name="${name}"><ATHLETES><ATHLETE athleteid="1" firstname="Anna" lastname="Schmidt" birthdate="2010-01-01" gender="F" /></ATHLETES></CLUB>`,
  });

describe("keeping the meet on the device", () => {
  test("a meet that was opened is there again on the next visit", async () => {
    const storage = memoryStorage();
    await createMeetLibrary(storage).open(meetFile("SG Essen"));

    const restored = await createMeetLibrary(storage).restore();

    expect(restored?.swimmers.flatMap((swimmer) => swimmer.clubs)).toEqual(["SG Essen"]);
  });

  test("nothing is restored on a first visit", async () => {
    expect(await createMeetLibrary(memoryStorage()).restore()).toBeNull();
  });

  test("opening a different meet replaces the stored one", async () => {
    const storage = memoryStorage();
    await createMeetLibrary(storage).open(meetFile("SG Essen"));
    await createMeetLibrary(storage).open(meetFile("SV Bayer Wuppertal"));

    const restored = await createMeetLibrary(storage).restore();

    expect(restored?.swimmers.flatMap((swimmer) => swimmer.clubs)).toEqual(["SV Bayer Wuppertal"]);
  });

  test("a file that is not a meet is rejected and leaves the stored meet alone", async () => {
    const storage = memoryStorage();
    const library = createMeetLibrary(storage);
    await library.open(meetFile("SG Essen"));

    const result = await library.open(new TextEncoder().encode("keine LENEX-Datei"));

    expect(result).toEqual({ ok: false, error: "not-a-lenex-meet" });
    expect((await createMeetLibrary(storage).restore())?.swimmers[0]?.clubs).toEqual(["SG Essen"]);
  });

  test("a removed meet is not restored", async () => {
    const storage = memoryStorage();
    const library = createMeetLibrary(storage);
    await library.open(meetFile("SG Essen"));

    await library.remove();

    expect(await createMeetLibrary(storage).restore()).toBeNull();
  });

  test("stored data that can't be read restores nothing instead of failing", async () => {
    const storage = memoryStorage();
    await storage.set("meet-file", "not the bytes of a meet");

    expect(await createMeetLibrary(storage).restore()).toBeNull();
  });
});
