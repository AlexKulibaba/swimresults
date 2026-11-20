import { useState } from "react";
import type { Meet } from "../meet";
import { MeetSummaryView } from "./MeetSummaryView";
import { SwimmerScheduleView } from "./SwimmerScheduleView";
import { SwimmerSearch } from "./SwimmerSearch";
import { useMeetClock } from "./useMeetClock";

interface Props {
  meet: Meet;
  onRemove: () => void;
}

export function MeetScreen({ meet, onRemove }: Props) {
  const clock = useMeetClock();
  const [swimmerId, setSwimmerId] = useState<string | null>(null);

  if (swimmerId) {
    return <SwimmerScheduleView meet={meet} swimmerId={swimmerId} clock={clock} onBack={() => setSwimmerId(null)} />;
  }

  return (
    <div className="stack">
      <MeetSummaryView summary={meet.summary} onRemove={onRemove} />
      <SwimmerSearch meet={meet} onSelect={setSwimmerId} />
    </div>
  );
}
