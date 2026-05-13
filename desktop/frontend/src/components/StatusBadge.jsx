const TONE_CLASS = {
  ok: "status-ok",
  warn: "status-warn",
  error: "status-error",
  running: "status-running",
  missing: "status-missing",
  neutral: "status-neutral"
};

export default function StatusBadge({ tone = "neutral", children, className = "" }) {
  return <span className={`status-badge ${TONE_CLASS[tone] || TONE_CLASS.neutral} ${className}`.trim()}>{children}</span>;
}
