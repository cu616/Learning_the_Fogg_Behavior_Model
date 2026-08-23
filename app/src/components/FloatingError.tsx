import { createPortal } from "react-dom";

export default function FloatingError({ message, onDismiss }: { message: string; onDismiss?: () => void }) {
  if (!message) return null;

  return createPortal(
    <div className="floating-error-layer" aria-live="assertive">
      <div className="floating-error" role="alert">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 8v5m0 3.5v.01M10.2 4.5 3.5 17a2 2 0 0 0 1.8 3h13.4a2 2 0 0 0 1.8-3L13.8 4.5a2 2 0 0 0-3.6 0Z" /></svg>
        <span>{message}</span>
        {onDismiss && <button type="button" onClick={onDismiss} aria-label="关闭错误提醒">×</button>}
      </div>
    </div>,
    document.body,
  );
}
