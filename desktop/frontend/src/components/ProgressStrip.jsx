import StatusBadge from "./StatusBadge";

export default function ProgressStrip({ running, message }) {
  return (
    <div className="progress-strip">
      <StatusBadge tone={running ? "pink" : "cyan"}>{running ? "运行中" : "空闲"}</StatusBadge>
      <span>{message}</span>
    </div>
  );
}
