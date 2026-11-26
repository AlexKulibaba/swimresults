import { describe, expect, test } from "vitest";
import { eventsBySession, openMeet, type Meet } from "./index";
import { lenexMeet } from "./testing/lenexFixture";

function open(bytes: Uint8Array): Meet {
  const result = openMeet(bytes);
  if (!result.ok) throw new Error(`expected the meet to open, got: ${result.error}`);
  return result.meet;
}

const meet = open(
  lenexMeet({
    sessions: `
      <SESSION number="1" date="2026-11-12" daytime="09:00">
        <EVENTS>
          <EVENT eventid="1" number="1" gender="F" round="PRE" order="1" daytime="09:00">
            <SWIMSTYLE name="100m Freistil" stroke="FREE" relaycount="1" distance="100" />
            <HEATS>
              <HEAT heatid="h11" number="1" daytime="09:00" />
              <HEAT heatid="h12" number="2" daytime="09:03" />
            </HEATS>
          </EVENT>
          <EVENT eventid="2" number="2" gender="M" round="TIM" order="2" daytime="09:10">
            <SWIMSTYLE name="50m Brust" stroke="BREAST" relaycount="1" distance="50" />
            <HEATS>
              <HEAT heatid="h21" number="1" daytime="09:10" />
              <HEAT heatid="h22" number="2" daytime="09:12" />
              <HEAT heatid="h23" number="3" daytime="09:14" />
            </HEATS>
          </EVENT>
        </EVENTS>
      </SESSION>
      <SESSION number="2" date="2026-11-12" daytime="15:00">
        <EVENTS>
          <EVENT eventid="3" number="3" gender="F" round="FIN" order="1" daytime="15:00">
            <SWIMSTYLE name="100m Freistil" stroke="FREE" relaycount="1" distance="100" />
            <HEATS>
              <HEAT heatid="h31" number="1" daytime="15:00" />
            </HEATS>
          </EVENT>
        </EVENTS>
      </SESSION>`,
    clubs: "",
  }),
);

describe("eventsBySession", () => {
  test("groups events by session in schedule order", () => {
    const grouped = eventsBySession(meet, "2026-11-12T08:00");

    expect(grouped.map((g) => ({ session: g.session.number, events: g.events.map((e) => e.number) }))).toEqual([
      { session: 1, events: [1, 2] },
      { session: 2, events: [3] },
    ]);
  });

  test("marks finished, running, and scheduled heats and events relative to the meet clock", () => {
    const grouped = eventsBySession(meet, "2026-11-12T09:12");
    const wk1 = grouped[0]?.events[0];
    const wk2 = grouped[0]?.events[1];
    const wk3 = grouped[1]?.events[0];

    expect(wk1?.state).toBe("finished");
    expect(wk1?.heats.map((h) => `${h.number}:${h.state}`)).toEqual(["1:finished", "2:finished"]);
    expect(wk1?.finishedHeats).toBe(2);

    expect(wk2?.state).toBe("running");
    expect(wk2?.heats.map((h) => `${h.number}:${h.state}`)).toEqual(["1:finished", "2:running", "3:scheduled"]);
    expect(wk2?.finishedHeats).toBe(1);

    expect(wk3?.state).toBe("scheduled");
    expect(wk3?.heats.map((h) => `${h.number}:${h.state}`)).toEqual(["1:scheduled"]);
  });

  test("treats the last heat of a session as running during its start minute and finished after", () => {
    const during = eventsBySession(meet, "2026-11-12T15:00")[1]?.events[0];
    expect(during?.state).toBe("running");
    expect(during?.heats[0]?.state).toBe("running");

    const after = eventsBySession(meet, "2026-11-12T15:01")[1]?.events[0];
    expect(after?.state).toBe("finished");
    expect(after?.heats[0]?.state).toBe("finished");
  });
});
