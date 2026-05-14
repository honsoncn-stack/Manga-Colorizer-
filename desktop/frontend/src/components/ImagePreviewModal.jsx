import { useEffect, useMemo, useState } from "react";
import ActionButton from "./ActionButton";
import { dirname } from "../lib/paths";
import { openFolder } from "../lib/api";

export default function ImagePreviewModal({ items = [], activeIndex = -1, onClose, onChangeIndex }) {
  const item = activeIndex >= 0 ? items[activeIndex] : null;
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    setLoadFailed(false);
  }, [activeIndex]);

  const canPrev = activeIndex > 0;
  const canNext = activeIndex >= 0 && activeIndex < items.length - 1;
  const folderPath = useMemo(() => {
    if (!item) {
      return "";
    }
    return item.folder_path || dirname(item.file_path || "");
  }, [item]);

  if (!item) {
    return null;
  }

  const handleOpenFolder = async () => {
    if (folderPath) {
      await openFolder(folderPath);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <header className="modal-header">
          <div>
            <div className="modal-title">{item.book_title ? `${item.book_title} · ${item.filename}` : item.filename}</div>
            <div className="modal-subtitle">
              {item.page_number ? `第 ${item.page_number} 页` : "临时彩图"}
              {item.file_path ? ` · ${item.file_path}` : ""}
            </div>
          </div>
          <ActionButton variant="ghost" hint="关闭预览" onClick={onClose}>
            关闭
          </ActionButton>
        </header>
        <div className="modal-body">
          {loadFailed ? (
            <div className="empty-state">
              <div className="empty-state-title">原图加载失败</div>
              <div className="empty-state-desc">这张图的原始文件暂时无法打开，请稍后重试。</div>
            </div>
          ) : (
            <img
              src={item.image_url}
              alt={item.book_title ? `${item.book_title} 第 ${item.page_number} 页` : item.filename}
              className="modal-image"
              onError={() => setLoadFailed(true)}
            />
          )}
        </div>
        <footer className="modal-footer">
          <div className="button-row">
            <ActionButton variant="secondary" disabled={!canPrev} onClick={() => onChangeIndex?.(activeIndex - 1)}>
              上一张
            </ActionButton>
            <ActionButton variant="secondary" disabled={!canNext} onClick={() => onChangeIndex?.(activeIndex + 1)}>
              下一张
            </ActionButton>
          </div>
          <ActionButton variant="ghost" hint="打开所在文件夹" onClick={handleOpenFolder}>
            打开文件夹
          </ActionButton>
        </footer>
      </div>
    </div>
  );
}
