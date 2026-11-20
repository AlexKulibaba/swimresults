import { useState } from "react";
import type { Meet } from "./meet";
import { MeetSummaryView } from "./ui/MeetSummaryView";
import { OpenMeetScreen } from "./ui/OpenMeetScreen";

export function App() {
  const [meet, setMeet] = useState<Meet | null>(null);

  return (
    <main className="page">
      {meet ? (
        <MeetSummaryView summary={meet.summary} onOpenAnother={() => setMeet(null)} />
      ) : (
        <OpenMeetScreen onOpened={setMeet} />
      )}
    </main>
  );
}
