export type UiIconName =
  | "back" | "summary" | "notes" | "close" | "chevron"
  | "settings" | "search" | "plus" | "arrow" | "edit" | "copy"
  | "archive" | "restore" | "trash" | "habit" | "task" | "oldHabit"
  | "lock" | "check" | "refresh" | "aspiration" | "brainstorm"
  | "focus" | "tiny" | "anchor" | "celebrate" | "practice" | "location";

export default function UiIcon({ name, size = 20 }: { name: UiIconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "back") return <svg {...common}><path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/></svg>;
  if (name === "summary") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16"/><path d="M12.5 9h4M12.5 13h4"/></svg>;
  if (name === "notes") return <svg {...common}><path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v12.5H8.5A2.5 2.5 0 0 1 6 17z"/><path d="M6 17a2.5 2.5 0 0 1 2.5-2.5H18M9.5 8h5"/></svg>;
  if (name === "close") return <svg {...common}><path d="m7 7 10 10M17 7 7 17"/></svg>;
  if (name === "settings") return <svg {...common}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21H9.6v-.09A1.7 1.7 0 0 0 8.5 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1A1.7 1.7 0 0 0 2.4 13.6H2V9.6h.4A1.7 1.7 0 0 0 4.1 8a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 3.6a1.7 1.7 0 0 0 1-.6A1.7 1.7 0 0 0 9.9 2h4.2a1.7 1.7 0 0 0 .4 1 1.7 1.7 0 0 0 1 .6 1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.9 8a1.7 1.7 0 0 0 .6 1 1.7 1.7 0 0 0 1.1.4h.4v4.2h-.4a1.7 1.7 0 0 0-1.1.4 1.7 1.7 0 0 0-.6 1Z"/></svg>;
  if (name === "search") return <svg {...common}><circle cx="10.8" cy="10.8" r="6.3"/><path d="m16 16 4 4"/></svg>;
  if (name === "plus") return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
  if (name === "arrow") return <svg {...common}><path d="M5 12h14M14 7l5 5-5 5"/></svg>;
  if (name === "edit") return <svg {...common}><path d="m4 20 4.4-1 9.8-9.8-3.4-3.4L5 15.6zM13.8 6.8l3.4 3.4M14.8 5.8l1.4-1.4a1.6 1.6 0 0 1 2.3 0l1.1 1.1a1.6 1.6 0 0 1 0 2.3l-1.4 1.4"/></svg>;
  if (name === "copy") return <svg {...common}><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>;
  if (name === "archive") return <svg {...common}><path d="M4 8h16v11H4zM3 4h18v4H3zM9 12h6"/></svg>;
  if (name === "restore") return <svg {...common}><path d="M4 8h16v11H4zM3 4h18v4H3zM12 16v-5M9.5 13.5 12 11l2.5 2.5"/></svg>;
  if (name === "trash") return <svg {...common}><path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5"/></svg>;
  if (name === "habit") return <svg {...common}><path d="M18.5 7.5A7 7 0 1 0 19 16"/><path d="M18.5 3.5v4h-4"/><path d="M9 12.5 11 14l4-5"/></svg>;
  if (name === "task") return <svg {...common}><path d="M5 12.5 9 16l10-10"/></svg>;
  if (name === "oldHabit") return <svg {...common}><path d="M6 7h12M8 11h8M10 15h4"/><path d="m8 18 4 3 4-3"/></svg>;
  if (name === "lock") return <svg {...common}><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3"/></svg>;
  if (name === "check") return <svg {...common}><path d="m5 12 4 4 10-10"/></svg>;
  if (name === "refresh") return <svg {...common}><path d="M19 7a8 8 0 1 0 1 7"/><path d="M19 3v4h-4"/></svg>;
  if (name === "aspiration") return <svg {...common}><path d="M5 19V6l9-2v8l-9 2"/><path d="M5 19h6M14 4l4 3-4 5"/></svg>;
  if (name === "brainstorm") return <svg {...common}><circle cx="12" cy="12" r="3"/><circle cx="5" cy="7" r="2"/><circle cx="19" cy="7" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="m7 8 3 2M17 8l-3 2M7 17l3-3M17 17l-3-3"/></svg>;
  if (name === "focus") return <svg {...common}><circle cx="12" cy="12" r="7"/><circle cx="12" cy="12" r="2"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
  if (name === "tiny") return <svg {...common}><path d="M5 7h14M8 12h8M10.5 17h3"/><path d="m16 15 2 2 3-4"/></svg>;
  if (name === "anchor") return <svg {...common}><circle cx="12" cy="5" r="2"/><path d="M12 7v12M6 13H3c0 4 4 7 9 7s9-3 9-7h-3M8 11h8"/></svg>;
  if (name === "celebrate") return <svg {...common}><path d="M8 4v4M4 8h4M17 3l.7 2.3L20 6l-2.3.7L17 9l-.7-2.3L14 6l2.3-.7z"/><path d="m8 20 9-9M6 12l6 6"/></svg>;
  if (name === "practice") return <svg {...common}><path d="M19 7a8 8 0 0 0-13-2L4 7"/><path d="M4 3v4h4M5 17a8 8 0 0 0 13 2l2-2"/><path d="M20 21v-4h-4"/></svg>;
  if (name === "location") return <svg {...common}><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z"/><circle cx="12" cy="10" r="2"/></svg>;
  return <svg {...common}><path d="m8 10 4 4 4-4"/></svg>;
}
