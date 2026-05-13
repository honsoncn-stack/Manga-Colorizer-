export default function MangaCard({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`manga-card ${className}`.trim()}>
      {(title || subtitle || actions) && (
        <header className="manga-card-header">
          <div>
            {title ? <h2 className="manga-card-title">{title}</h2> : null}
            {subtitle ? <p className="manga-card-subtitle">{subtitle}</p> : null}
          </div>
          {actions ? <div className="manga-card-actions">{actions}</div> : null}
        </header>
      )}
      <div className="manga-card-body">{children}</div>
    </section>
  );
}
