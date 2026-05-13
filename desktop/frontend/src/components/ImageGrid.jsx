import EmptyState from "./EmptyState";

export default function ImageGrid({ items = [], onSelect, onDeleteRequest, emptyTitle = "暂无图片", emptyDescription = "导入或上色后，缩略图会显示在这里。" }) {
  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="image-grid">
      {items.map((item) => (
        <div key={item.path || item.previewUrl} className="image-tile-shell">
          <button type="button" className="image-tile" onClick={() => onSelect?.(item)}>
            <div className="image-tile-frame">
              <img src={item.previewUrl} alt={item.name} className="image-tile-img" loading="lazy" />
            </div>
            <div className="image-tile-label">{item.caption || item.name}</div>
          </button>
          {onDeleteRequest ? (
            <button
              type="button"
              className="image-tile-delete-overlay"
              aria-label={`删除 ${item.name}`}
              title="删除"
              onClick={() => onDeleteRequest(item)}
            >
              ×
            </button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
