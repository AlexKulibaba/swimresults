import { useEffect, useState, type DragEvent } from "react";
import { openMeet, type Meet, type OpenMeetError } from "../meet";

const errorMessages: Record<OpenMeetError, string> = {
  "not-a-lenex-meet": "Diese Datei konnte nicht als Wettkampf gelesen werden. Bitte wähle eine LENEX-Datei (.lxf oder .lef).",
};

interface Props {
  onOpened: (meet: Meet) => void;
}

/** Start screen: the meet file is read in the browser only and never uploaded (ADR 0001). */
export function OpenMeetScreen({ onOpened }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  function open(bytes: Uint8Array) {
    const result = openMeet(bytes);
    if (result.ok) onOpened(result.meet);
    else setError(errorMessages[result.error]);
  }

  async function openFile(file: File | undefined) {
    if (file) open(new Uint8Array(await file.arrayBuffer()));
  }

  function onDrop(event: DragEvent) {
    event.preventDefault();
    setDragging(false);
    void openFile(event.dataTransfer.files[0]);
  }

  return (
    <section className="stack">
      <h1>Wettkampf öffnen</h1>
      <label
        className={`dropzone${dragging ? " dropzone--active" : ""}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
      >
        <span className="dropzone__title">LENEX-Datei wählen</span>
        <span className="muted">.lxf oder .lef – oder hierher ziehen</span>
        <input
          type="file"
          accept=".lxf,.lef"
          className="visually-hidden"
          onChange={(event) => void openFile(event.target.files?.[0])}
        />
      </label>
      {error && (
        <p className="error" role="alert">
          {error}
        </p>
      )}
      <p className="muted">Die Datei wird nur in deinem Browser gelesen und nirgendwohin hochgeladen.</p>
      {import.meta.env.DEV && <DevSamples onLoaded={open} />}
    </section>
  );
}

/** Development only: one-click loading of the local files in `samples/`. */
function DevSamples({ onLoaded }: { onLoaded: (bytes: Uint8Array) => void }) {
  const [files, setFiles] = useState<string[]>([]);

  useEffect(() => {
    fetch("/__samples/")
      .then((response) => response.json())
      .then(setFiles)
      .catch(() => setFiles([]));
  }, []);

  async function load(file: string) {
    const response = await fetch(`/__samples/${encodeURIComponent(file)}`);
    onLoaded(new Uint8Array(await response.arrayBuffer()));
  }

  if (files.length === 0) return null;

  return (
    <section className="dev-samples">
      <h2>Beispieldateien (nur Entwicklung)</h2>
      <ul>
        {files.map((file) => (
          <li key={file}>
            <button type="button" onClick={() => void load(file)}>
              {file}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
