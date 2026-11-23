import type { Meet, Swimmer, SwimRecord } from "./model";

/** Where an entry time ranks among the event's entries; not a prediction of the finish. */
export interface EntryRank {
  /** Among entries of the same Jahrgang; null when the swimmer's birth year is unknown. */
  jahrgang: { jahrgang: number; rank: number; of: number } | null;
  overall: { rank: number; of: number };
}

interface Index {
  timedEntriesByEvent: Map<string, SwimRecord[]>;
  swimmersById: Map<string, Swimmer>;
}

const indexes = new WeakMap<Meet, Index>();

/** The entry rank of a prelim or timed-final swim; null for finals and for swims without an entry time. */
export function entryRank(meet: Meet, swim: SwimRecord): EntryRank | null {
  const event = meet.events.find((candidate) => candidate.id === swim.eventId);
  if (!event || event.round === "FIN" || swim.entryTime === null) return null;

  const { timedEntriesByEvent, swimmersById } = indexOf(meet);
  const entries = timedEntriesByEvent.get(swim.eventId) ?? [];
  const jahrgang = swimmersById.get(swim.swimmerId)?.jahrgang ?? null;
  const sameJahrgang = entries.filter((entry) => swimmersById.get(entry.swimmerId)?.jahrgang === jahrgang);

  return {
    jahrgang: jahrgang === null ? null : { jahrgang, ...rankAmong(sameJahrgang, swim.entryTime) },
    overall: rankAmong(entries, swim.entryTime),
  };
}

/** Equal times share a rank: the rank is one more than the number of faster entries. */
function rankAmong(entries: SwimRecord[], entryTime: number): { rank: number; of: number } {
  return { rank: 1 + entries.filter((entry) => entry.entryTime! < entryTime).length, of: entries.length };
}

function indexOf(meet: Meet): Index {
  let index = indexes.get(meet);
  if (!index) {
    const timedEntriesByEvent = new Map<string, SwimRecord[]>();
    for (const swim of meet.swims) {
      if (swim.entryTime !== null) timedEntriesByEvent.set(swim.eventId, [...(timedEntriesByEvent.get(swim.eventId) ?? []), swim]);
    }
    index = { timedEntriesByEvent, swimmersById: new Map(meet.swimmers.map((swimmer) => [swimmer.id, swimmer])) };
    indexes.set(meet, index);
  }
  return index;
}
