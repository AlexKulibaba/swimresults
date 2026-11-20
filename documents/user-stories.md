# DKM v1 user stories — swimming and watching

## First visit: “I’m swimming” or “I’m watching”

**Viewer.** As someone watching the meet, I want to follow swimmers and clubs without having to pick a swimmer as myself. My home page shows the next races for the people and teams I follow, in start order.

- I can search by swimmer or club name. A swimmer’s page shows their schedule and completed races; a club’s page shows upcoming and completed swims by its members. I can follow either from its page.
- For example, I search for my brother, confirm his club, and see his next race time, event, heat and lane when published. I can follow him so I don’t have to repeat the search. After his race I can open the result, examine his splits and compare his swim with someone else’s.

**Swimmer.** As a competitor, I want my own page to come first, without losing anything I could do as a viewer. After I select myself, my home page leads with my next swim, schedule, entry rankings and results. I can still follow my brother or my club, browse their races and make comparisons without switching modes.

Both modes use the same schedules, meet status and race details. In the stories below, a viewer can open the same information for a swimmer they follow.

## Before the session

**1. Find my schedule.** As a swimmer, I want to select myself and see my races in order so I can plan my warm-up and find my lane.

- I can distinguish swimmers with the same name by club or year of birth. My next swim stands out from my later entries.
- Each swim shows the session, event, round, scheduled time, heat and lane when published. A possible final says “if qualified”; a missing lane says “not assigned” rather than showing a guess.

**2. Put my Meldezeit in context.** As a swimmer, I want to see where my entry time ranks in my age group and in the whole field so I know how I’m seeded before anyone races.

- For one event and round, I see both comparisons across all heats, e.g. “3rd of 12 in your Jahrgang · 18th of 64 overall.” The comparison group is named explicitly.
- Equal entry times share a rank. Entries without a time are excluded from the ranked count. These are entry ranks, not predicted finishes or qualifying places.

## At the pool

**3. See where the meet is now.** As a swimmer waiting for my event, I want to see what’s in the water alongside my next swim so I don’t have to work it out from the timetable.

- I see the current event, round and heat (e.g. “heat 4 of 6”) and when that information was last confirmed. If updates stop, I see “last seen” rather than a claim that the heat is still racing.

**4. Know whether we’re running late.** As a swimmer, I want an estimate of how far the session is ahead of or behind schedule so I can adjust my warm-up.

- My published start time stays visible beside any estimate, e.g. “Scheduled 09:46 · estimated ~09:53 · about 7 min behind.”
- The estimate compares observed meet progress with a comparable scheduled milestone. A last refresh is not a heat start. If the feed is stale or there’s no suitable scheduled time, I see “delay unknown” and still have my original schedule.

## After the race

**5. Understand a swim beyond the finish time.** As a swimmer, I want to open a race and see the placing, difference from entry time, and splits so I can tell where I gained or faded.

- I can distinguish provisional live times from official results and follow the link to the event protocol when published.
- Each measured wall shows cumulative time and, where calculable, the time for that length: 13.20 at 25 m and 27.10 at 50 m means a 13.90 second length. Missing splits stay blank; they aren’t treated as zero.

**6. Compare two swims.** As a viewer or swimmer, I want to choose two completed swims over the same distance to see where the gap changed. The swimmers need not have raced in the same heat.

- Start with the same stroke and distance. Label each swim’s event and round so a preliminary and a final aren’t mistaken for a head-to-head race.
- Show finish times and gaps at shared measured distances, without implying where an overtake happened between walls.

## First slice and open decisions

- **First prototype:** Use one completed session locally. Test the same data twice: as a viewer, find a sibling or club, check what’s next and compare two completed swims; as a swimmer, check that my own schedule and entry ranks come first and that I can still follow someone else. Use a clearly labeled replay to test progress and delay (3 and 4); a replay is not live coverage. Confirm permission before collecting or republishing live data. See [current data sources](current-architecture.md).
- **What is “my age group”?** Exact birth year (*Jahrgang*) and competition category (e.g. *Jugend A*) can produce different ranks. Confirm which swimmers want; don’t silently substitute one for the other.
- **When is a delay estimate useful enough to show?** Test the estimate against observed heat transitions, including session breaks, before relying on it poolside.
