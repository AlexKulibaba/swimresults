import type { Meet, MeetEvent } from "./model";
import type { MeetClock } from "./schedule";

// Finals are linked to prelims by what is swum (gender, stroke, distance), never by event numbering, which differs
// between meets.

/** The finals that follow a prelim: same style, after it, and before any later prelim of the same style. */
export function finalsOf(meet: Meet, prelim: MeetEvent): MeetEvent[] {
  const nextPrelim = sameStyle(meet, prelim).find((event) => event.round === "PRE" && isAfter(meet, event, prelim));
  return sameStyle(meet, prelim).filter(
    (event) =>
      event.round === "FIN" && isAfter(meet, event, prelim) && (!nextPrelim || isAfter(meet, nextPrelim, event)),
  );
}

/** The prelim a final follows: the latest prelim of the same style before it. */
export function prelimOf(meet: Meet, final: MeetEvent): MeetEvent | null {
  return (
    sameStyle(meet, final)
      .filter((event) => event.round === "PRE" && isAfter(meet, final, event))
      .at(-1) ?? null
  );
}

/** A prelim is over, and its finals are set, once its last heat has started. */
export function prelimIsOver(meet: Meet, prelim: MeetEvent, clock: MeetClock): boolean {
  const session = meet.sessions.find((candidate) => candidate.number === prelim.session);
  const lastHeat = prelim.heats.at(-1);
  const time = lastHeat?.daytime ?? prelim.daytime ?? session?.daytime ?? "00:00";
  return `${session?.date}T${time}` < clock;
}

function sameStyle(meet: Meet, event: MeetEvent): MeetEvent[] {
  return meet.events
    .filter(
      (candidate) =>
        candidate.gender === event.gender && candidate.stroke === event.stroke && candidate.distance === event.distance,
    )
    .sort((a, b) => startKey(meet, a).localeCompare(startKey(meet, b)));
}

function isAfter(meet: Meet, event: MeetEvent, other: MeetEvent): boolean {
  return startKey(meet, event) > startKey(meet, other);
}

/** Sorts events in schedule order: by date, session and position in the session. */
function startKey(meet: Meet, event: MeetEvent): string {
  const date = meet.sessions.find((session) => session.number === event.session)?.date ?? "";
  return `${date}|${String(event.session).padStart(4, "0")}|${String(event.order).padStart(4, "0")}`;
}
