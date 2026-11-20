import type { Meet } from "./model";
import { swimsOf, type MeetClock, type SwimmerSwim } from "./schedule";
import { matchesEveryWord } from "./swimmers";

export interface ClubHit {
  name: string;
  swimmerCount: number;
}

export interface ClubSchedule {
  club: ClubHit;
  /** Members' swims that are next or later, in start order. */
  upcoming: SwimmerSwim[];
  /** Members' swims that are done, latest first. */
  completed: SwimmerSwim[];
}

/** Clubs whose name contains every word of the query, ignoring case and accents. */
export function searchClubs(meet: Meet, query: string): ClubHit[] {
  return meet.clubs
    .filter((club) => matchesEveryWord(club.name, query))
    .map((club) => clubHit(meet, club.name))
    .sort((a, b) => a.name.localeCompare(b.name, "de"));
}

export function clubSchedule(meet: Meet, clubName: string, clock: MeetClock): ClubSchedule | null {
  if (!meet.clubs.some((club) => club.name === clubName)) return null;

  const swims = swimsOf(
    meet,
    meet.swimmers.filter((swimmer) => swimmer.club === clubName),
    clock,
  );

  return {
    club: clubHit(meet, clubName),
    upcoming: swims.filter((swim) => swim.phase !== "done"),
    completed: swims.filter((swim) => swim.phase === "done").reverse(),
  };
}

function clubHit(meet: Meet, name: string): ClubHit {
  return { name, swimmerCount: meet.swimmers.filter((swimmer) => swimmer.club === name).length };
}
