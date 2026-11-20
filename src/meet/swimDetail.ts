import type { Meet, Place, Round, Swimmer, SwimRecord, SwimStatus } from "./model";

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
  reactionTime: number | null;
  /** Measured distances up to the finish, in order. */
  splits: SplitSegment[];
}

export function swimDetail(meet: Meet, swimmerId: string, eventId: string): SwimDetail | null {
  const swimmer = meet.swimmers.find((candidate) => candidate.id === swimmerId);
  const event = meet.events.find((candidate) => candidate.id === eventId);
  const swim = meet.swims.find((candidate) => candidate.swimmerId === swimmerId && candidate.eventId === eventId);
  if (!swimmer || !event || !swim) return null;

  const valid = swim.status === null;
  const swimTime = valid ? swim.swimTime : null;
  const entryTime = event.round === "FIN" ? originalEntryTime(meet, swim) : swim.entryTime;

  return {
    swimmer,
    eventNumber: event.number,
    eventName: event.name,
    round: event.round,
    status: swim.status,
    swimTime,
    official: true,
    places: valid ? swim.places : [],
    entryTime,
    differenceFromEntryTime: swimTime !== null && entryTime !== null ? swimTime - entryTime : null,
    reactionTime: swim.reactionTime,
    splits: valid && swimTime !== null ? segments(swim, event.distance, swimTime) : [],
  };
}

/** A final is seeded with prelim times; the Meldezeit is on the swimmer's entry for the same stroke and distance. */
function originalEntryTime(meet: Meet, final: SwimRecord): number | null {
  const finalEvent = meet.events.find((event) => event.id === final.eventId);
  const earlier = meet.swims.find((swim) => {
    const event = meet.events.find((candidate) => candidate.id === swim.eventId);
    return (
      swim.swimmerId === final.swimmerId &&
      event !== undefined &&
      event.round !== "FIN" &&
      event.stroke === finalEvent?.stroke &&
      event.distance === finalEvent?.distance &&
      swim.entryTime !== null
    );
  });
  return earlier?.entryTime ?? null;
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
