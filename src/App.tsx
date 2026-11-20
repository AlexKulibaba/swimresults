import { useEffect, useMemo, useState } from "react";
import { createFollowsStore } from "./device/followsStore";
import { createMeetLibrary } from "./device/meetLibrary";
import { indexedDbStorage } from "./device/indexedDbStorage";
import type { Meet } from "./meet";
import { FollowsProvider } from "./ui/follows";
import { MeetScreen } from "./ui/MeetScreen";
import { OpenMeetScreen } from "./ui/OpenMeetScreen";

export function App() {
  const storage = useMemo(() => indexedDbStorage(), []);
  const library = useMemo(() => createMeetLibrary(storage), [storage]);
  const followsStore = useMemo(() => createFollowsStore(storage), [storage]);
  const [meet, setMeet] = useState<Meet | null | "restoring">("restoring");

  useEffect(() => {
    void library.restore().then(setMeet);
  }, [library]);

  async function open(bytes: Uint8Array) {
    const result = await library.open(bytes);
    if (result.ok) setMeet(result.meet);
    return result;
  }

  async function remove() {
    await library.remove();
    setMeet(null);
  }

  return (
    <FollowsProvider store={followsStore}>
      <main className="page">
        {meet === "restoring" ? null : meet ? (
          <MeetScreen meet={meet} onRemove={remove} />
        ) : (
          <OpenMeetScreen onOpen={open} />
        )}
      </main>
    </FollowsProvider>
  );
}
