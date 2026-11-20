# LENEX Sample Result Archives (`samples/`)

Local sample corpus of public, explicitly linked LENEX 3.0 swimming meet result files (`.lxf` ZIP archives and `.lef` plain XML files) for parser testing and visualization development in `swimresults`.

## Samples

All 6 files represent distinct meets (verified by XML SHA-256; no duplicate content), span both SCM (25m) and LCM (50m) courses, both `.lxf` (ZIP-wrapped) and `.lef` (plain XML) formats, and three different LENEX producers (EasyWk, TITANIUM, SPLASH Meet Manager).

| File | Meet | Course & Dates | Source Page | Download URL | Producer | Format | Sessions | Events | Clubs | Athletes | Relays | Results | Splits | License / Terms |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| `dkm-2026.lxf` | Deutsche Kurzbahnmeisterschaften im Schwimmen 2026 (Wuppertal, GER) | SCM, 2026-11-12 to 2026-11-15 | https://dkm2026.swrevent.de/results.php | https://dkm2026.swrevent.de/lxf_gesamt.lxf | EasyWk 5.39 BETA | ZIP (`lxf_gesamt.lef`), 222,367 B | 8 | 110 | 172 | 903 | 107 | 2,775 | 16,398 | Organizer/DSV published results (no explicit open license) |
| `dm-2026-berlin.lef` | 137. Deutsche Meisterschaften Schwimmen (Berlin, GER) | LCM, 2026-04-23 to 2026-04-26 | https://www.titanium-sportservice.de/sport-events/calendar/resultlists-v2?va_id=347&date=2026-04-23 | https://www.titanium-sportservice.de/data/competition/2026-04-23_347/files/260426-Berlin.lef | TITANIUM Report and Export Engine 0.21.0 | Plain XML, 1,788,946 B | 12 | 104 | 158 | 748 | 96 | 2,238 | 9,744 | Organizer/timing-service published results (no explicit open license) |
| `dm-2024-berlin.lef` | 135. Deutsche Meisterschaften Schwimmen (Berlin, GER) | LCM, 2024-04-25 to 2024-04-28 | https://www.titanium-sportservice.de/sport-events/calendar/resultlists-v2/?date=2024-04-25&va_id=333 (linked from DSV DM-Langbahn page) | https://www.titanium-sportservice.de/data/competition/2024-04-25_333/files/240428-Berlin.lef | TITANIUM Report and Export Engine 0.7.1 | Plain XML, 1,714,438 B | 8 | 108 | 146 | 678 | 128 | 2,073 | 8,526 | Organizer/timing-service published results (no explicit open license) |
| `hannover-2026.lef` | Deutsche Sprint- und Lagenmeisterschaften (Stadionbad Hannover, GER) | LCM, 2026-07-23 to 2026-07-26 | https://www.titanium-sportservice.de/sport-events/calendar/resultlists-v2?va_id=351&date=2026-07-23 | https://www.titanium-sportservice.de/data/competition/2026-07-23_351/files/260726-StadionbadHannover.lef | TITANIUM Report and Export Engine 0.35.1 | Plain XML, 256,776 B | 8 | 70 | 38 | 139 | 0 | 469 | 996 | Organizer/timing-service published results (no explicit open license) |
| `aue-2026.lef` | Auer WISMUTPOKAL 2026 (Schwimmhalle Aue, GER) | SCM, 2026-09-19 to 2026-09-20 | https://www.titanium-sportservice.de/sport-events/calendar/resultlists-v2?va_id=349&date=2026-09-19 | https://www.titanium-sportservice.de/data/competition/2026-09-19_349/files/260920-SchwimmhalleAue.lef | TITANIUM Report and Export Engine 0.42.1 | Plain XML, 1,418,929 B | 4 | 51 | 25 | 397 | 91 | 2,502 | 4,836 | Organizer/timing-service published results (no explicit open license) |
| `open-lenex-example-results.lxf` | Schweizerische Masters Meisterschaften (Nottwil, SUI) | SCM, 2009-09-26 to 2009-09-27 | https://github.com/Tiim/lenex-java/blob/HEAD/src/test/resources/com/github/tiim/lenexjava/example-results.lxf | https://raw.githubusercontent.com/Tiim/lenex-java/HEAD/src/test/resources/com/github/tiim/lenexjava/example-results.lxf | SPLASH Meet Manager 2007 DEBUG Build | ZIP (`examp-results.lef`), 45,695 B | 7 | 35 | 44 | 136 | 7 | 537 | 1,015 | MIT (repository license; upstream Splash/LENEX example fixture) |

## Verification Summary

Each file was verified locally for:
- Valid ZIP integrity (for `.lxf` files) and well-formed XML parsing (`<LENEX version="3.0">` root element).
- Non-empty `<RESULT>` elements (all 6 files contain actual meet results, ranging from 469 to 2,775 results).
- Unique XML payload hashes (no duplicate meets or contents).

Note: `dkmm2026.swrevent.de/lxf_gesamt.lxf` (16. Deutsche Kurzbahnmeisterschaften der Masters, 27–29 Nov 2026) was inspected and excluded because the meet had not yet taken place (`results=0`).

## Local-Use & Licensing Caveat

- **Do not redistribute or commit raw sample files.** `samples/.gitignore` excludes `*.lxf`, `*.lef`, `*.xml`, and `*.zip` so raw meet archives are not accidentally published to version control.
- The five German meet archives (`dkm-2026.lxf`, `dm-2026-berlin.lef`, `dm-2024-berlin.lef`, `hannover-2026.lef`, `aue-2026.lef`) were downloaded from public first-party organizer/timing-service results pages without an explicit open data license. They contain real athlete names, birth years, clubs, and competition results and are intended strictly for **local development and testing**.
- `open-lenex-example-results.lxf` is sourced from the MIT-licensed `Tiim/lenex-java` repository (an upstream SPLASH/LENEX 3.0 example fixture), though it still reflects a real 2009 Swiss Masters meet; keep it local alongside the rest of the sample corpus.
