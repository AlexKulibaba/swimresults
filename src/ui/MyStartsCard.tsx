import { useState } from "react";
import type { MeetClock, ScheduledSwim, Swimmer } from "../meet";
import { EntryRankDisplay } from "./EntryRankDisplay";
import {
  EMPTY_TIME,
  formatDay,
  formatDifference,
  formatEventName,
  formatSwimTime,
  roundLabel,
  statusCode,
  statusLabel,
} from "./format";
import { PlacementDisplay, rankTier, shortGroupLabel } from "./PlacementDisplay";
import { groupSwimsByDay } from "./ResultCardRow";

interface Props {
  swimmer: Swimmer;
  swims: ScheduledSwim[];
  clock: MeetClock;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  rowKeyFor: (swim: ScheduledSwim) => string;
  onOpenSwimmer: (swimmerId: string) => void;
  onOpenHeat: (eventId: string, heatId: string) => void;
  onOpenSwim: (swimmerId: string, eventId: string) => void;
}

interface LeftBadge {
  value: string;
  unit: string;
  tone: "default" | "accent" | "gold" | "silver" | "bronze" | "top8" | "other" | "status" | "muted";
  /** True for completed/status swims rendered with the flush left placement cap. */
  isCap: boolean;
}

function parseClockMinutes(clock: string): number | null {
  const match = clock.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!match) return null;
  const [, y, m, d, hh, mm] = match;
  return Math.floor(Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm)) / 60000);
}

function leftBadgeOf(swim: ScheduledSwim, clock: MeetClock): LeftBadge {
  const completed = swim.phase === "done" && (swim.status !== null || swim.swimTime !== null);

  if (swim.status) {
    return { value: statusCode(swim.status), unit: "Status", tone: "status", isCap: true };
  }

  if (completed && swim.places.length > 0) {
    const primary = swim.places[0]!;
    const tier = rankTier(primary.place, swim.awardsMedals);
    return {
      value: String(primary.place),
      unit: swim.awardsMedals ? shortGroupLabel(primary.group) : "Seed",
      tone: tier,
      isCap: true,
    };
  }

  if (completed) {
    return { value: "✓", unit: "Fertig", tone: "other", isCap: true };
  }

  if (swim.ifQualified) {
    return { value: "?", unit: "Quali", tone: "muted", isCap: false };
  }

  const nowMin = parseClockMinutes(clock);
  const startMin = parseClockMinutes(`${swim.date}T${swim.time ?? "00:00"}`);
  if (nowMin !== null && startMin !== null) {
    const diff = startMin - nowMin;
    if (diff <= 0) return { value: "●", unit: "Jetzt", tone: "accent", isCap: false };
    if (diff < 60)
      return { value: String(diff), unit: "Min", tone: swim.phase === "next" ? "accent" : "default", isCap: false };
    const hours = Math.round(diff / 60);
    if (hours < 24) return { value: String(hours), unit: "Std", tone: "default", isCap: false };
    const days = Math.round(diff / (60 * 24));
    return { value: String(days), unit: days === 1 ? "Tag" : "Tage", tone: "default", isCap: false };
  }

  return { value: "–", unit: "Offen", tone: "muted", isCap: false };
}

function initialsOf(swimmer: Swimmer): string {
  const first = swimmer.firstName.trim()[0] ?? "";
  const last = swimmer.lastName.trim()[0] ?? "";
  return `${first}${last}`.toUpperCase() || "?";
}

function ShareIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3v12" />
      <path d="m7 8 5-5 5 5" />
      <path d="M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
    </svg>
  );
}

function sortByTime(swims: ScheduledSwim[]): ScheduledSwim[] {
  return [...swims].sort((a, b) => {
    const ka = `${a.date}T${a.time ?? "99:99"}`;
    const kb = `${b.date}T${b.time ?? "99:99"}`;
    return ka.localeCompare(kb) || a.session - b.session || a.eventNumber - b.eventNumber;
  });
}

export function MyStartsCard({
  swimmer,
  swims,
  clock,
  expandedKey,
  onToggle,
  rowKeyFor,
  onOpenSwimmer,
  onOpenHeat,
  onOpenSwim,
}: Props) {
  const [shared, setShared] = useState(false);
  const orderedSwims = sortByTime(swims);
  const days = groupSwimsByDay(orderedSwims);

  async function handleShare() {
    const lines = orderedSwims.map((s) => {
      const time = s.time ? `${s.timeApproximate ? "~" : ""}${s.time}` : "--:--";
      const result = s.status ? statusCode(s.status) : s.swimTime !== null ? formatSwimTime(s.swimTime) : EMPTY_TIME;
      return `${time} · WK ${s.eventNumber} ${formatEventName(s.eventName)} (${result})`;
    });
    const text = `Meine Starts — ${swimmer.firstName} ${swimmer.lastName}\n${lines.join("\n")}`;

    try {
      if (navigator.share) {
        await navigator.share({ title: `Meine Starts — ${swimmer.firstName} ${swimmer.lastName}`, text });
        return;
      }
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setShared(true);
        window.setTimeout(() => setShared(false), 1800);
      }
    } catch {
      // User cancelled share sheet or clipboard unavailable.
    }
  }

  return (
    <section className="starts-sheet" aria-label="Meine Starts">
      <header className="starts-sheet__head">
        <h2 className="starts-sheet__title">Meine Starts</h2>
        <div className="starts-sheet__controls">
          <button
            type="button"
            className="starts-sheet__icon-btn"
            onClick={() => void handleShare()}
            title={shared ? "Kopiert!" : "Starts teilen"}
            aria-label={shared ? "Starts kopiert" : "Starts teilen"}
          >
            {shared ? <span className="starts-sheet__check">✓</span> : <ShareIcon />}
          </button>
          <button
            type="button"
            className="starts-sheet__avatar"
            onClick={() => onOpenSwimmer(swimmer.id)}
            title={`${swimmer.firstName} ${swimmer.lastName}`}
            aria-label={`Profil: ${swimmer.firstName} ${swimmer.lastName}`}
          >
            {initialsOf(swimmer)}
          </button>
        </div>
      </header>

      {orderedSwims.length === 0 ? (
        <p className="starts-sheet__empty muted">Keine Einzelstarts bei diesem Wettkampf.</p>
      ) : (
        <div className="day-blocks">
          {days.map((day) => (
            <div key={day.date} className="day-block">
              <div className="day-block__head num">{formatDay(day.date)}</div>
              <ol className="starts-sheet__list">
                {day.swims.map((swim) => {
                  const key = rowKeyFor(swim);
                  const expanded = expandedKey === key;
                  const completed = swim.phase === "done" && (swim.status !== null || swim.swimTime !== null);
                  const isFinal = swim.round === "FIN";
                  const isNext = swim.phase === "next";
                  const left = leftBadgeOf(swim, clock);
                  const startTime = swim.time ? `${swim.timeApproximate ? "~" : ""}${swim.time}` : "--:--";
                  const entryText = swim.entryTime !== null ? formatSwimTime(swim.entryTime) : EMPTY_TIME;
                  const resultText = completed
                    ? swim.status
                      ? statusCode(swim.status)
                      : formatSwimTime(swim.swimTime!)
                    : swim.status
                      ? statusCode(swim.status)
                      : EMPTY_TIME;
                  const diff =
                    completed && swim.swimTime !== null && swim.entryTime !== null
                      ? swim.swimTime - swim.entryTime
                      : null;

                  return (
                    <li
                      key={key}
                      className={`flight-row flight-row--${swim.phase}${expanded ? " flight-row--expanded" : ""}`}
                    >
                      <button
                        type="button"
                        className="flight-row__trigger"
                        aria-expanded={expanded}
                        onClick={() => onToggle(key)}
                      >
                        <div
                          className={
                            left.isCap
                              ? `flight-row__cap rcap--${left.tone}`
                              : `flight-row__left flight-row__left--${left.tone}`
                          }
                        >
                          {left.isCap ? (
                            <>
                              <span className="rcard__cap-num mono">{left.value}</span>
                              <span className="rcard__cap-scope">{left.unit}</span>
                            </>
                          ) : (
                            <>
                              <span className="flight-row__val num">{left.value}</span>
                              <span className="flight-row__unit">{left.unit}</span>
                            </>
                          )}
                        </div>

                        <div className="flight-row__right">
                          <div className="flight-row__info">
                            <div className="flight-row__id">
                              <span className={`tag ${isFinal ? "tag--live" : "tag--round"}`}>
                                {roundLabel(swim.round)}
                              </span>
                              <span className="mono">WK {swim.eventNumber}</span>
                              {isNext && <span className="tag tag--accent">Nächster</span>}
                            </div>

                            <div className="flight-row__event">{formatEventName(swim.eventName)}</div>

                            <div className="flight-row__sub num">
                              <span className="mono">{startTime}</span>
                              <span aria-hidden="true">·</span>
                              <span>
                                {swim.ifQualified
                                  ? "bei Qualifikation"
                                  : swim.heat
                                    ? `Lauf ${swim.heat} · Bahn ${swim.lane ?? "–"}`
                                    : "Lauf offen"}
                              </span>
                            </div>
                          </div>

                          <div className="flight-row__time-col mono">
                            {completed ? (
                              <>
                                <span
                                  className={swim.status ? "flight-row__val-status" : "flight-row__val-done"}
                                  title={swim.status ? statusLabel(swim.status) : "Ergebnis"}
                                >
                                  {resultText}
                                </span>
                                {diff !== null ? (
                                  <span
                                    className={`flight-row__diff ${diff < 0 ? "faster" : diff > 0 ? "slower" : ""}`}
                                  >
                                    {formatDifference(diff)}
                                  </span>
                                ) : (
                                  <span className="flight-row__sub-time" title="Meldezeit">
                                    {entryText}
                                  </span>
                                )}
                              </>
                            ) : (
                              <>
                                <span className="flight-row__val-entry" title="Meldezeit">
                                  {entryText}
                                </span>
                                <span className="flight-row__sub-time">Meldezeit</span>
                              </>
                            )}
                          </div>
                        </div>
                      </button>

                      {expanded && (
                        <div className="flight-row__body">
                          <dl className="swim-row__grid">
                            <div>
                              <dt>Abschnitt</dt>
                              <dd className="num">Abschnitt {swim.session}</dd>
                            </div>
                            <div>
                              <dt>Meldezeit</dt>
                              <dd className="mono">{entryText}</dd>
                            </div>
                            {!swim.ifQualified && (
                              <>
                                <div>
                                  <dt>Lauf</dt>
                                  <dd className="num">{swim.heat ? `${swim.heat} / ${swim.heatCount}` : "–"}</dd>
                                </div>
                                <div>
                                  <dt>Bahn</dt>
                                  <dd className="num">{swim.lane ?? "–"}</dd>
                                </div>
                              </>
                            )}
                            {swimmer.clubs.length > 1 && (
                              <div>
                                <dt>Verein</dt>
                                <dd>{swim.club}</dd>
                              </div>
                            )}
                          </dl>

                          {completed && swim.places.length > 0 && (
                            <div className="swim-row__rank">
                              <PlacementDisplay places={swim.places} medals={swim.awardsMedals} />
                            </div>
                          )}

                          {swim.entryRank && (
                            <div className="swim-row__rank">
                              <EntryRankDisplay entryRank={swim.entryRank} showLabel />
                            </div>
                          )}

                          <div className="swim-row__actions">
                            {swim.heatId && (
                              <button
                                type="button"
                                className="btn-inline btn-inline--accent"
                                onClick={() => onOpenHeat(swim.eventId, swim.heatId!)}
                              >
                                Lauf {swim.heat} ansehen →
                              </button>
                            )}
                            {completed && (
                              <button
                                type="button"
                                className="btn-inline"
                                onClick={() => onOpenSwim(swimmer.id, swim.eventId)}
                              >
                                Startdetails →
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
