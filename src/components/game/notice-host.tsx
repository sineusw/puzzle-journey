import { useEffect } from "react";
import { dismissNotice, NOTICE_MS, useNotices } from "@/lib/game/notices";

/**
 * Shows the notice queue one at a time near the top of the screen, over
 * the logo (never over the board), each gone in under two seconds. Tap to
 * dismiss early.
 */
export function NoticeHost() {
  const current = useNotices((s) => s.queue[0]);
  useEffect(() => {
    if (!current) return;
    const t = window.setTimeout(() => dismissNotice(current.id), NOTICE_MS);
    return () => window.clearTimeout(t);
  }, [current]);
  if (!current) return null;
  return (
    <button
      type="button"
      key={current.id}
      className={`pj-notice is-${current.tone ?? "info"}`}
      style={{ ["--ms" as string]: `${NOTICE_MS}ms` }}
      onClick={() => dismissNotice(current.id)}
      role="status"
      aria-live="polite"
      data-testid="notice"
    >
      <span className="pj-notice-icon" aria-hidden="true">
        {current.icon}
      </span>
      <span className="pj-notice-text">
        <strong>{current.title}</strong>
        {current.sub ? <span>{current.sub}</span> : null}
      </span>
    </button>
  );
}
