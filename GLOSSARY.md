# Swimresults

Following swimmers and clubs through a swim meet: their schedule, entry ranks, results and splits. Works for any meet published as LENEX; the DKM is the reference example. The UI speaks German; German terms are given in brackets.

## Meet structure

**Meet** _(Wettkampf, Veranstaltung)_:
One competition published as a single LENEX file, e.g. the DKM 2026.
_Avoid_: Competition, championship

**Session** _(Abschnitt)_:
A block of the meet's schedule with its own start time, usually half a day.
_Avoid_: Part, section, block

**Event** _(Wettkampf-Nr., Wk)_:
One numbered race type in one round for one gender, e.g. Wk 1 "200m Schmetterling weiblich (Vorlauf)".
_Avoid_: Race, discipline

**Round** _(Vorlauf, Finale, Zeitlauf)_:
Where an event stands in the progression: prelim, final, or timed final (decided directly from heats).
_Avoid_: Stage, phase

**Heat** _(Lauf)_:
One start of an event; an event has one or more heats, e.g. "Lauf 4 von 6".
_Avoid_: Race, run

**Lane** _(Bahn)_:
The lane a swimmer is assigned in a heat.

## Swimmers

**Swimmer** _(Schwimmer/in, Aktive/r)_:
A person entered in the meet as an individual competitor. Entries with the same license for several clubs are one swimmer.
_Avoid_: Athlete (except when quoting LENEX), competitor, participant

**Club** _(Verein)_:
A club swimmers start for at this meet. A swimmer usually starts for one club, but can start for several, e.g. their club and a federation team; each swim is for one club.
_Avoid_: Team

**Scoring group** _(Wertung)_:
A group the meet itself ranks swims in, e.g. "Offene Wertung", "U23-Wertung" or "Jahrgang 2014". Defined per meet; a swim can be placed in several.
_Avoid_: Age group, category, class

**Jahrgang**:
A swimmer's birth year; the comparison group for "my age group".
_Avoid_: Age group (ambiguous with competition categories such as Jugend A)

## Entries and swims

**Entry** _(Meldung)_:
A swimmer's registration for one event, with an entry time, heat and lane.
_Avoid_: Registration, start

**Entry time** _(Meldezeit)_:
The time a swimmer was entered with, used for seeding.
_Avoid_: Seed time, PB

**Entry rank**:
A swimmer's position by entry time among all entries of the same event, either within their Jahrgang or overall. Not a prediction.
_Avoid_: Seed, expected place

**Swim**:
One swimmer's appearance in one event: time, place, status, reaction time and splits.
_Avoid_: Race (for an individual swim), result, start

**Split** _(Zwischenzeit)_:
The cumulative time at a measured distance within a swim, e.g. 27.10 at 50 m.
_Avoid_: Lap time, interval

**Swim status**:
Why a swim has no valid time: did not start _(nicht angetreten)_, disqualified _(disqualifiziert)_ or withdrawn _(abgemeldet)_.
_Avoid_: Error, invalid

**Official**:
A time taken from a published meet file. Opposed to provisional, which only live timing produces.
_Avoid_: Final (clashes with the round), confirmed

## Time

**Meet clock**:
The single notion of "now" the app uses to decide what is next and what is done. It follows real time unless a replay is set.
_Avoid_: Current time, system time

**Replay** _(Wiederholung)_:
Setting the meet clock to a past moment of a meet, always labeled as such; it shows only what was knowable at that moment. Not live coverage.
_Avoid_: Simulation, demo, live

## People using the app

**Viewer**:
Someone following swimmers and clubs without having picked themselves.
_Avoid_: Spectator, fan, guest

**Swimmer mode**:
The app after a person has selected themselves as a swimmer; their own page comes first, everything a viewer can do remains.
_Avoid_: Athlete mode, my account

**Follow**:
Keeping a swimmer or club on your home page without searching again.
_Avoid_: Favourite, subscribe, watch
