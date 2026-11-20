import type { Course, MeetSummary } from "../meet";

const courseLabels: Record<string, string> = {
  SCM: "Kurzbahn (25 m)",
  LCM: "Langbahn (50 m)",
};

const dateFormat = new Intl.DateTimeFormat("de-DE", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: "UTC" });

function formatDays(firstDay: string, lastDay: string): string {
  const first = dateFormat.format(new Date(firstDay));
  return firstDay === lastDay ? first : `${first} – ${dateFormat.format(new Date(lastDay))}`;
}

function courseLabel(course: Course): string {
  return courseLabels[course] ?? course;
}

interface Props {
  summary: MeetSummary;
  onRemove: () => void;
}

export function MeetSummaryView({ summary, onRemove }: Props) {
  return (
    <section className="stack">
      <h2>Wettkampf</h2>
      <dl className="facts">
        <dt>Ort</dt>
        <dd>{summary.city}</dd>
        <dt>Datum</dt>
        <dd>{formatDays(summary.firstDay, summary.lastDay)}</dd>
        <dt>Bahn</dt>
        <dd>{courseLabel(summary.course)}</dd>
      </dl>
      <button type="button" className="secondary" onClick={onRemove}>
        Wettkampf entfernen
      </button>
    </section>
  );
}
