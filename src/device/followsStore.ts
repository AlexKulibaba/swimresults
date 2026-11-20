import type { Follows, SwimmerKey } from "../meet";
import type { DeviceStorage } from "./storage";

const FOLLOWS = "follows";

const nobody: Follows = { me: null, swimmers: [], clubs: [] };

/** "Me" and the swimmers and clubs a person follows, kept on this device across meets. Each change returns the new follows. */
export interface FollowsStore {
  load(): Promise<Follows>;
  followSwimmer(key: SwimmerKey): Promise<Follows>;
  unfollowSwimmer(key: SwimmerKey): Promise<Follows>;
  followClub(name: string): Promise<Follows>;
  unfollowClub(name: string): Promise<Follows>;
  setMe(key: SwimmerKey | null): Promise<Follows>;
}

export function createFollowsStore(storage: DeviceStorage): FollowsStore {
  async function load(): Promise<Follows> {
    try {
      const stored = await storage.get(FOLLOWS);
      return isFollows(stored) ? stored : nobody;
    } catch {
      return nobody;
    }
  }

  async function change(update: (follows: Follows) => Follows): Promise<Follows> {
    const follows = update(await load());
    await storage.set(FOLLOWS, follows);
    return follows;
  }

  const add = (list: string[], item: string) => (list.includes(item) ? list : [...list, item]);
  const without = (list: string[], item: string) => list.filter((entry) => entry !== item);

  return {
    load,
    followSwimmer: (key) => change((follows) => ({ ...follows, swimmers: add(follows.swimmers, key) })),
    unfollowSwimmer: (key) => change((follows) => ({ ...follows, swimmers: without(follows.swimmers, key) })),
    followClub: (name) => change((follows) => ({ ...follows, clubs: add(follows.clubs, name) })),
    unfollowClub: (name) => change((follows) => ({ ...follows, clubs: without(follows.clubs, name) })),
    setMe: (key) => change((follows) => ({ ...follows, me: key })),
  };
}

function isFollows(value: unknown): value is Follows {
  const candidate = value as Follows | null;
  const isStringList = (list: unknown) => Array.isArray(list) && list.every((item) => typeof item === "string");
  return (
    typeof candidate === "object" &&
    candidate !== null &&
    (candidate.me === null || typeof candidate.me === "string") &&
    isStringList(candidate.swimmers) &&
    isStringList(candidate.clubs)
  );
}
