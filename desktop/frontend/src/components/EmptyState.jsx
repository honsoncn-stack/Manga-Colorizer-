export default function EmptyState({ title, description, action }) {
  return (
    <div className="empty-state">
      <div className="empty-state-title">{title}</div>
      <div className="empty-state-desc">{description}</div>
      {action ? <div className="empty-state-action">{action}</div> : null}
    </div>
  );
}
