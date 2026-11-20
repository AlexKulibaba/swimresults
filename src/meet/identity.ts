import type { Meet, Swimmer } from "./model";

/** Identifies a swimmer across meets: by license when the file has one, else by name, Jahrgang and club. */
export type SwimmerKey = string;

export function swimmerKey(swimmer: Swimmer): SwimmerKey {
  return swimmer.license
    ? `license:${swimmer.license}`
    : `name:${swimmer.lastName}|${swimmer.firstName}|${swimmer.jahrgang ?? ""}|${swimmer.club}`;
}

/**
 * The swimmers in this meet with the given key, in file order: none if they don't swim here, and more than one
 * when a meet enters the same person for several clubs (e.g. their club and a federation team).
 */
export function findSwimmers(meet: Meet, key: SwimmerKey): Swimmer[] {
  return meet.swimmers.filter((swimmer) => swimmerKey(swimmer) === key);
}
