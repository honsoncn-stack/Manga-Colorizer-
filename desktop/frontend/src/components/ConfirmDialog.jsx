import ActionButton from "./ActionButton";

export default function ConfirmDialog({ title, message, confirmLabel = "确认", cancelLabel = "取消", onConfirm, onCancel }) {
  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="confirm-shell" onClick={(event) => event.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <ActionButton variant="ghost" onClick={onCancel}>
            {cancelLabel}
          </ActionButton>
          <ActionButton variant="danger" onClick={onConfirm}>
            {confirmLabel}
          </ActionButton>
        </div>
      </div>
    </div>
  );
}
