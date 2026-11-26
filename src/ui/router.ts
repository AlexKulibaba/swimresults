import { useCallback, useEffect, useState } from "react";
import type { SwimRef } from "../meet";

export type Route =
  | { kind: "home" }
  | { kind: "events" }
  | { kind: "heats"; eventId: string }
  | { kind: "heat"; eventId: string; heatId: string }
  | { kind: "swimmer"; swimmerId: string }
  | { kind: "club"; clubName: string }
  | { kind: "swim"; swimmerId: string; eventId: string }
  | { kind: "pick-comparison"; first: SwimRef }
  | { kind: "comparison"; first: SwimRef; second: SwimRef };

export function routeToUrl(route: Route): string {
  switch (route.kind) {
    case "home":
      return "/";
    case "events":
      return "/events";
    case "heats":
      return `/events/${encodeURIComponent(route.eventId)}`;
    case "heat":
      return `/events/${encodeURIComponent(route.eventId)}/heats/${encodeURIComponent(route.heatId)}`;
    case "swimmer":
      return `/swimmers/${encodeURIComponent(route.swimmerId)}`;
    case "club":
      return `/clubs/${encodeURIComponent(route.clubName)}`;
    case "swim":
      return `/swims/${encodeURIComponent(route.swimmerId)}/${encodeURIComponent(route.eventId)}`;
    case "pick-comparison": {
      const params = new URLSearchParams({
        swimmer: route.first.swimmerId,
        event: route.first.eventId,
      });
      return `/compare/pick?${params.toString()}`;
    }
    case "comparison": {
      const params = new URLSearchParams({
        s1: route.first.swimmerId,
        e1: route.first.eventId,
        s2: route.second.swimmerId,
        e2: route.second.eventId,
      });
      return `/compare?${params.toString()}`;
    }
  }
}

export function parseRoute(pathname: string, search = ""): Route {
  const segments = pathname
    .replace(/^\/+|\/+$/g, "")
    .split("/")
    .filter(Boolean)
    .map((segment) => {
      try {
        return decodeURIComponent(segment);
      } catch {
        return segment;
      }
    });

  const [first, second, third, fourth] = segments;

  if (!first) return { kind: "home" };
  if (first === "events") {
    if (!second) return { kind: "events" };
    if (third === "heats" && fourth) return { kind: "heat", eventId: second, heatId: fourth };
    return { kind: "heats", eventId: second };
  }
  if (first === "swimmers" && second) return { kind: "swimmer", swimmerId: second };
  if (first === "clubs" && second) return { kind: "club", clubName: second };
  if (first === "swims" && second && third) return { kind: "swim", swimmerId: second, eventId: third };

  const params = new URLSearchParams(search);
  if (first === "compare" && second === "pick") {
    const swimmerId = params.get("swimmer");
    const eventId = params.get("event");
    if (swimmerId && eventId) return { kind: "pick-comparison", first: { swimmerId, eventId } };
  }
  if (first === "compare") {
    const s1 = params.get("s1");
    const e1 = params.get("e1");
    const s2 = params.get("s2");
    const e2 = params.get("e2");
    if (s1 && e1 && s2 && e2) {
      return { kind: "comparison", first: { swimmerId: s1, eventId: e1 }, second: { swimmerId: s2, eventId: e2 } };
    }
  }

  return { kind: "home" };
}

export function parseScrollY(hash: string): number {
  const match = hash.match(/^#y=(\d+)$/);
  if (!match) return 0;
  const value = Number(match[1]);
  return Number.isFinite(value) && value >= 0 ? value : 0;
}

export function withScrollHash(url: string, scrollY: number): string {
  const clean = url.split("#")[0] ?? url;
  const rounded = Math.max(0, Math.round(scrollY));
  return rounded > 0 ? `${clean}#y=${rounded}` : clean;
}

function readCurrentRoute(): Route {
  return parseRoute(window.location.pathname, window.location.search);
}

function syncScrollToCurrentUrl() {
  const current = `${window.location.pathname}${window.location.search}`;
  const next = withScrollHash(current, window.scrollY);
  if (next !== `${current}${window.location.hash}`) {
    window.history.replaceState(window.history.state, "", next);
  }
}

/** Browser-history-backed router supporting Back/Forward, reload persistence, and URL scroll position (#y=...). */
export function useRouter() {
  const [route, setRoute] = useState<Route>(readCurrentRoute);

  // Restore scroll position from URL hash on initial mount.
  useEffect(() => {
    const y = parseScrollY(window.location.hash);
    if (y > 0) {
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    }
  }, []);

  // Keep the current URL's #y= hash synced as the user scrolls (debounced).
  useEffect(() => {
    let timer: number | undefined;
    const onScroll = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(syncScrollToCurrentUrl, 150);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  // Handle browser Back/Forward and restore the target entry's #y= scroll position.
  useEffect(() => {
    const onPopState = () => {
      setRoute(readCurrentRoute());
      const y = parseScrollY(window.location.hash);
      requestAnimationFrame(() => window.scrollTo({ top: y }));
    };
    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  const navigate = useCallback((next: Route, { replace = false } = {}) => {
    if (!replace) {
      // Snapshot current scroll position into the history entry we are leaving.
      syncScrollToCurrentUrl();
    }
    const url = routeToUrl(next);
    if (replace) {
      window.history.replaceState(null, "", url);
    } else {
      window.history.pushState(null, "", url);
    }
    setRoute(next);
    window.scrollTo({ top: 0 });
  }, []);

  const back = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate({ kind: "home" }, { replace: true });
    }
  }, [navigate]);

  return { route, navigate, back };
}
