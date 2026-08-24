import { useEffect, useState } from "react";
import type { FoggNote } from "../foggNotes";
import UiIcon from "./UiIcon";

export default function FoggNotePanel({ notes }: { notes: FoggNote[] }) {
  const firstKey = notes[0]?.title ?? null;
  const [openKey, setOpenKey] = useState<string | null>(firstKey);
  useEffect(() => setOpenKey(firstKey), [firstKey]);

  if (!notes.length) return null;

  return (
    <div className="fogg-note-panel">
      <section className="note-method-hero">
        <span className="note-method-logo" aria-hidden="true" />
        <div><small>先做判断，再改设计</small><strong>{notes[0].takeaway}</strong></div>
      </section>

      <div className="note-method-route" aria-label="使用笔记的三个动作">
        <span><b>1</b>看现实信号</span><span><b>2</b>问一个问题</span><span><b>3</b>带回现实试一次</span>
      </div>

      <div className="note-method-list">
        {notes.map((note, index) => {
          const expanded = openKey === note.title;
          return <section className={`fogg-note-card${expanded ? " open" : ""}`} key={note.title}>
            <button className="fogg-note-toggle" aria-expanded={expanded} onClick={() => setOpenKey(expanded ? null : note.title)}>
              <span className="note-card-number">{String(index + 1).padStart(2, "0")}</span>
              <span><small>{note.label}</small><strong>{note.title}</strong></span>
              <UiIcon name="chevron" size={18} />
            </button>
            {expanded && <div className="note-card-body">
              <div className="note-rule"><small>先记住</small><p>{note.takeaway}</p></div>
              <div className="note-self-check"><UiIcon name="focus" size={19} /><div><small>问自己</small><strong>{note.question}</strong></div></div>
              <ul>{note.points.map((point) => <li key={point}>{point}</li>)}</ul>
              <div className="note-next-action"><UiIcon name="arrow" size={18} /><div><small>现在可以做</small><p>{note.action}</p></div></div>
            </div>}
          </section>;
        })}
      </div>

      <p className="note-method-footer">现实结果不是成绩单，而是下一轮设计的证据。</p>
    </div>
  );
}
