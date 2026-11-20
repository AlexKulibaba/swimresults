import { XMLParser } from "fast-xml-parser";
import { unzipSync } from "fflate";
import type { Heat, Meet, MeetEvent, Session, Swimmer, SwimRecord } from "./model";

export type OpenMeetError = "not-a-lenex-meet";

export type OpenMeetResult = { ok: true; meet: Meet } | { ok: false; error: OpenMeetError };

const repeatedTags = ["MEET", "SESSION", "EVENT", "HEAT", "CLUB", "ATHLETE", "ENTRY", "RESULT"];

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (tagName) => repeatedTags.includes(tagName),
});

/** Opens a LENEX meet file: a zipped `.lxf` or a plain `.lef`. */
export function openMeet(bytes: Uint8Array): OpenMeetResult {
  try {
    return { ok: true, meet: readMeet(bytes) };
  } catch {
    return { ok: false, error: "not-a-lenex-meet" };
  }
}

// Shapes of the parsed LENEX XML, limited to what the meet model uses. Attributes are strings.
interface LenexSession {
  number: string;
  date: string;
  daytime?: string;
  EVENTS?: { EVENT: LenexEvent[] };
}

interface LenexEvent {
  eventid: string;
  number: string;
  order?: string;
  gender?: string;
  round?: string;
  daytime?: string;
  SWIMSTYLE: { name?: string; stroke: string; distance: string; relaycount?: string };
  HEATS?: { HEAT: { heatid: string; number: string; daytime?: string }[] };
}

interface LenexClub {
  name: string;
  ATHLETES?: { ATHLETE: LenexAthlete[] };
}

interface LenexAthlete {
  athleteid: string;
  firstname: string;
  lastname: string;
  birthdate?: string;
  ENTRIES?: { ENTRY: { eventid: string; entrytime?: string; heatid?: string; lane?: string }[] };
  RESULTS?: { RESULT: { eventid: string; heatid?: string; lane?: string; swimtime?: string; status?: string }[] };
}

/** Throws when the bytes don't contain a LENEX meet. */
function readMeet(bytes: Uint8Array): Meet {
  const lef = isZip(bytes) ? firstLefInZip(bytes) : bytes;
  const xml = new TextDecoder("utf-8").decode(lef);
  const meet = xmlParser.parse(xml).LENEX?.MEETS?.MEET?.[0];
  const lenexSessions: LenexSession[] = meet?.SESSIONS?.SESSION ?? [];
  if (!meet || lenexSessions.length === 0) throw new Error("no LENEX meet with sessions");

  const sessions = lenexSessions.map(readSession);
  const days = sessions.map((session) => session.date).sort();
  const events = lenexSessions.flatMap(readIndividualEvents);
  const clubs: LenexClub[] = meet.CLUBS?.CLUB ?? [];

  return {
    summary: {
      name: meet.name,
      city: meet.city,
      course: meet.course,
      firstDay: days[0]!,
      lastDay: days[days.length - 1]!,
    },
    clubs: clubs.map((club) => ({ name: club.name })),
    swimmers: clubs.flatMap(readSwimmers),
    sessions,
    events,
    swims: clubs.flatMap((club) => readSwims(club, new Set(events.map((event) => event.id)))),
  };
}

function readSession(session: LenexSession): Session {
  return { number: Number(session.number), date: session.date, daytime: session.daytime ?? null };
}

function readIndividualEvents(session: LenexSession): MeetEvent[] {
  return (session.EVENTS?.EVENT ?? [])
    .filter((event) => Number(event.SWIMSTYLE.relaycount ?? 1) === 1)
    .map((event) => ({
      id: event.eventid,
      number: Number(event.number),
      order: Number(event.order ?? event.number),
      session: Number(session.number),
      name: event.SWIMSTYLE.name ?? fallbackEventName(event),
      round: event.round ?? "TIM",
      daytime: event.daytime ?? null,
      heats: (event.HEATS?.HEAT ?? []).map(
        (heat): Heat => ({ id: heat.heatid, number: Number(heat.number), daytime: heat.daytime ?? null }),
      ),
    }));
}

const strokeNames: Record<string, string> = {
  FREE: "Freistil",
  BACK: "Rücken",
  BREAST: "Brust",
  FLY: "Schmetterling",
  MEDLEY: "Lagen",
};

const genderNames: Record<string, string> = { F: "weiblich", M: "männlich", X: "mixed" };

/** For files whose events have no name, e.g. "200m Brust weiblich". */
function fallbackEventName(event: LenexEvent): string {
  const { distance, stroke } = event.SWIMSTYLE;
  const gender = event.gender ? genderNames[event.gender] : undefined;
  return [`${distance}m`, strokeNames[stroke] ?? stroke, gender].filter(Boolean).join(" ");
}

function readSwimmers(club: LenexClub): Swimmer[] {
  return (club.ATHLETES?.ATHLETE ?? []).map((athlete) => ({
    id: athlete.athleteid,
    firstName: athlete.firstname,
    lastName: athlete.lastname,
    jahrgang: athlete.birthdate ? Number(athlete.birthdate.slice(0, 4)) : null,
    club: club.name,
  }));
}

/** One swim per swimmer and event; the result's heat and lane win over the entry's. */
function readSwims(club: LenexClub, individualEventIds: Set<string>): SwimRecord[] {
  return (club.ATHLETES?.ATHLETE ?? []).flatMap((athlete) => {
    const swims = new Map<string, SwimRecord>();

    for (const entry of athlete.ENTRIES?.ENTRY ?? []) {
      swims.set(entry.eventid, {
        swimmerId: athlete.athleteid,
        eventId: entry.eventid,
        heatId: entry.heatid ?? null,
        lane: entry.lane ? Number(entry.lane) : null,
        status: null,
        entryTime: entry.entrytime ? hundredths(entry.entrytime) : null,
        swimTime: null,
      });
    }
    for (const result of athlete.RESULTS?.RESULT ?? []) {
      const entered = swims.get(result.eventid);
      swims.set(result.eventid, {
        swimmerId: athlete.athleteid,
        eventId: result.eventid,
        heatId: result.heatid ?? entered?.heatId ?? null,
        lane: result.lane ? Number(result.lane) : (entered?.lane ?? null),
        status: result.status ?? null,
        entryTime: entered?.entryTime ?? null,
        swimTime: result.swimtime ? hundredths(result.swimtime) : null,
      });
    }

    return [...swims.values()].filter((swim) => individualEventIds.has(swim.eventId));
  });
}

/** "00:02:06.10" → 12610 */
function hundredths(time: string): number | null {
  const match = /^(\d+):(\d+):(\d+)\.(\d+)$/.exec(time);
  if (!match) return null;
  const [, h, m, s, cs] = match.map(Number) as [number, number, number, number, number];
  return ((h * 60 + m) * 60 + s) * 100 + cs;
}

function isZip(bytes: Uint8Array): boolean {
  return bytes[0] === 0x50 && bytes[1] === 0x4b;
}

function firstLefInZip(bytes: Uint8Array): Uint8Array {
  const files = unzipSync(bytes, { filter: (file) => file.name.toLowerCase().endsWith(".lef") });
  const lef = Object.values(files)[0];
  if (!lef) throw new Error("no .lef file in the archive");
  return lef;
}
