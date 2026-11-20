import type { Meet, Swimmer } from "./model";

/** Identifies a swimmer across meets: by license when the file has one, else by name, Jahrgang and club. */
export type SwimmerKey = string;

export function swimmerKey(swimmer: Swimmer): SwimmerKey {
  return swimmer.license
    ? `license:${swimmer.license}`
    : `name:${swimmer.lastName}|${swimmer.firstName}|${swimmer.jahrgang ?? ""}|${swimmer.clubs[0] ?? ""}`;
}

/** The swimmer in this meet with the given key, or null if they don't swim here. */
export function findSwimmer(meet: Meet, key: SwimmerKey): Swimmer | null {
  return meet.swimmers.find((swimmer) => swimmerKey(swimmer) === key) ?? null;
}
