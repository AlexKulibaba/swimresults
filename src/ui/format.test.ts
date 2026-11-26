import { describe, expect, it } from "vitest";
import { EMPTY_TIME, formatDifference, formatEventName, formatReactionTime, formatSwimTime, statusCode } from "./format";

describe("PDF time formatting", () => {
  it("formats swim times as MM:SS,hh with leading zero minutes", () => {
    expect(formatSwimTime(6653)).toBe("01:06,53");
    expect(formatSwimTime(2715)).toBe("00:27,15");
    expect(formatSwimTime(6000)).toBe("01:00,00");
    expect(formatSwimTime(105)).toBe("00:01,05");
  });

  it("formats durations of an hour or more with hours prefix", () => {
    expect(formatSwimTime(366105)).toBe("1:01:01,05");
  });

  it("exposes the official PDF empty time placeholder", () => {
    expect(EMPTY_TIME).toBe("--:--,--");
  });

  it("formats differences and reaction times with a German comma", () => {
    expect(formatDifference(-123)).toBe("−1,23");
    expect(formatDifference(18)).toBe("+0,18");
    expect(formatDifference(6233)).toBe("+1:02,33");
    expect(formatReactionTime(61)).toBe("+0,61 s");
    expect(formatReactionTime(-3)).toBe("−0,03 s");
  });

  it("strips redundant round suffixes from event names while keeping specific finals", () => {
    expect(formatEventName("200m Schmetterling weiblich (Vorlauf)")).toBe("200m Schmetterling weiblich");
    expect(formatEventName("100m Freistil weiblich (Finale)")).toBe("100m Freistil weiblich");
    expect(formatEventName("200m Schmetterling weiblich (B-Finale)")).toBe("200m Schmetterling weiblich (B-Finale)");
  });

  it("maps swim statuses to compact indicators", () => {
    expect(statusCode("DSQ")).toBe("DQ");
    expect(statusCode("DNS")).toBe("DNS");
    expect(statusCode("WDR")).toBe("WDR");
    expect(statusCode("DNF")).toBe("DNF");
  });
});
