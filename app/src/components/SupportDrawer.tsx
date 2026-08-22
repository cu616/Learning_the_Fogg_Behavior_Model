import { useEffect, useRef, type ReactNode } from "react";
import UiIcon from "./UiIcon";

export default function SupportDrawer({ side, title, open, onClose, children }: {
  side: "left" | "right"; title: string; open: boolean; onClose: () => void; children: ReactNode;
}) {
  const panelRef = useRef<HTMLElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") { event.preventDefault(); onCloseRef.current(); return; }
      if (event.key !== "Tab" || !panelRef.current) return;
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), details > summary, [tabindex]:not([tabindex="-1"])'));
      if (!items.length) return;
      const first = items[0]; const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => { document.removeEventListener("keydown", onKeyDown); previous?.focus(); };
  }, [open]);

  if (!open) return null;
  return <div className={`support-layer support-${side}`}>
    <button className="support-backdrop" onClick={onClose} aria-label={`关闭${title}`} />
    <aside className="support-drawer" ref={panelRef} role="dialog" aria-modal="true" aria-label={title}>
      <header className="support-drawer-head"><strong>{title}</strong><button ref={closeRef} className="icon-action" onClick={onClose} title={`关闭${title}`} aria-label={`关闭${title}`}><UiIcon name="close" /></button></header>
      <div className="support-drawer-body">{children}</div>
    </aside>
  </div>;
}
