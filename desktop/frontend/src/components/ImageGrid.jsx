export default function ImageGrid({ items = [] }) {
  if (!items.length) {
    return <div className="empty-state">暂无上色结果。</div>;
  }

  return (
    <div className="image-grid">
      {items.map((item) => (
        <figure className="image-tile" key={item.name}>
          <img src={item.previewUrl} alt={item.name} />
          <figcaption>{item.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
