import { describe, expect, it } from "vitest";
import { parseRoute, parseScrollY, routeToUrl, withScrollHash, type Route } from "./router";

describe("router", () => {
  const cases: Route[] = [
    { kind: "home" },
    { kind: "events" },
    { kind: "heats", eventId: "12" },
    { kind: "heat", eventId: "12", heatId: "10001" },
    { kind: "swimmer", swimmerId: "42" },
    { kind: "club", clubName: "SG Neukölln e.V. Berlin" },
    { kind: "swim", swimmerId: "42", eventId: "12" },
    { kind: "pick-comparison", first: { swimmerId: "42", eventId: "12" } },
    { kind: "comparison", first: { swimmerId: "42", eventId: "12" }, second: { swimmerId: "99", eventId: "12" } },
  ];

  it("round-trips every route cleanly", () => {
    for (const route of cases) {
      const url = routeToUrl(route);
      const parsed = new URL(url, "http://localhost");
      expect(parseRoute(parsed.pathname, parsed.search)).toEqual(route);
    }
  });

  it("falls back to home for unknown paths", () => {
    expect(parseRoute("/unknown/path")).toEqual({ kind: "home" });
  });

  it("encodes and parses scroll position in the URL hash", () => {
    expect(withScrollHash("/events", 0)).toBe("/events");
    expect(withScrollHash("/events", 420.4)).toBe("/events#y=420");
    expect(withScrollHash("/events#y=100", 250)).toBe("/events#y=250");
    expect(withScrollHash("/events#y=100", 0)).toBe("/events");
    expect(parseScrollY("#y=420")).toBe(420);
    expect(parseScrollY("")).toBe(0);
    expect(parseScrollY("#other")).toBe(0);
  });
});
