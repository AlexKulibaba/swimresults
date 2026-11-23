import { entryRank, type EntryRank } from "./entryRanks";
import type { Meet, MeetEvent, Round, Swimmer, SwimRecord, SwimStatus } from "./model";
import { finalsOf, prelimIsOver, prelimOf } from "./rounds";

/** "YYYY-MM-DDTHH:MM" in the meet's local time. */
export type MeetClock = string;

/** Where a swim stands relative to the meet clock. */
export type SwimPhase = "done" | "next" | "later";

export interface ScheduledSwim {
  /** With the swimmer, identifies the swim, e.g. to open its detail. */
  eventId: string;
  /** The club the swim is started for. */
  club: string;
  session: number;
  eventNumber: number;
  eventName: string;
  round: Round;
  /** A final the swimmer may reach: listed until their prelim is over, without heat or lane. */
  ifQualified: boolean;
  /** ISO date of the session. */
  date: string;
  /** Scheduled start, "HH:MM"; null when the meet file has no time for it. */
  time: string | null;
  /** True when the time is the event's or session's start rather than the heat's. */
  timeApproximate: boolean;
  heat: number | null;
  heatCount: number;
  lane: number | null;
  status: SwimStatus | null;
  /** Meldezeit in hundredths of a second; null without one, and for finals (seeded by prelim times instead). */
  entryTime: number | null;
  /** Where the entry time ranks; null for finals and entries without a time. */
  entryRank: EntryRank | null;
  /** Hundredths of a second. */
  swimTime: number | null;
  phase: SwimPhase;
}

export interface SwimmerSchedule {
  swimmer: Swimmer;
  swims: ScheduledSwim[];
}

export function swimmerSchedule(meet: Meet, swimmerId: string, clock: MeetClock): SwimmerSchedule | null {
  const swimmer = meet.swimmers.find((candidate) => candidate.id === swimmerId);
  if (!swimmer) return null;
  return { swimmer, swims: scheduleOf(meet, swimmerId, clock).map(({ swim }) => swim) };
}

/** A scheduled swim with the event's position in its session, for ordering swims of different swimmers. */
export interface OrderedSwim {
  eventOrder: number;
  swim: ScheduledSwim;
}

/**
 * One swimmer's swims in start order, with their phase relative to the clock. Until a prelim is over, its finals
 * are listed as "if qualified" and the swimmer's actual final is not yet revealed.
 */
export function scheduleOf(meet: Meet, swimmerId: string, clock: MeetClock): OrderedSwim[] {
  const records = meet.swims.filter((swim) => swim.swimmerId === swimmerId);
  const swims: OrderedSwim[] = [];

  for (const record of records) {
    const event = meet.events.find((candidate) => candidate.id === record.eventId);
    if (!event) continue;

    if (event.round === "FIN") {
      const prelim = prelimOf(meet, event);
      if (prelim && !prelimIsOver(meet, prelim, clock)) continue;
    }
    swims.push(...scheduled(meet, event, record, clock));

    if (event.round === "PRE" && record.status === null && !prelimIsOver(meet, event, clock)) {
      for (const final of finalsOf(meet, event)) swims.push(...scheduled(meet, final, record, clock, { ifQualified: true }));
    }
  }
  swims.sort(byStartOrder);

  const next = swims.find(({ swim }) => swim.phase === "later" && swim.status === null && !swim.ifQualified);
  if (next) next.swim.phase = "next";
  return swims;
}

/** The scheduled swim for a record; for a possible final, the record is the prelim and heat and lane are open. */
function scheduled(
  meet: Meet,
  event: MeetEvent,
  record: SwimRecord,
  clock: MeetClock,
  { ifQualified = false } = {},
): OrderedSwim[] {
  const session = meet.sessions.find((candidate) => candidate.number === event.session);
  if (!session) return [];
  const heat = ifQualified ? event.heats[0] : event.heats.find((candidate) => candidate.id === record.heatId);
  const time = heat?.daytime ?? event.daytime ?? session.daytime;

  return [
    {
      eventOrder: event.order,
      swim: {
        eventId: event.id,
        club: record.club,
        session: session.number,
        eventNumber: event.number,
        eventName: event.name,
        round: event.round,
        ifQualified,
        date: session.date,
        time,
        timeApproximate: time !== null && !heat?.daytime,
        heat: ifQualified ? null : (heat?.number ?? null),
        heatCount: event.heats.length,
        lane: ifQualified ? null : record.lane,
        status: ifQualified ? null : record.status,
        entryTime: ifQualified || event.round === "FIN" ? null : record.entryTime,
        entryRank: ifQualified ? null : entryRank(meet, record),
        swimTime: ifQualified ? null : record.swimTime,
        phase: startOf(session.date, time) < clock ? "done" : "later",
      },
    },
  ];
}

/** A scheduled swim together with whose it is, for lists covering several swimmers. */
export interface SwimmerSwim extends ScheduledSwim {
  swimmer: Swimmer;
}

/** The swims of several swimmers merged in start order; each swimmer keeps their own next swim. */
export function swimsOf(meet: Meet, swimmers: Swimmer[], clock: MeetClock): SwimmerSwim[] {
  return swimmers
    .flatMap((swimmer) =>
      scheduleOf(meet, swimmer.id, clock).map((ordered) => ({ ...ordered, swim: { ...ordered.swim, swimmer } })),
    )
    .sort(byStartOrder)
    .map(({ swim }) => swim);
}

export function byStartOrder(a: OrderedSwim, b: OrderedSwim): number {
  return (
    a.swim.date.localeCompare(b.swim.date) ||
    a.swim.session - b.swim.session ||
    a.eventOrder - b.eventOrder ||
    (a.swim.heat ?? 0) - (b.swim.heat ?? 0)
  );
}

/** Comparable with a MeetClock; a swim without a time counts from the start of its day. */
function startOf(date: string, time: string | null): MeetClock {
  return `${date}T${time ?? "00:00"}`;
}
