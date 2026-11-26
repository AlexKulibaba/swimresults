import type { Heat, Meet, MeetEvent, Round, Session } from "./model";
import type { MeetClock } from "./schedule";

export type HeatState = "finished" | "running" | "scheduled";
export type EventState = "finished" | "running" | "scheduled";

export interface HeatProgressItem {
  id: string;
  number: number;
  daytime: string | null;
  state: HeatState;
}

export interface SessionEventSummary {
  id: string;
  number: number;
  order: number;
  name: string;
  round: Round;
  gender: string;
  daytime: string | null;
  state: EventState;
  heats: HeatProgressItem[];
  finishedHeats: number;
}

export interface SessionEvents {
  session: Session;
  events: SessionEventSummary[];
}

interface HeatWindow {
  eventId: string;
  heat: Heat;
  start: MeetClock;
  /** Start of the next heat in the same session, or null for the last heat of a session. */
  nextStart: MeetClock | null;
}

/** Computes the HeatState for every heat in a single session relative to the meet clock. */
export function sessionHeatStates(meet: Meet, sessionNumber: number, clock: MeetClock): Map<string, HeatState> {
  const session = meet.sessions.find((candidate) => candidate.number === sessionNumber);
  if (!session) return new Map();

  const sessionEvents = meet.events
    .filter((event) => event.session === session.number)
    .sort((a, b) => a.order - b.order || a.number - b.number);

  const windows = buildSessionHeatWindows(session, sessionEvents);
  const stateByHeatId = new Map<string, HeatState>();
  for (const window of windows) {
    stateByHeatId.set(window.heat.id, heatStateAt(window.start, window.nextStart, clock));
  }
  return stateByHeatId;
}

/**
 * Lists all meet events grouped by session (Abschnitt) in schedule order, with per-heat and per-event state
 * derived from the meet clock.
 */
export function eventsBySession(meet: Meet, clock: MeetClock): SessionEvents[] {
  const sessions = [...meet.sessions].sort(
    (a, b) => a.date.localeCompare(b.date) || a.number - b.number,
  );

  return sessions.map((session) => {
    const sessionEvents = meet.events
      .filter((event) => event.session === session.number)
      .sort((a, b) => a.order - b.order || a.number - b.number);

    const stateByHeatId = sessionHeatStates(meet, session.number, clock);

    const events: SessionEventSummary[] = sessionEvents.map((event) => {
      const heats: HeatProgressItem[] = [...event.heats]
        .sort((a, b) => a.number - b.number)
        .map((heat) => ({
          id: heat.id,
          number: heat.number,
          daytime: heat.daytime,
          state: stateByHeatId.get(heat.id) ?? "scheduled",
        }));

      const finishedHeats = heats.filter((heat) => heat.state === "finished").length;
      const state = eventStateOf(session, event, heats, clock);

      return {
        id: event.id,
        number: event.number,
        order: event.order,
        name: event.name,
        round: event.round,
        gender: event.gender,
        daytime: heats[0]?.daytime ?? event.daytime ?? session.daytime,
        state,
        heats,
        finishedHeats,
      };
    });

    return { session, events };
  });
}

function buildSessionHeatWindows(session: Session, events: MeetEvent[]): HeatWindow[] {
  const flat: { eventId: string; heat: Heat; start: MeetClock }[] = [];
  for (const event of events) {
    const sortedHeats = [...event.heats].sort((a, b) => a.number - b.number);
    for (const heat of sortedHeats) {
      const time = heat.daytime ?? event.daytime ?? session.daytime ?? "00:00";
      flat.push({ eventId: event.id, heat, start: `${session.date}T${time}` });
    }
  }

  return flat.map((entry, index) => {
    // Look ahead for the next heat that has a strictly later start time (in case heats share an event/session time).
    let nextStart: MeetClock | null = null;
    for (let next = index + 1; next < flat.length; next++) {
      const candidate = flat[next];
      if (candidate && candidate.start > entry.start) {
        nextStart = candidate.start;
        break;
      }
    }
    return { ...entry, nextStart };
  });
}

function heatStateAt(start: MeetClock, nextStart: MeetClock | null, clock: MeetClock): HeatState {
  if (clock < start) return "scheduled";
  if (nextStart !== null && clock < nextStart) return "running";
  // Last heat in a session: treat as running during its start minute, finished once clock passes it.
  if (nextStart === null && clock === start) return "running";
  return "finished";
}

function eventStateOf(
  session: Session,
  event: MeetEvent,
  heats: HeatProgressItem[],
  clock: MeetClock,
): EventState {
  if (heats.length === 0) {
    const start = `${session.date}T${event.daytime ?? session.daytime ?? "00:00"}`;
    if (clock < start) return "scheduled";
    if (clock === start) return "running";
    return "finished";
  }

  const anyRunning = heats.some((heat) => heat.state === "running");
  const allFinished = heats.every((heat) => heat.state === "finished");
  const anyFinished = heats.some((heat) => heat.state === "finished");

  if (allFinished) return "finished";
  if (anyRunning || anyFinished) return "running";
  return "scheduled";
}
