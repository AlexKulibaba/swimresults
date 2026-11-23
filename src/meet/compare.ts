import type { Meet, MeetEvent, Round, Swimmer, SwimRecord } from "./model";
import { startOfSwim, type MeetClock } from "./schedule";
import { matchesEveryWord } from "./swimmers";

/** Identifies one swim: a swimmer in an event. */
export interface SwimRef {
  swimmerId: string;
  eventId: string;
}

/** A completed swim with a valid time, labeled with its event and round. */
export interface ComparedSwim {
  swimmer: Swimmer;
  eventId: string;
  eventNumber: number;
  eventName: string;
  round: Round;
  /** Hundredths of a second. */
  swimTime: number;
}

/** Both swims' cumulative times at a distance both measured, and how far the second is behind (positive) or ahead. */
export interface SplitGap {
  distance: number;
  first: number;
  second: number;
  gap: number;
}

export type Comparison =
  | {
      ok: true;
      first: ComparedSwim;
      second: ComparedSwim;
      /** Second minus first, in hundredths of a second. */
      difference: number;
      /** Only distances both swims measured, including the finish; nothing is said about between them. */
      splits: SplitGap[];
    }
  | { ok: false; reason: "different-stroke-or-distance" | "no-valid-time" };

/**
 * Swims that can be compared with the given one: completed by the clock, with a valid time, over the same stroke and
 * distance in this meet, from any heat or round. Optionally narrowed by swimmer name; fastest first.
 */
export function comparableSwims(meet: Meet, ref: SwimRef, clock: MeetClock, query = ""): ComparedSwim[] {
  const event = eventOf(meet, ref.eventId);
  if (!event) return [];

  return meet.swims
    .filter((swim) => !(swim.swimmerId === ref.swimmerId && swim.eventId === ref.eventId))
    .filter((swim) => {
      const other = eventOf(meet, swim.eventId);
      const start = startOfSwim(meet, swim);
      return other !== undefined && sameStyle(event, other) && start !== null && start < clock;
    })
    .flatMap((swim) => comparedSwim(meet, swim) ?? [])
    .filter((swim) => query.trim() === "" || matchesEveryWord(`${swim.swimmer.firstName} ${swim.swimmer.lastName}`, query))
    .sort((a, b) => a.swimTime - b.swimTime);
}

export function compareSwims(meet: Meet, firstRef: SwimRef, secondRef: SwimRef): Comparison {
  const [firstRecord, secondRecord] = [recordOf(meet, firstRef), recordOf(meet, secondRef)];
  const [firstEvent, secondEvent] = [eventOf(meet, firstRef.eventId), eventOf(meet, secondRef.eventId)];
  if (!firstEvent || !secondEvent || !sameStyle(firstEvent, secondEvent)) {
    return { ok: false, reason: "different-stroke-or-distance" };
  }

  const first = firstRecord && comparedSwim(meet, firstRecord);
  const second = secondRecord && comparedSwim(meet, secondRecord);
  if (!first || !second) return { ok: false, reason: "no-valid-time" };

  const secondSplits = measured(secondRecord!, secondEvent.distance, second.swimTime);
  const splits = [...measured(firstRecord!, firstEvent.distance, first.swimTime)].flatMap(([distance, time]): SplitGap[] => {
    const other = secondSplits.get(distance);
    return other === undefined ? [] : [{ distance, first: time, second: other, gap: other - time }];
  });

  return { ok: true, first, second, difference: second.swimTime - first.swimTime, splits };
}

function comparedSwim(meet: Meet, record: SwimRecord): ComparedSwim | null {
  const swimmer = meet.swimmers.find((candidate) => candidate.id === record.swimmerId);
  const event = eventOf(meet, record.eventId);
  if (!swimmer || !event || record.status !== null || record.swimTime === null) return null;
  return {
    swimmer,
    eventId: event.id,
    eventNumber: event.number,
    eventName: event.name,
    round: event.round,
    swimTime: record.swimTime,
  };
}

/** Measured splits plus the finish: cumulative time by distance, in order of distance. */
function measured(record: SwimRecord, distance: number, swimTime: number): Map<number, number> {
  const splits: [number, number][] = record.splits
    .filter((split) => split.distance < distance)
    .map((split) => [split.distance, split.time]);
  return new Map([...splits, [distance, swimTime] as [number, number]].sort(([a], [b]) => a - b));
}

function sameStyle(a: MeetEvent, b: MeetEvent): boolean {
  return a.stroke === b.stroke && a.distance === b.distance;
}

function eventOf(meet: Meet, eventId: string): MeetEvent | undefined {
  return meet.events.find((event) => event.id === eventId);
}

function recordOf(meet: Meet, ref: SwimRef): SwimRecord | undefined {
  return meet.swims.find((swim) => swim.swimmerId === ref.swimmerId && swim.eventId === ref.eventId);
}
