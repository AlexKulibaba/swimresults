import { useState, type ReactNode } from "react";
import { searchClubs, searchSwimmers, type Meet } from "../meet";

const maxHits = 30;

interface Props {
  meet: Meet;
  onOpenSwimmer: (swimmerId: string) => void;
  onOpenClub: (clubName: string) => void;
}

/** One search over swimmers and clubs, shown in separate groups. */
export function MeetSearch({ meet, onOpenSwimmer, onOpenClub }: Props) {
  const [query, setQuery] = useState("");
  const swimmers = searchSwimmers(meet, query);
  const clubs = searchClubs(meet, query);

  return (
    <section className="stack">
      <label className="search">
        <span className="visually-hidden">Schwimmer oder Verein suchen</span>
        <input
          type="search"
          placeholder="Schwimmer oder Verein suchen …"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {query.trim() !== "" && swimmers.length === 0 && clubs.length === 0 && (
        <p className="muted">Nichts gefunden.</p>
      )}
      {clubs.length > 0 && (
        <HitGroup title="Vereine" total={clubs.length}>
          {clubs.slice(0, maxHits).map((club) => (
            <li key={club.name}>
              <button type="button" className="list__item" onClick={() => onOpenClub(club.name)}>
                <span className="list__title">{club.name}</span>
                <span className="muted">{club.swimmerCount} Schwimmer</span>
              </button>
            </li>
          ))}
        </HitGroup>
      )}
      {swimmers.length > 0 && (
        <HitGroup title="Schwimmer" total={swimmers.length}>
          {swimmers.slice(0, maxHits).map((swimmer) => (
            <li key={swimmer.id}>
              <button type="button" className="list__item" onClick={() => onOpenSwimmer(swimmer.id)}>
                <span className="list__title">
                  {swimmer.firstName} {swimmer.lastName}
                </span>
                <span className="muted">
                  {swimmer.jahrgang ?? "Jahrgang unbekannt"} · {swimmer.club}
                </span>
              </button>
            </li>
          ))}
        </HitGroup>
      )}
    </section>
  );
}

function HitGroup({ title, total, children }: { title: string; total: number; children: ReactNode }) {
  return (
    <section>
      <h2>{title}</h2>
      <ul className="list">{children}</ul>
      {total > maxHits && <p className="muted">Weitere Treffer – bitte genauer suchen.</p>}
    </section>
  );
}
