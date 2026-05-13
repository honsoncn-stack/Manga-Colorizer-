import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";

export default function ActionButton({
  children,
  hint,
  variant = "primary",
  loading = false,
  disabled = false,
  className = "",
  onClick,
  ...props
}) {
  const [flash, setFlash] = useState(false);
  const flashTimer = useRef(null);
  const toneClass =
    variant === "secondary" ? "action-button-secondary" : variant === "danger" ? "action-button-danger" : variant === "ghost" ? "action-button-ghost" : "action-button-primary";

  useEffect(
    () => () => {
      if (flashTimer.current) {
        clearTimeout(flashTimer.current);
      }
    },
    []
  );

  const handleClick = async (event) => {
    if (disabled || loading) {
      return;
    }
    setFlash(true);
    if (flashTimer.current) {
      clearTimeout(flashTimer.current);
    }
    flashTimer.current = window.setTimeout(() => setFlash(false), 180);
    await onClick?.(event);
  };

  return (
    <button
      className={`action-button ${toneClass} ${flash ? "is-flashed" : ""} ${className}`.trim()}
      disabled={disabled || loading}
      type="button"
      onClick={handleClick}
      {...props}
    >
      {loading ? <LoaderCircle size={16} className="spin" aria-hidden="true" /> : null}
      <span className="action-button-stack">
        <span className="action-button-text">{children}</span>
        {hint ? <span className="action-button-hint">{hint}</span> : null}
      </span>
    </button>
  );
}
