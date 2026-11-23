import { entryRank, type EntryRank } from "./entryRanks";
import type { Meet, Place, Round, Swimmer, SwimRecord, SwimStatus } from "./model";
import { eventIsOver, prelimOf } from "./rounds";
import { startOfSwim, type MeetClock } from "./schedule";

/** The time between two measured distances of a swim. */
export interface SplitSegment {
  /** Metres where the segment starts: 0 or the previous measured distance. */
  from: number;
  /** Metres where it was measured. */
  to: number;
  /** Hundredths of a second since the start. */
  cumulative: number;
  /** Hundredths of a second since the previous measured distance. */
  segment: number;
}

export interface SwimDetail {
  swimmer: Swimmer;
  eventNumber: number;
  eventName: string;
  round: Round;
  status: SwimStatus | null;
  /** Hundredths of a second; null for a swim with a status. */
  swimTime: number | null;
  /** Times from a meet file are official; only live timing would be provisional. */
  official: true;
  places: Place[];
  /** The original Meldezeit for this stroke and distance, also for finals. */
  entryTime: number | null;
  /** Hundredths of a second; negative when faster than the entry time. */
  differenceFromEntryTime: number | null;
  /** Where the entry time ranked; null for finals and entries without a time. */
  entryRank: EntryRank | null;
  /** For a final: the swimmer's time in the prelim it follows. */
  prelimTime: number | null;
  /** For a final: hundredths of a second; negative when faster than in the prelim. */
  differenceFromPrelim: number | null;
  reactionTime: number | null;
  /** Measured distances up to the finish, in order. */
  splits: SplitSegment[];
}

/** The detail of a swim that has started by the clock; places only once the whole event is over. */
export function swimDetail(meet: Meet, swimmerId: string, eventId: string, clock: MeetClock): SwimDetail | null {
  const swimmer = meet.swimmers.find((candidate) => candidate.id === swimmerId);
  const event = meet.events.find((candidate) => candidate.id === eventId);
  const swim = meet.swims.find((candidate) => candidate.swimmerId === swimmerId && candidate.eventId === eventId);
  if (!swimmer || !event || !swim) return null;
  const start = startOfSwim(meet, swim);
  if (start === null || start >= clock) return null;

  const valid = swim.status === null;
  const swimTime = valid ? swim.swimTime : null;
  // A final is seeded with prelim times; the Meldezeit is on the swimmer's prelim entry.
  const prelim = event.round === "FIN" ? prelimSwim(meet, swim) : null;
  const entryTime = event.round === "FIN" ? (prelim?.entryTime ?? null) : swim.entryTime;
  const prelimTime = prelim?.status === null ? prelim.swimTime : null;

  return {
    swimmer,
    eventNumber: event.number,
    eventName: event.name,
    round: event.round,
    status: swim.status,
    swimTime,
    official: true,
    places: valid && eventIsOver(meet, event, clock) ? swim.places : [],
    entryTime,
    differenceFromEntryTime: swimTime !== null && entryTime !== null ? swimTime - entryTime : null,
    entryRank: entryRank(meet, swim),
    prelimTime,
    differenceFromPrelim: swimTime !== null && prelimTime !== null ? swimTime - prelimTime : null,
    reactionTime: swim.reactionTime,
    splits: valid && swimTime !== null ? segments(swim, event.distance, swimTime) : [],
  };
}

/** The swimmer's own swim in the prelim a final follows. */
function prelimSwim(meet: Meet, final: SwimRecord): SwimRecord | null {
  const finalEvent = meet.events.find((event) => event.id === final.eventId);
  const prelim = finalEvent ? prelimOf(meet, finalEvent) : null;
  return meet.swims.find((swim) => swim.swimmerId === final.swimmerId && swim.eventId === prelim?.id) ?? null;
}

/** Measured splits plus the finish, each with the time since the previous measured distance. */
function segments(swim: SwimRecord, distance: number, swimTime: number): SplitSegment[] {
  const measured = [
    ...swim.splits.filter((split) => split.distance < distance).sort((a, b) => a.distance - b.distance),
    { distance, time: swimTime },
  ];
  return measured.map((split, index) => {
    const previous = measured[index - 1];
    return {
      from: previous?.distance ?? 0,
      to: split.distance,
      cumulative: split.time,
      segment: split.time - (previous?.time ?? 0),
    };
  });
}
