import { memo, useState } from "react";
import EmptyState from "./EmptyState";

const GalleryTile = memo(function GalleryTile({ item, index, onSelect, onDeleteRequest }) {
  const [broken, setBroken] = useState(false);
  const imageSrc = !broken ? item.thumb_url || item.image_url : "";
  const imageAlt = item.book_title ? `${item.book_title} 第 ${item.page_number || "-"} 页` : item.filename;
  const itemKey = `${item.source}-${item.book_id || "pipeline"}-${item.page_number || item.filename}-${item.filename}`;

  return (
    <div key={itemKey} className="image-tile-shell">
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
      {onDeleteRequest && item.source === "pipeline" ? (
        <button
          type="button"
          className="image-tile-delete-overlay"
          aria-label={`删除 ${item.filename}`}
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
  emptyTitle = "暂无图片",
  emptyDescription = "导入或上色后，缩略图会显示在这里。",
  loading = false,
}) {
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
        />
      ))}
    </div>
  );
}
