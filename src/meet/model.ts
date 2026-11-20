/** LENEX course code, e.g. "SCM" (25 m) or "LCM" (50 m). */
export type Course = "SCM" | "LCM" | (string & {});

/** LENEX round code, e.g. "PRE" (prelim), "FIN" (final) or "TIM" (timed final). */
export type Round = "PRE" | "FIN" | "TIM" | (string & {});

/** LENEX status of a swim without a valid time, e.g. "DNS", "DSQ" or "WDR". */
export type SwimStatus = "DNS" | "DSQ" | "WDR" | (string & {});

export interface MeetSummary {
  name: string;
  city: string;
  course: Course;
  /** ISO date of the first session. */
  firstDay: string;
  /** ISO date of the last session. */
  lastDay: string;
}

export interface Swimmer {
  /** The LENEX athlete id, unique within one meet. */
  id: string;
  firstName: string;
  lastName: string;
  /** Birth year; null when the meet file has no birthdate. */
  jahrgang: number | null;
  club: string;
}

export interface Session {
  number: number;
  /** ISO date. */
  date: string;
  /** Scheduled start, "HH:MM". */
  daytime: string | null;
}

export interface Heat {
  id: string;
  number: number;
  /** Scheduled start, "HH:MM". */
  daytime: string | null;
}

/** An individual event; relays are not part of the meet model. */
export interface MeetEvent {
  id: string;
  number: number;
  /** Position within its session. */
  order: number;
  session: number;
  name: string;
  round: Round;
  /** Scheduled start, "HH:MM". */
  daytime: string | null;
  heats: Heat[];
}

/** One swimmer's appearance in one event, merged from the entry and the result. */
export interface SwimRecord {
  swimmerId: string;
  eventId: string;
  heatId: string | null;
  lane: number | null;
  status: SwimStatus | null;
  /** Hundredths of a second, as entered; in finals this is usually the prelim time. */
  entryTime: number | null;
  /** Hundredths of a second. */
  swimTime: number | null;
}

export interface Meet {
  summary: MeetSummary;
  swimmers: Swimmer[];
  sessions: Session[];
  events: MeetEvent[];
  swims: SwimRecord[];
}
