import { XMLParser } from "fast-xml-parser";
import { unzipSync } from "fflate";

/** LENEX course code, e.g. "SCM" (25 m) or "LCM" (50 m). */
export type Course = "SCM" | "LCM" | (string & {});

export interface MeetSummary {
  name: string;
  city: string;
  course: Course;
  /** ISO date of the first session. */
  firstDay: string;
  /** ISO date of the last session. */
  lastDay: string;
}

export interface Meet {
  summary: MeetSummary;
}

export type OpenMeetError = "not-a-lenex-meet";

export type OpenMeetResult = { ok: true; meet: Meet } | { ok: false; error: OpenMeetError };

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  isArray: (tagName) => ["MEET", "SESSION"].includes(tagName),
});

/** Opens a LENEX meet file: a zipped `.lxf` or a plain `.lef`. */
export function openMeet(bytes: Uint8Array): OpenMeetResult {
  try {
    return { ok: true, meet: readMeet(bytes) };
  } catch {
    return { ok: false, error: "not-a-lenex-meet" };
  }
}

/** Throws when the bytes don't contain a LENEX meet. */
function readMeet(bytes: Uint8Array): Meet {
  const lef = isZip(bytes) ? firstLefInZip(bytes) : bytes;
  const xml = new TextDecoder("utf-8").decode(lef);
  const meet = xmlParser.parse(xml).LENEX?.MEETS?.MEET?.[0];
  const days: string[] = (meet?.SESSIONS?.SESSION ?? []).map((session: { date: string }) => session.date).sort();
  if (!meet || days.length === 0) throw new Error("no LENEX meet with sessions");

  return {
    summary: {
      name: meet.name,
      city: meet.city,
      course: meet.course,
      firstDay: days[0]!,
      lastDay: days[days.length - 1]!,
    },
  };
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
