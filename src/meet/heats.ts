import { entryRank, type EntryRank } from "./entryRanks";
import { sessionHeatStates, type HeatState } from "./events";
import type { Meet, Place, Round, Swimmer, SwimRecord, SwimStatus } from "./model";
import { awardsMedals, eventIsOver } from "./rounds";
import type { MeetClock } from "./schedule";

export interface HeatLane {
  lane: number | null;
  swimmer: Swimmer;
  club: string;
  entryTime: number | null;
  entryRank: EntryRank | null;
  /** Only populated once the heat is finished relative to the meet clock. */
  swimTime: number | null;
  /** Before finish, only WDR is known; DNS/DSQ/etc. appear once finished. */
  status: SwimStatus | null;
  reactionTime: number | null;
  differenceFromEntryTime: number | null;
  places: Place[];
}

export interface EventHeat {
  id: string;
  number: number;
  heatCount: number;
  daytime: string | null;
  state: HeatState;
  lanes: HeatLane[];
}

export interface EventHeats {
  event: {
    id: string;
    number: number;
    name: string;
    round: Round;
    gender: string;
    session: number;
    date: string;
    daytime: string | null;
    awardsMedals: boolean;
  };
  heats: EventHeat[];
}

export interface HeatDetail {
  event: EventHeats["event"];
  heat: EventHeat;
  prevHeat: { id: string; number: number } | null;
  nextHeat: { id: string; number: number } | null;
}

/** Projects all heats of an event (PDF Meldeergebnis structure) respecting the meet clock. */
export function eventHeats(meet: Meet, eventId: string, clock: MeetClock): EventHeats | null {
  const event = meet.events.find((candidate) => candidate.id === eventId);
  if (!event) return null;
  const session = meet.sessions.find((candidate) => candidate.number === event.session);
  if (!session) return null;

  const stateByHeatId = sessionHeatStates(meet, session.number, clock);
  const swimmersById = new Map(meet.swimmers.map((swimmer) => [swimmer.id, swimmer]));
  const swimsByHeatId = new Map<string, SwimRecord[]>();
  for (const swim of meet.swims) {
    if (swim.eventId !== event.id || !swim.heatId) continue;
    swimsByHeatId.set(swim.heatId, [...(swimsByHeatId.get(swim.heatId) ?? []), swim]);
  }

  const sortedHeats = [...event.heats].sort((a, b) => a.number - b.number);
  const heatCount = sortedHeats.length;
  const over = eventIsOver(meet, event, clock);

  const heats: EventHeat[] = sortedHeats.map((heat) => {
    const state = stateByHeatId.get(heat.id) ?? "scheduled";
    const finished = state === "finished";
    const records = swimsByHeatId.get(heat.id) ?? [];

    const lanes: HeatLane[] = records
      .flatMap((record) => {
        const swimmer = swimmersById.get(record.swimmerId);
        if (!swimmer) return [];
        const swimTime = finished ? record.swimTime : null;
        const status = finished || record.status === "WDR" ? record.status : null;
        const entryTime = record.entryTime;
        const differenceFromEntryTime =
          finished && swimTime !== null && entryTime !== null ? swimTime - entryTime : null;

        return [
          {
            lane: record.lane,
            swimmer,
            club: record.club,
            entryTime,
            entryRank: entryRank(meet, record),
            swimTime,
            status,
            reactionTime: finished ? record.reactionTime : null,
            differenceFromEntryTime,
            places: finished && record.status === null && over ? record.places : [],
          },
        ];
      })
      .sort((a, b) => (a.lane ?? Number.MAX_SAFE_INTEGER) - (b.lane ?? Number.MAX_SAFE_INTEGER));

    return {
      id: heat.id,
      number: heat.number,
      heatCount,
      daytime: heat.daytime ?? event.daytime ?? session.daytime,
      state,
      lanes,
    };
  });

  return {
    event: {
      id: event.id,
      number: event.number,
      name: event.name,
      round: event.round,
      gender: event.gender,
      session: session.number,
      date: session.date,
      daytime: sortedHeats[0]?.daytime ?? event.daytime ?? session.daytime,
      awardsMedals: awardsMedals(meet, event),
    },
    heats,
  };
}

/** Projects a single heat with prev/next heat references for the Heat detail page. */
export function heatDetail(meet: Meet, eventId: string, heatId: string, clock: MeetClock): HeatDetail | null {
  const all = eventHeats(meet, eventId, clock);
  if (!all) return null;
  const index = all.heats.findIndex((candidate) => candidate.id === heatId);
  if (index === -1) return null;

  const heat = all.heats[index]!;
  const prev = all.heats[index - 1];
  const next = all.heats[index + 1];

  return {
    event: all.event,
    heat,
    prevHeat: prev ? { id: prev.id, number: prev.number } : null,
    nextHeat: next ? { id: next.id, number: next.number } : null,
  };
}
