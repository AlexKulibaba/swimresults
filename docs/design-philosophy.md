# Swimresults — UX & Design Philosophy

Swimresults is a **precision tool** for following a swim meet on deck, in the stands, or on replay. Every design choice serves fast, calm scanning under meet-day pressure — inspired by **Flighty** (instrument-grade hierarchy, matte surfaces, signal-only color), **Swimcloud** (analytical density), and **official German swim-meet PDFs** (*Meldeergebnis* & *Protokoll*, so swimmers and coaches recognize the structure in 100 ms).

---

## 1. Core Principles

1. **It is a tool, not a marketing page.**
   Pack high information density into clean, scannable components. Avoid prose, filler labels, and decorative flourishes.
2. **Official PDF familiarity, made interactive.**
   Layouts, column ordering, and time notation mirror official German *Meldeergebnis* / *Protokoll* PDFs (`01:06,53`, `--:--,--`, `WK`, `Bahn · Name · Jg. · Verein · Meldezeit`, grouped by *Abschnitt*), while adding live state, drill-down navigation, and meet-clock awareness.
3. **Stable alignment over fluid wrapping.**
   Columns, badges, times, and event numbers live in fixed, predictable tracks so nothing shifts horizontally from row to row — especially on 393 px mobile viewports.
4. **Ration color strictly to meaning.**
   ~90% of the interface is monochrome (ink, secondary ink, muted ink, matte surfaces). Saturated color is reserved exclusively for signals:
   - **Blue (`--accent`)** — interactive affordance, your next upcoming start, top-8 / final-qualifying seed.
   - **Amber (`--live`)** — live / currently in the water (with subtle pulse), `Finale` round badge.
   - **Green (`--faster`)** — faster than entry/prelim time.
   - **Red (`--error`)** — slower delta and non-finish status codes (`DQ`, `DNS`, `WDR`, `DNF`).
   - **Metallic Gold / Silver / Bronze / Top 8** — **strictly** in final/medal rounds (finals and timed finals). 9+ and prelim seed placements (`awardsMedals === false`) are always flat matte neutral.
5. **Respect the meet clock and replay mode everywhere.**
   Nothing leaks before it is knowable at the active meet clock. Before a start, only entry data and `WDR` are shown; results appear once a heat finishes; final placements and final qualification appear only once the full event is over.

---

## 2. Visual System & Surfaces

- **Automatic Light & Dark mode** (`prefers-color-scheme`), with an explicit user override toggle (`Auto / Dark / Light` via `data-theme`).
  - **Light:** soft off-white canvas (`#f2f2f7`), crisp white elevated cards (`#ffffff`), translucent hairlines (`rgba(15, 23, 42, 0.09)`), whisper shadows.
  - **Dark:** true-dark obsidian canvas (`#050608`), matte elevated cards (`#12151c`), translucent hairlines (`rgba(255, 255, 255, 0.085)`), subtle top inner highlight.
- **Concentric radii:** `16px` cards/day blocks (`--radius-lg`), `10px` controls (`--radius-md`), `6px` badges/cubes/keycaps (`--radius-sm`).
- **No gradients on rows or cards.** Use crisp borders, surface elevation, and left-column anchors to communicate state — gradients are reserved solely for brushed metallic medal plates.
- **Typography & numerals:**
  - Every time, rank, lane, heat, and date uses tabular numerals (`font-variant-numeric: tabular-nums`, `.num` / `.mono`).
  - **German PDF time format:** `MM:SS,hh` with comma and leading zero minutes (`01:06,53`, `00:27,15`), `--:--,--` when pending, `−1,23` / `+0,18` for deltas.
  - **Compact status indicators:** `DQ`, `DNS`, `WDR`, `DNF` (never full sentences inline; keep full German text in `title` / `aria-label`).
  - **Clean event names:** strip redundant trailing round suffixes like `(Vorlauf)` / `(Finale)` when the round badge is already shown; preserve specific final names like `(A-Finale)` / `(B-Finale)`.

---

## 3. Information Architecture & Core Views

URL-backed browser history routing (`/`, `/events`, `/events/:eventId`, `/events/:eventId/heats/:heatId`, `/swimmers/:id`, `/clubs/:name`, `/swims/:swimmerId/:eventId`, `/compare`) with scroll position preserved in `#y=<px>` across Back/Forward and reloads.

### Home Page (`/`)
- **Meet Header:** clickable card showing meet name, city, and event count → navigates to **Events (WKs) view**.
- **Search bar:** always directly accessible for swimmers and clubs.
- **Swimmer Mode — `Meine Starts` (`MyStartsCard`):**
  - Flighty-inspired top header: bold `Meine Starts` title + circular **Share** button + **Initials avatar** (opens own swimmer profile).
  - Grouped into **one card per day** (`.day-block` with compact day header `Do., 12.11.`), with combined chronological rows inside each day (sorted by start time, no `Anstehend` / `Beendet` separator banners).
  - **Left column = state** (no dimming/muting of finished swims):
    - **Scheduled / upcoming:** countdown (`18 MIN`, `2 STD`, `1 TAG`) or `? QUALI`. Your **next** start highlights the left cell with a saturated `--accent` border and soft `--accent-soft` fill.
    - **Finished (medal round):** flush metallic split-cap (`1 | OFFEN`, `2 | JG 06`, `3 | JG 08`) for Gold / Silver / Bronze and anodized blue for 4–8; flat matte neutral for 9+.
    - **Finished (prelim with final):** flat matte neutral `SEED` cap (never metallic, never Gold/Silver/Bronze).
    - **Status:** compact red status cap (`DQ`, `DNS`, `WDR`, `DNF`).
  - **Right column = prominent independent time column:** large bold result + green/red delta (or `Meldezeit` when upcoming), vertically centered and independent of left text wrapping.
  - **Single-open accordion:** clicking a row expands details (Abschnitt, Meldezeit, Lauf/Bahn, full `PlacementDisplay`, `EntryRankDisplay`, and `Lauf X ansehen →` / `Startdetails →`).
- **Followed Sections (`Letzte Ergebnisse` & `Nächste Starts`):**
  - Both recent results and upcoming swims are surfaced (not mutually exclusive).
  - Grouped into **one card per day** (`.day-block`), with flush left placement caps (`ResultCardRow`) for results and compact accordion rows (`SwimAccordionRow`) for upcoming starts.

### Events / WKs View (`/events`)
- Grouped by **Abschnitt** (session) with date and start time headers.
- Completed events are muted; the active event is highlighted and displays **N small numbered heat cubes** wrapping cleanly across rows, each colored by heat state (`finished` / `running` / `scheduled`) and clickable straight into its Heat detail page.
- Clicking an event opens its **Heats view**.

### Heats View (`/events/:eventId`)
- Interactive **PDF *Meldeergebnis***: one block per heat (`Lauf X / Y · ca. HH:MM Uhr` + state pill) with a `table-layout: fixed` lane table (`Bahn · Name · Jg. · Verein · Meldezeit/Ergebnis`) so columns stay rock-solid across heat blocks and narrow mobile widths.
- Uniform `1px` borders on running heat blocks (`border-color: var(--live)`).
- Clicking a heat block opens its **Heat detail page**.

### Heat Detail Page (`/events/:eventId/heats/:heatId`)
- Handles **scheduled**, **running**, and **finished** heats cleanly.
- Prev/next heat navigation (`← Lauf X-1` / `Alle Läufe` / `Lauf X+1 →`).
- Lane-by-lane analytical rows: lane badge, swimmer + Jahrgang + club, compact `PlacementDisplay` (when finished), compact `EntryRankDisplay`, reaction time (`RT`), delta to entry time, and stacked entry/result times on the right.
- Clicking a finished lane opens `SwimDetailView` (splits, comparison).

---

## 4. Signature Dense Components

- **`PlacementDisplay`** (`src/ui/PlacementDisplay.tsx`): split-keycap (`[ 1 | JG 06 ]`, `[ 3 | OFFEN ]`).
  - **Metallic for final/medal rounds (1–8):** luminous brushed metal plate + engraved deeper metallic numeral for **Gold (1)**, **Silver (2)**, **Bronze (3)**, and anodized blue for **Top 8 (4–8)** when `awardsMedals === true`.
  - **Field (9+) & prelim seed placements (`awardsMedals === false`):** flat matte neutral (no gradient, no bevel), keeping 2nd-place Silver unmistakably distinct and never showing metallic on prelim seeds.
  - Compacts German LENEX group names: `Offene Wertung` → `Offen`, `Jahrgang 2006` → `Jg 06`, `Jahrgang 2008 und älter` → `Jg ≤08`, `Jahrgang 2014 bis 2018` → `Jg 14–18`, `U23-Wertung` → `U23`.
- **`EntryRankDisplay`** (`src/ui/EntryRankDisplay.tsx`): quiet, non-metallic split-keycap counterpart to `PlacementDisplay` (`MELDERANG [ 4/15 | JG 09 ] [ 20/59 | OFFEN ]`), replacing verbose `"Rang nach Meldezeit: 4. von 15 im Jahrgang 2009 · 20. von 59 gesamt"` prose.

---

## 5. Development & Iteration Workflow

- **Component Test Page (`/dev/components`):** dev-only lazy-loaded showcase (`src/ui/DevComponentsPage.tsx`) rendering every component and edge state together with a `393px (iPhone)` / `Full width` toggle and live theme switcher.
- **Visual Feedback (`agentation`):** dev-only toolbar mounted in `src/App.tsx` for clicking elements and capturing exact selectors + notes during iteration.
- **Domain terminology:** follow `GLOSSARY.md` (German UI terms, avoiding ambiguous English/German synonyms).
