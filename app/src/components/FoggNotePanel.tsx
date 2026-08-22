import { useEffect, useState } from "react";
import type { FoggNote } from "../foggNotes";
import UiIcon from "./UiIcon";

export default function FoggNotePanel({ notes }: { notes: FoggNote[] }) {
  const firstKey = notes[0] ? `${notes[0].chapter}-${notes[0].title}` : null;
  const [openKey, setOpenKey] = useState<string | null>(firstKey);
  useEffect(() => setOpenKey(firstKey), [firstKey]);
  return (
    <div className="fogg-note-panel">
      <p className="note-intro">相关理论 · 按需展开</p>
      {notes.map((note) => {
        const key = `${note.chapter}-${note.title}`; const expanded = openKey === key;
        return <section className={`fogg-note-card${expanded ? " open" : ""}`} key={key}>
          <button className="fogg-note-toggle" aria-expanded={expanded} onClick={() => setOpenKey(expanded ? null : key)}><strong>{note.title}</strong><UiIcon name="chevron" size={17} /></button>
          {expanded && <ul>{note.points.map((point) => <li key={point}>{point}</li>)}</ul>}
        </section>;
      })}
    </div>
  );
}
