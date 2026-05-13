import { RefreshCcw } from "lucide-react";
import ActionButton from "./ActionButton";
import StatusBadge from "./StatusBadge";

export default function TopBar({ title, subtitle, envStatus, onRefresh }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        <div className="topbar-subtitle">{subtitle}</div>
      </div>
      <div className="topbar-actions">
        <StatusBadge tone={envStatus === "ok" ? "cyan" : "warning"}>
          {envStatus === "ok" ? "环境就绪" : "需检查"}
        </StatusBadge>
        <ActionButton tone="ghost" onClick={onRefresh}>
          <RefreshCcw size={16} />
          刷新
        </ActionButton>
      </div>
    </header>
  );
}
