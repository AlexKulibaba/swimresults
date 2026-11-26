import { describe, expect, it } from "vitest";
import { rankTier, shortGroupLabel } from "./PlacementDisplay";

describe("PlacementDisplay helpers", () => {
  it("classifies rank tiers for metallic podium, top-8, and other finishes", () => {
    expect(rankTier(1)).toBe("gold");
    expect(rankTier(2)).toBe("silver");
    expect(rankTier(3)).toBe("bronze");
    expect(rankTier(4)).toBe("top8");
    expect(rankTier(8)).toBe("top8");
    expect(rankTier(9)).toBe("other");
  });

  it("always uses neutral non-metallic tier for seed placements (prelims with finals)", () => {
    expect(rankTier(1, false)).toBe("other");
    expect(rankTier(2, false)).toBe("other");
    expect(rankTier(3, false)).toBe("other");
    expect(rankTier(8, false)).toBe("other");
    expect(rankTier(9, false)).toBe("other");
  });

  it("compacts verbose German LENEX scoring group names", () => {
    expect(shortGroupLabel("Offene Wertung")).toBe("Offen");
    expect(shortGroupLabel("Jahrgang 2006")).toBe("Jg 06");
    expect(shortGroupLabel("Jahrgang 2008 und älter")).toBe("Jg ≤08");
    expect(shortGroupLabel("Jahrgang 2014 bis 2018")).toBe("Jg 14–18");
    expect(shortGroupLabel("U23-Wertung")).toBe("U23");
  });
});
