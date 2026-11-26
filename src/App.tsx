import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFollowsStore } from "./device/followsStore";
import { createMeetLibrary } from "./device/meetLibrary";
import { indexedDbStorage } from "./device/indexedDbStorage";
import type { Meet } from "./meet";
import { FollowsProvider } from "./ui/follows";
import { MeetScreen } from "./ui/MeetScreen";
import { OpenMeetScreen } from "./ui/OpenMeetScreen";
import { ThemeToggle } from "./ui/ThemeToggle";

const DevAgentation = import.meta.env.DEV
  ? lazy(() => import("agentation").then((mod) => ({ default: mod.Agentation })))
  : null;

const DevComponents = import.meta.env.DEV
  ? lazy(() => import("./ui/DevComponentsPage").then((mod) => ({ default: mod.DevComponentsPage })))
  : null;

export function App() {
  const isDevComponents = import.meta.env.DEV && window.location.pathname === "/dev/components";
  const storage = useMemo(() => indexedDbStorage(), []);
  const library = useMemo(() => createMeetLibrary(storage), [storage]);
  const followsStore = useMemo(() => createFollowsStore(storage), [storage]);
  const [meet, setMeet] = useState<Meet | null | "restoring">("restoring");

  useEffect(() => {
    if (isDevComponents) return;
    void library.restore().then(setMeet);
  }, [library, isDevComponents]);

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
        <div className="page__toolbar">
          <ThemeToggle />
        </div>
        {isDevComponents && DevComponents ? (
          <Suspense fallback={null}>
            <DevComponents />
          </Suspense>
        ) : meet === "restoring" ? null : meet ? (
          <MeetScreen meet={meet} onRemove={remove} />
        ) : (
          <OpenMeetScreen onOpen={open} />
        )}
      </main>
      {DevAgentation && (
        <Suspense fallback={null}>
          <DevAgentation />
        </Suspense>
      )}
    </FollowsProvider>
  );
}
