import { useState } from "react";
import { searchSwimmers, type Meet } from "../meet";

const maxHits = 50;

interface Props {
  meet: Meet;
  onSelect: (swimmerId: string) => void;
}

export function SwimmerSearch({ meet, onSelect }: Props) {
  const [query, setQuery] = useState("");
  const hits = searchSwimmers(meet, query);

  return (
    <section className="stack">
      <label className="search">
        <span className="visually-hidden">Schwimmer suchen</span>
        <input
          type="search"
          placeholder="Schwimmer suchen …"
          autoComplete="off"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      {query.trim() !== "" && hits.length === 0 && <p className="muted">Keine Schwimmer gefunden.</p>}
      {hits.length > 0 && (
        <ul className="list">
          {hits.slice(0, maxHits).map((swimmer) => (
            <li key={swimmer.id}>
              <button type="button" className="list__item" onClick={() => onSelect(swimmer.id)}>
                <span className="list__title">
                  {swimmer.firstName} {swimmer.lastName}
                </span>
                <span className="muted">
                  {swimmer.jahrgang ?? "Jahrgang unbekannt"} · {swimmer.club}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {hits.length > maxHits && <p className="muted">Weitere Treffer – bitte genauer suchen.</p>}
    </section>
  );
}
