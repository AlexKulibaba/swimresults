import { useEffect, useState } from "react";
import type { MeetClock } from "../meet";

/** The meet clock following the device's real time, refreshed every 30 seconds. */
export function useMeetClock(): MeetClock {
  const [clock, setClock] = useState(now);

  useEffect(() => {
    const timer = setInterval(() => setClock(now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return clock;
}

function now(): MeetClock {
  const date = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
