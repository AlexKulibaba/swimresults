import type { Meet, Swimmer } from "./model";
import { byStartOrder, scheduleOf, type MeetClock, type OrderedSwim, type ScheduledSwim } from "./schedule";
import { matchesEveryWord } from "./swimmers";

export interface ClubHit {
  name: string;
  swimmerCount: number;
}

export interface ClubSwim extends ScheduledSwim {
  swimmer: Swimmer;
}

export interface ClubSchedule {
  club: ClubHit;
  /** Members' swims that are next or later, in start order. */
  upcoming: ClubSwim[];
  /** Members' swims that are done, latest first. */
  completed: ClubSwim[];
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

  const swims = meet.swimmers
    .filter((swimmer) => swimmer.club === clubName)
    .flatMap((swimmer) =>
      scheduleOf(meet, swimmer.id, clock).map((ordered) => ({ ...ordered, swim: { ...ordered.swim, swimmer } })),
    )
    .sort(byStartOrder) as (OrderedSwim & { swim: ClubSwim })[];

  return {
    club: clubHit(meet, clubName),
    upcoming: swims.filter(({ swim }) => swim.phase !== "done").map(({ swim }) => swim),
    completed: swims
      .filter(({ swim }) => swim.phase === "done")
      .map(({ swim }) => swim)
      .reverse(),
  };
}

function clubHit(meet: Meet, name: string): ClubHit {
  return { name, swimmerCount: meet.swimmers.filter((swimmer) => swimmer.club === name).length };
}
