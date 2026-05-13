import ActionButton from "./ActionButton";
import { dirname } from "../lib/paths";
import { openFolder } from "../lib/api";

export default function ImagePreviewModal({ item, onClose }) {
  if (!item) {
    return null;
  }

  const handleOpenFolder = async () => {
    await openFolder(dirname(item.path));
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <div className="modal-title">{item.name}</div>
            <div className="modal-subtitle">{item.path}</div>
          </div>
          <ActionButton variant="ghost" hint="关闭预览" onClick={onClose}>
            关闭
          </ActionButton>
        </header>
        <div className="modal-body">
          <img src={item.previewUrl} alt={item.name} className="modal-image" />
        </div>
        <footer className="modal-footer">
          <ActionButton variant="secondary" hint="打开所在文件夹" onClick={handleOpenFolder}>
            打开文件夹
          </ActionButton>
        </footer>
      </div>
    </div>
  );
}
