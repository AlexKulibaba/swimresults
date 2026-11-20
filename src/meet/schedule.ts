import type { Meet, Round, Swimmer, SwimStatus } from "./model";

/** "YYYY-MM-DDTHH:MM" in the meet's local time. */
export type MeetClock = string;

/** Where a swim stands relative to the meet clock. */
export type SwimPhase = "done" | "next" | "later";

export interface ScheduledSwim {
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

  const swims = meet.swims
    .filter((swim) => swim.swimmerId === swimmerId)
    .flatMap((swim) => {
      const event = meet.events.find((candidate) => candidate.id === swim.eventId);
      const session = meet.sessions.find((candidate) => candidate.number === event?.session);
      if (!event || !session) return [];
      const heat = event.heats.find((candidate) => candidate.id === swim.heatId);
      const time = heat?.daytime ?? event.daytime ?? session.daytime;

      return [
        {
          order: event.order,
          swim: {
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
            swimTime: swim.swimTime,
            phase: "later" as SwimPhase,
          },
        },
      ];
    })
    .sort(
      (a, b) =>
        a.swim.date.localeCompare(b.swim.date) ||
        a.swim.session - b.swim.session ||
        a.order - b.order ||
        (a.swim.heat ?? 0) - (b.swim.heat ?? 0),
    )
    .map(({ swim }) => swim);

  for (const swim of swims) {
    if (startOf(swim) < clock) swim.phase = "done";
  }
  const next = swims.find((swim) => swim.phase === "later" && swim.status === null);
  if (next) next.phase = "next";

  return { swimmer, swims };
}

/** Comparable with a MeetClock; a swim without a time counts from the start of its day. */
function startOf(swim: ScheduledSwim): MeetClock {
  return `${swim.date}T${swim.time ?? "00:00"}`;
}
