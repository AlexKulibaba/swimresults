import { useEffect, useState } from "react";

export type ThemePreference = "system" | "light" | "dark";

const STORAGE_KEY = "swimresults-theme";

function readInitialTheme(): ThemePreference {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") return saved;
  } catch {
    // ignore storage errors
  }
  return "system";
}

function applyTheme(pref: ThemePreference) {
  const root = document.documentElement;
  if (pref === "system") {
    root.removeAttribute("data-theme");
  } else {
    root.setAttribute("data-theme", pref);
  }
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(readInitialTheme);

  useEffect(() => {
    applyTheme(theme);
    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // ignore storage errors
    }
  }, [theme]);

  const cycle = () => {
    setTheme((current) => (current === "system" ? "dark" : current === "dark" ? "light" : "system"));
  };

  const label = theme === "system" ? "Auto" : theme === "dark" ? "Dark" : "Light";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycle}
      title="Farbschema umschalten (Auto / Dark / Light)"
      aria-label={`Farbschema: ${label}`}
    >
      <span aria-hidden="true">{theme === "dark" ? "☾" : theme === "light" ? "☀" : "◐"}</span>
      <span>{label}</span>
    </button>
  );
}
