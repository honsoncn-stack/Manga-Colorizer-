export default function MangaCard({ title, extra, children }) {
  return (
    <section className="manga-card">
      {(title || extra) && (
        <div className="manga-card-header">
          <div className="manga-card-title">{title}</div>
          <div>{extra}</div>
        </div>
      )}
      <div className="manga-card-body">{children}</div>
    </section>
  );
}
