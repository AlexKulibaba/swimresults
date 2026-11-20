import { findSwimmer, type SwimmerKey } from "./identity";
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
  me: { swimmer: Swimmer; swims: SwimmerSwim[] } | null;
  /**
   * Swims of followed swimmers, and swims for followed clubs, without my own: upcoming ones in start order, or,
   * once all are done, the latest first. Null when none of them swims at this meet.
   */
  followed: { mode: "next" | "latest"; swims: SwimmerSwim[] } | null;
}

export function homePage(meet: Meet, follows: Follows, clock: MeetClock): HomePage {
  const me = follows.me ? findSwimmer(meet, follows.me) : null;
  const followedSwimmers = follows.swimmers.flatMap((key) => findSwimmer(meet, key) ?? []);
  const swimmers = meet.swimmers.filter(
    (swimmer) =>
      swimmer !== me &&
      (followedSwimmers.includes(swimmer) || swimmer.clubs.some((club) => follows.clubs.includes(club))),
  );
  const swims = swimsOf(meet, swimmers, clock).filter(
    (swim) => followedSwimmers.includes(swim.swimmer) || follows.clubs.includes(swim.club),
  );

  return {
    me: me ? { swimmer: me, swims: swimsOf(meet, [me], clock) } : null,
    followed: followedSwims(swims),
  };
}

function followedSwims(swims: SwimmerSwim[]): HomePage["followed"] {
  if (swims.length === 0) return null;
  const upcoming = swims.filter((swim) => swim.phase !== "done");
  return upcoming.length > 0
    ? { mode: "next", swims: upcoming }
    : { mode: "latest", swims: swims.filter((swim) => swim.phase === "done").reverse() };
}
