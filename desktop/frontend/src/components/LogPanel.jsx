export default function LogPanel({ title, content, emptyText = "暂无日志。" }) {
  return (
    <div className="log-panel">
      <div className="log-panel-title">{title}</div>
      <pre>{content || emptyText}</pre>
    </div>
  );
}
