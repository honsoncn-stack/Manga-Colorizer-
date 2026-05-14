import ActionButton from "./ActionButton";
import { dirname } from "../lib/paths";
import { openFile, openFolder } from "../lib/api";

export default function PathField({
  label,
  value,
  placeholder = "",
  onPick,
  onChange,
  readOnly = false,
  openTarget = "folder",
  compact = false,
  allowOpen = true,
}) {
  const handleCopy = async () => {
    if (value) {
      await navigator.clipboard.writeText(value);
    }
  };

  const handleOpen = async () => {
    if (!value || !allowOpen) {
      return;
    }
    if (openTarget === "file") {
      await openFile(value);
      return;
    }
    const target = readOnly ? value : dirname(value);
    await openFolder(target);
  };

  return (
    <div className="field-group">
      <label className="field-label">{label}</label>
      <div className={`path-field ${compact ? "path-field-compact" : ""}`}>
        {compact ? (
          <div className="path-summary" title={value || placeholder}>
            {value || placeholder || "-"}
          </div>
        ) : (
          <input className="path-input" value={value || ""} placeholder={placeholder} onChange={onChange} readOnly={readOnly} />
        )}
        <div className="path-field-actions">
          {onPick ? (
            <ActionButton variant="secondary" hint="选择路径" onClick={onPick}>
              选择
            </ActionButton>
          ) : null}
          <ActionButton variant="ghost" hint="复制路径" onClick={handleCopy} disabled={!value}>
            复制
          </ActionButton>
          {allowOpen ? (
            <ActionButton variant="ghost" hint="打开路径" onClick={handleOpen} disabled={!value}>
              打开
            </ActionButton>
          ) : null}
        </div>
      </div>
    </div>
  );
}
