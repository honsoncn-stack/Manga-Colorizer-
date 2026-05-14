import { RefreshCcw } from "lucide-react";
import ActionButton from "./ActionButton";

export default function TopBar({ title, subtitle, onRefresh }) {
  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title || "Manga Auto Colorizer"}</div>
        <div className="topbar-subtitle">{subtitle}</div>
      </div>
      <div className="topbar-right">
        <ActionButton variant="ghost" hint="刷新状态与日志" onClick={onRefresh}>
          <RefreshCcw size={16} />
          刷新
        </ActionButton>
      </div>
    </header>
  );
}
