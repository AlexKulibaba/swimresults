import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { FollowsStore } from "../device/followsStore";
import type { Follows } from "../meet";

interface FollowsContextValue {
  follows: Follows;
  /** Runs a change on the store and shows its result. */
  change: (action: (store: FollowsStore) => Promise<Follows>) => void;
}

const FollowsContext = createContext<FollowsContextValue | null>(null);

export function FollowsProvider({ store, children }: { store: FollowsStore; children: ReactNode }) {
  const [follows, setFollows] = useState<Follows>({ me: null, swimmers: [], clubs: [] });

  useEffect(() => {
    void store.load().then(setFollows);
  }, [store]);

  const change: FollowsContextValue["change"] = (action) => void action(store).then(setFollows);

  return <FollowsContext.Provider value={{ follows, change }}>{children}</FollowsContext.Provider>;
}

export function useFollows(): FollowsContextValue {
  const value = useContext(FollowsContext);
  if (!value) throw new Error("useFollows needs a FollowsProvider");
  return value;
}
