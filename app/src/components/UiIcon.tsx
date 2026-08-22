export type UiIconName = "back" | "summary" | "notes" | "close" | "chevron";

export default function UiIcon({ name, size = 20 }: { name: UiIconName; size?: number }) {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true };
  if (name === "back") return <svg {...common}><path d="M9 7 4 12l5 5"/><path d="M4 12h10a6 6 0 0 1 6 6"/></svg>;
  if (name === "summary") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16"/><path d="M12.5 9h4M12.5 13h4"/></svg>;
  if (name === "notes") return <svg {...common}><path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v12.5H8.5A2.5 2.5 0 0 1 6 17z"/><path d="M6 17a2.5 2.5 0 0 1 2.5-2.5H18M9.5 8h5"/></svg>;
  if (name === "close") return <svg {...common}><path d="m7 7 10 10M17 7 7 17"/></svg>;
  return <svg {...common}><path d="m8 10 4 4 4-4"/></svg>;
}
