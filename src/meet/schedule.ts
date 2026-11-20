import type { Meet, Round, Swimmer, SwimStatus } from "./model";

/** "YYYY-MM-DDTHH:MM" in the meet's local time. */
export type MeetClock = string;

/** Where a swim stands relative to the meet clock. */
export type SwimPhase = "done" | "next" | "later";

export interface ScheduledSwim {
  /** With the swimmer, identifies the swim, e.g. to open its detail. */
  eventId: string;
  session: number;
  eventNumber: number;
  eventName: string;
  round: Round;
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

/** One swimmer's swims in start order, with their phase relative to the clock. */
export function scheduleOf(meet: Meet, swimmerId: string, clock: MeetClock): OrderedSwim[] {
  const swims = meet.swims
    .filter((swim) => swim.swimmerId === swimmerId)
    .flatMap((swim): OrderedSwim[] => {
      const event = meet.events.find((candidate) => candidate.id === swim.eventId);
      const session = meet.sessions.find((candidate) => candidate.number === event?.session);
      if (!event || !session) return [];
      const heat = event.heats.find((candidate) => candidate.id === swim.heatId);
      const time = heat?.daytime ?? event.daytime ?? session.daytime;

      return [
        {
          eventOrder: event.order,
          swim: {
            eventId: event.id,
            session: session.number,
            eventNumber: event.number,
            eventName: event.name,
            round: event.round,
            date: session.date,
            time,
            timeApproximate: time !== null && !heat?.daytime,
            heat: heat?.number ?? null,
            heatCount: event.heats.length,
            lane: swim.lane,
            status: swim.status,
            entryTime: event.round === "FIN" ? null : swim.entryTime,
            swimTime: swim.swimTime,
            phase: startOf(session.date, time) < clock ? "done" : "later",
          },
        },
      ];
    })
    .sort(byStartOrder);

  const next = swims.find(({ swim }) => swim.phase === "later" && swim.status === null);
  if (next) next.swim.phase = "next";
  return swims;
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
