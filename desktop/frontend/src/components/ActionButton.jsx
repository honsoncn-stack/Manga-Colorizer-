export default function ActionButton({ children, tone = "pink", onClick, disabled = false, type = "button" }) {
  return (
    <button
      type={type}
      className={`action-button action-button-${tone}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
