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
  /** Registration number with the national federation (e.g. DSV-ID); the same across meets. */
  license: string | null;
}

export interface Club {
  /** Clubs are identified by name. */
  name: string;
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
  /** LENEX gender code: "F", "M" or "X". */
  gender: string;
  /** LENEX stroke code, e.g. "FREE" or "MEDLEY". */
  stroke: string;
  /** Metres. */
  distance: number;
  /** Scheduled start, "HH:MM". */
  daytime: string | null;
  heats: Heat[];
}

/** A cumulative time at a measured distance. */
export interface Split {
  distance: number;
  /** Hundredths of a second. */
  time: number;
}

/** The meet's own place for a swim in one of its scoring groups. */
export interface Place {
  group: string;
  place: number;
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
  /** Hundredths of a second; negative for a start before the signal. */
  reactionTime: number | null;
  /** Measured splits in file order. */
  splits: Split[];
  places: Place[];
}

export interface Meet {
  summary: MeetSummary;
  clubs: Club[];
  swimmers: Swimmer[];
  sessions: Session[];
  events: MeetEvent[];
  swims: SwimRecord[];
}
