# DKM 2026 (`dkm2026.swrevent.de`) — Meet Data Sources, Live Feed & Results Visualization

This document explains where the **Deutsche Kurzbahnmeisterschaften im Schwimmen 2026** (Wuppertal, 12–15 Nov 2026) meet data originates, how the website at `https://dkm2026.swrevent.de/` publishes and updates both **official results** and **live timing**, and which machine-readable feeds are available for building a better visualization.

---

## 1. High-Level Architecture

The site is generated and fed by **EasyWk 5** (specifically `EasyWk 5.39 BETA`, registered to Björn Stickan — the DSV meet administration/scoring software, `easywk.de`), hosted on Apache at `dkm2026.swrevent.de`.

There are **two separate, parallel pipelines** on the same host:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Poolside (Wuppertal)                            │
│                                                                         │
│  Omega Timing System (Quantum / Ares21 / OSM6, serial link)             │
│           │                                                             │
│           ▼                                                             │
│      EasyWk 5.39 (Meet management & scoring desktop app)                │
│         │                                         │                     │
│         │ (A) Real-time HTTP push                 │ (B) Direct FTP      │
│         │     on every timing packet              │     upload on event │
│         ▼                                         ▼                     │
└─────────┼─────────────────────────────────────────┼─────────────────────┘
          │                                         │
          ▼                                         ▼
  /livetime/livework.php                    Static artifacts + PHP index
  (password-protected endpoint)             (PDFs, LENEX .lxf, .DSV8z, CSV)
          │                                         │
          ▼                                         ▼
  /livetime/data.php & summary.php          /results.php & /clubs.php
  (server-side PHP state files)             (checks file existence & mtime)
          │                                         │
          ▼                                         ▼
  /livetime/liveview.html                   Browser opens individual PDFs
  ├─ topFrame:    livetime.php  (15s)       or downloads LENEX/DSV8z/CSV
  └─ bottomFrame: livesummary.php (60s)     (page meta-refreshes every 60s)
```

---

## 2. Pipeline A: Official Results & Start Lists (`results.php` & `clubs.php`)

### How it works
1. **Base PHP templates generated once by EasyWk ("Direct FTP Upload")**:
   - EasyWk generates `results.php` and `clubs.php` containing the full schedule of sessions (*Abschnitte*), events (*Wettkämpfe*), and clubs (*Vereine*), plus styling (`easymobil.css`, `results.css`), and uploads them to the web server.
   - `index.php` (`/`) simply links to `clubs.php` ("Vereinsdateien") and `results.php` ("Startlisten & Ergebnisse").
2. **File-existence driven UI**:
   - On every page load, `results.php` checks whether each expected artifact exists on disk on the server.
   - If the file exists, it renders an active button (`<a class="btn btn-default center" target="_blank" href="/...">`) along with the server's file modification timestamp (`<span class="filetime"><br>DD.MM.YYYY HH:MM</span>`).
   - If the file does not exist yet (e.g., before a race finishes, or B-finals that have no separate qualification PDF), it renders a disabled placeholder (`<span class="btn btn-default center inaktiv">...</span>`).
3. **Manual / event-triggered FTP publishing**:
   - During the meet, the scoring desk exports and FTP-uploads artifacts from EasyWk at key milestones:
     - **Before the meet / session**: start lists (`melde_*.pdf`), schedule (`melde_zeitplan.pdf`), entry counts (`melde_anzahl.pdf`), and initial LENEX files.
     - **After each prelim event (once referee signs)**: qualification list (`quali_wkNNN.pdf`) and event protocol (`proto_wkNNN.pdf`).
     - **After each session**: session protocol (`proto_absNNN.pdf`) and session LENEX (`lxf_absNNN.lxf`).
     - **After the meet**: full protocol (`proto_gesamt.pdf`), full LENEX (`lxf_gesamt.lxf`), full DSV8 archive (`*-Pr.DSV8z`), medal table (`proto_meds.pdf`), ENM list (`proto_enm.pdf`), and per-club / per-association exports.
4. **Client "live" refresh**:
   - There is **no JavaScript, WebSocket, or AJAX** on `results.php` or `clubs.php`.
   - `results.php` relies solely on `<meta http-equiv="refresh" content="60" />` to reload the entire HTML page every 60 seconds so newly uploaded PDFs/files appear as clickable buttons.
   - All visual results on `results.php` are **static PDFs** opened in new browser tabs (`target="_blank"`).

### Published Artifacts & URL Patterns

#### Meet-wide files (top of `results.php`)
| Artifact | URL | Format | Notes |
|---|---|---|---|
| Full entry list / start list | `/melde_gesamt.pdf` | PDF | Complete *Meldeergebnis* |
| Entry counts | `/melde_anzahl.pdf` | PDF | *Anzahl Meldungen* |
| Schedule | `/melde_zeitplan.pdf` | PDF | *Zeitplan* |
| Full protocol | `/proto_gesamt.pdf` | PDF | All official results & records |
| **Full LENEX 3.0** | `/lxf_gesamt.lxf` | ZIP containing `.lef` XML | Entries, heats, results, rankings, reaction times, 25m splits |
| **Full DSV8** | `/2026-11-15-Wupperta-Pr.DSV8z` | ZIP containing `.DSV8` text | Official German DSV v8 protocol format |
| Medal table | `/proto_meds.pdf` | PDF | *Medaillenspiegel* |
| ENM list | `/proto_enm.pdf` | PDF | *Erhöhtes Nachträgliches Meldegeld* (scratch/DNS penalties) |

#### Per-session files (`Abschnitt 1`–`8`)
- `/melde_abs001.pdf` … `/melde_abs008.pdf` (session start list)
- `/proto_abs001.pdf` … `/proto_abs008.pdf` (session protocol)
- `/lxf_abs001.lxf` … `/lxf_abs008.lxf` (**session-level LENEX 3.0** — updated as sessions finish)

#### Per-event files (`Wk` numbering)
- Preliminaries / timed finals: `001`–`042`
- A-Finals / fastest heats: `101`–`141` (e.g. `101` = Final of `Wk 1`)
- B-Finals: `201`–`241` (e.g. `201` = B-Final of `Wk 1`)
- Files per event:
  - `/quali_wkNNN.pdf` (qualified finalists, A-finals only)
  - `/melde_wkNNN.pdf` (event start list)
  - `/proto_wkNNN.pdf` (event official results)

#### Per-association & per-club files (`clubs.php`)
- Regional association CSVs (`LSV` = *Landesschwimmverband*):
  - `/meldelsvNNN.csv` (entries CSV, semicolon-delimited, ISO-8859-1/Windows-1252)
  - `/erglsvNNN.csv` (results CSV, semicolon-delimited, includes event, athlete, YOB, club, DSV-ID, final time, status, rank, AQUA/FINA points)
- Per-club files:
  - `/mlNNN.pdf` (club entries), `/bvNNN.pdf` (lane assignments), `/veNNN.pdf` (club results)
  - `/2026-11-15-Wupperta-<ClubSlug>-Pr.DSV8z` (per-club DSV8 protocol)

---

## 3. Pipeline B: Real-Time Live Timing (`/livetime/`)

The actual live race feed is hosted in a separate subdirectory linked from the organizer's page (`sv-bayer.de`) and press portals, **not** linked from `results.php`:

- **Entry URL**: `https://dkm2026.swrevent.de/livetime/liveview.html`

### How it works
1. **Ingestion (Poolside → Server)**:
   - EasyWk connects serially to the Omega timing console (Quantum / Ares21 / OSM6).
   - Whenever new timing data arrives (heat ready/start, split touch, finish), EasyWk sends an authenticated HTTP request (password derived from the EasyWk registration name, checked via `livebasic.php`) to:
     - `https://dkm2026.swrevent.de/livetime/livework.php`
   - `livework.php` persists the latest heat state and event summary on the server into PHP state files (`data.php` and `summary.php`).
2. **Visualization (Server → Browser)**:
   - `liveview.html` is an HTML 4.01 `<frameset rows="*,*">` splitting the screen horizontally into two frames:
     - **Top frame (`livetime.php`) — Current Heat**:
       - Displays `<h2>Wk <N> - <Event Name> - Lauf <heat>/<total></h2>` and a simple striped HTML `<table>` with columns: Rank, `Schwimmer`, `Jg` (year of birth), `Verein`, `Meter` (current split/finish distance), `Zeit`.
       - Auto-reloads via `<meta http-equiv="refresh" content="15">` (note: the footer text says 20s, while the actual meta tag is `15` seconds).
     - **Bottom frame (`livesummary.php`) — Current Event Summary**:
       - Displays `<h2>Wk <N> - <Event Name> - Ergebnisse</h2>` and a table of all finished swimmers in the current event sorted by time (`Schwimmer`, `Jg`, `Verein`, `Endzeit`).
       - Auto-reloads via `<meta http-equiv="refresh" content="60">`.
   - Styled with `livetime.css`. Again, **zero JavaScript, no JSON API, no SSE/WebSocket**.
   - Times are explicitly marked unofficial (*"Livetiming-Zeiten dienen nur Informationszwecken und sind nicht offiziell!"*).
   - Because `livetime.php` and `livesummary.php` only hold the **current** heat/event state, once the next event starts, previous live-timing tables are overwritten (unless archived externally or replaced by the official PDF/LENEX upload).

---

## 4. Machine-Readable Data Sources for a Better Visualization

If you want to build a modern visualization/dashboard for DKM (both live during the meet and post-session/post-meet), these are the concrete data sources exposed by `dkm2026.swrevent.de`:

| Source | Update Cadence | Richness | Format & Effort to Parse |
|---|---|---|---|
| **`/livetime/livetime.php`** | Real-time (every heat/split, pollable every ~5–15s) | Current heat: rank, name, YOB, club, distance (`Meter`), time | Simple HTML `<table>` (UTF-8). Easy to scrape. |
| **`/livetime/livesummary.php`** | After each heat of current event | Cumulative unofficial ranking of the active event | Simple HTML `<table>` (UTF-8). Easy to scrape. |
| **`/lxf_absNNN.lxf`** & **`/lxf_gesamt.lxf`** | Initial entries pre-meet; updated per session and at meet end | **Richest source**: full meet metadata, sessions, events, heats, clubs, athletes, rankings, reaction times, AQUA points, and **all 25m splits** (DKM 2026: 8 sessions, 110 events, 172 clubs, 903 athletes, 2,775 results, 16,398 splits) | Standard **LENEX 3.0** XML inside a ZIP file (UTF-8). Ideal primary data model. |
| **`/results.php`** | Updated on every FTP upload (per event) | Live status of which events have `quali`, `melde`, or `proto` PDFs published + exact upload timestamps | Simple HTML (ISO-8859-1). Useful for detecting newly finished events and linking official PDFs. |
| **`/2026-11-15-Wupperta-Pr.DSV8z`** | Meet end (plus per-club `.DSV8z`) | Full official DSV8 protocol including officials/judges (*Kampfgericht*) | ZIP containing semicolon-delimited DSV8 text. |
| **`/erglsvNNN.csv`** / **`/meldelsvNNN.csv`** | Post-meet / pre-meet | Flat per-association entry & result tables | Semicolon-delimited CSV (ISO-8859-1). |

### Key Limitations of the Current Site (Opportunities for Improvement)
1. **PDF-first UX on `results.php`**: Browsing results requires clicking dozens of separate PDFs per session; there is no search, filtering (by athlete, club, stroke, distance, or age group), or side-by-side comparison.
2. **Disconnected live timing & official results**: `results.php` does not even link to `/livetime/liveview.html`, and live timing loses all history as soon as the next event begins.
3. **Full-page meta-refresh & HTML4 framesets**: Poor mobile experience, jarring full reloads, and no live diffing/highlighting of new touches or splits.
4. **Rich data already exists but isn't visualized**: The LENEX `.lxf` files already contain **every 25m split, reaction time, lane, heat, and AQUA point score** — none of which is interactively visualized (e.g., pacing charts, split diffs, head-to-head race replays, club medal/points leaderboards, or athlete profiles).
5. **Caching / polling friendliness**: Static artifacts (`lxf_gesamt.lxf`, `lxf_absNNN.lxf`, PDFs) return standard `ETag` and `Last-Modified` headers on Apache (with a rate limit header `X-WS-RateLimit-Limit: 1000`), so a backend poller can use conditional `If-None-Match` / `If-Modified-Since` requests efficiently without hammering the server.
