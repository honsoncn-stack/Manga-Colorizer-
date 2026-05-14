import { memo, useState } from "react";
import EmptyState from "./EmptyState";

function galleryItemKey(item) {
  return item.file_path || item.path || `${item.source}-${item.book_id || "pipeline"}-${item.page_number || item.filename}-${item.filename}`;
}

const GalleryTile = memo(function GalleryTile({ item, index, onSelect, onDeleteRequest, selectable, selected, onToggleSelect }) {
  const [broken, setBroken] = useState(false);
  const imageSrc = !broken ? item.thumb_url || item.image_url : "";
  const imageAlt = item.book_title ? `${item.book_title} 第 ${item.page_number || "-"} 页` : item.filename;
  const itemKey = galleryItemKey(item);

  return (
    <div key={itemKey} className={`image-tile-shell ${selected ? "is-selected" : ""}`.trim()}>
      <button type="button" className="image-tile" onClick={() => onSelect?.(index)}>
        <div className="image-tile-frame">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={imageAlt}
              className="image-tile-img"
              loading="lazy"
              decoding="async"
              onError={() => setBroken(true)}
            />
          ) : (
            <div className="image-tile-placeholder">缩略图不可用</div>
          )}
        </div>
        <div className="image-tile-label">{item.caption || item.filename}</div>
      </button>
      {selectable ? (
        <label className="image-tile-select" title="选择这张图">
          <input type="checkbox" checked={selected} onChange={() => onToggleSelect?.(item)} />
          <span>{selected ? "已选" : "选择"}</span>
        </label>
      ) : null}
      {onDeleteRequest && item.file_path ? (
        <button
          type="button"
          className="image-tile-delete-overlay"
          aria-label={`删除 ${item.caption || item.filename}`}
          title="删除"
          onClick={() => onDeleteRequest(item)}
        >
          ×
        </button>
      ) : null}
    </div>
  );
});

export default function ImageGrid({
  items = [],
  onSelect,
  onDeleteRequest,
  selectable = false,
  selectedKeys = [],
  onToggleSelect,
  emptyTitle = "暂无图片",
  emptyDescription = "导入或上色后，缩略图会显示在这里。",
  loading = false,
}) {
  const selectedKeySet = new Set(selectedKeys);

  if (loading) {
    return (
      <div className="image-grid image-grid-skeleton">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={`skeleton-${index}`} className="image-tile-shell">
            <div className="image-tile-frame image-skeleton-block" />
            <div className="image-skeleton-text" />
          </div>
        ))}
      </div>
    );
  }

  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="image-grid">
      {items.map((item, index) => (
        <GalleryTile
          key={`${item.source}-${item.book_id || "pipeline"}-${item.page_number || item.filename}-${item.filename}`}
          item={item}
          index={index}
          onSelect={onSelect}
          onDeleteRequest={onDeleteRequest}
          selectable={selectable}
          selected={selectedKeySet.has(galleryItemKey(item))}
          onToggleSelect={onToggleSelect}
        />
      ))}
    </div>
  );
}

export { galleryItemKey };
