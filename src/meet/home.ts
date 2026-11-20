import { findSwimmers, type SwimmerKey } from "./identity";
import type { Meet, Swimmer } from "./model";
import { swimsOf, type MeetClock, type SwimmerSwim } from "./schedule";

/** Who a person follows, kept across meets. */
export interface Follows {
  /** The swimmer the person selected as themselves (swimmer mode), if any. */
  me: SwimmerKey | null;
  swimmers: SwimmerKey[];
  /** Club names. */
  clubs: string[];
}

export interface HomePage {
  /** Swimmer mode: my swims in start order, with my next swim marked; null when "me" doesn't swim here. */
  me: { swimmers: Swimmer[]; swims: SwimmerSwim[] } | null;
  /**
   * Swims of followed swimmers and members of followed clubs, without my own: upcoming ones in start order, or,
   * once all are done, the latest first. Null when none of them swims at this meet.
   */
  followed: { mode: "next" | "latest"; swims: SwimmerSwim[] } | null;
}

export function homePage(meet: Meet, follows: Follows, clock: MeetClock): HomePage {
  const me = follows.me ? findSwimmers(meet, follows.me) : [];
  const followed = meet.swimmers.filter(
    (swimmer) =>
      !me.includes(swimmer) &&
      (follows.clubs.includes(swimmer.club) || follows.swimmers.some((key) => findSwimmers(meet, key).includes(swimmer))),
  );

  return { me: me.length > 0 ? mySwims(meet, me, clock) : null, followed: followedSwims(meet, followed, clock) };
}

/** Someone entered for several clubs still has a single next swim. */
function mySwims(meet: Meet, me: Swimmer[], clock: MeetClock): NonNullable<HomePage["me"]> {
  const swims: SwimmerSwim[] = swimsOf(meet, me, clock).map((swim) => ({
    ...swim,
    phase: swim.phase === "next" ? "later" : swim.phase,
  }));
  const next = swims.find((swim) => swim.phase === "later" && swim.status === null);
  if (next) next.phase = "next";
  return { swimmers: me, swims };
}

function followedSwims(meet: Meet, swimmers: Swimmer[], clock: MeetClock): HomePage["followed"] {
  if (swimmers.length === 0) return null;
  const swims = swimsOf(meet, swimmers, clock);
  const upcoming = swims.filter((swim) => swim.phase !== "done");
  return upcoming.length > 0
    ? { mode: "next", swims: upcoming }
    : { mode: "latest", swims: swims.filter((swim) => swim.phase === "done").reverse() };
}
