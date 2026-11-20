import { useState } from "react";
import type { Meet } from "./meet";
import { MeetScreen } from "./ui/MeetScreen";
import { OpenMeetScreen } from "./ui/OpenMeetScreen";

export function App() {
  const [meet, setMeet] = useState<Meet | null>(null);

  return (
    <main className="page">
      {meet ? (
        <MeetScreen meet={meet} onOpenAnother={() => setMeet(null)} />
      ) : (
        <OpenMeetScreen onOpened={setMeet} />
      )}
    </main>
  );
}
