/** Wraps hand-made LENEX snippets in a minimal meet so tests only spell out what they care about. */
export function lenexMeet({ sessions, clubs }: { sessions: string; clubs: string }): Uint8Array {
  return new TextEncoder().encode(`<?xml version="1.0" encoding="UTF-8"?>
<LENEX version="3.0">
  <MEETS>
    <MEET name="Testmeet" city="Teststadt" course="SCM">
      <SESSIONS>${sessions}</SESSIONS>
      <CLUBS>${clubs}</CLUBS>
    </MEET>
  </MEETS>
</LENEX>`);
}

/** One session with a single 100m freestyle prelim and one heat, enough for tests about swimmers rather than the schedule. */
export const oneEventSession = `
  <SESSION number="1" date="2026-11-12" daytime="09:00">
    <EVENTS>
      <EVENT eventid="1" number="1" gender="F" round="PRE" order="1">
        <SWIMSTYLE name="100m Freistil weiblich (Vorlauf)" stroke="FREE" relaycount="1" distance="100" />
        <HEATS><HEAT heatid="101" number="1" daytime="09:00" /></HEATS>
      </EVENT>
    </EVENTS>
  </SESSION>`;
