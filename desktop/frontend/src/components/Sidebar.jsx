import { BookOpen, FolderCog, Image, Info, LayoutDashboard, Library, ScrollText, Sparkles } from "lucide-react";
import StatusBadge from "./StatusBadge";

const items = [
  { key: "dashboard", label: "总览", hint: "工作台主页", icon: LayoutDashboard },
  { key: "library", label: "书库", hint: "导入与管理", icon: Library },
  { key: "reader", label: "阅读器", hint: "单页阅读", icon: BookOpen },
  { key: "queue", label: "上色队列", hint: "任务与日志", icon: Sparkles },
  { key: "gallery", label: "图库", hint: "输出预览", icon: Image },
  { key: "logs", label: "日志", hint: "后端与流水线", icon: ScrollText },
  { key: "settings", label: "设置", hint: "路径与阅读偏好", icon: FolderCog },
  { key: "about", label: "关于", hint: "版本与说明", icon: Info }
];

export default function Sidebar({ currentPage, onChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <img src={new URL("../assets/logo-mark.svg", import.meta.url).href} alt="" className="brand-mark" />
        <div>
          <div className="brand-title">Manga Auto Colorizer</div>
          <div className="brand-subtitle">本地漫画上色阅读器</div>
        </div>
      </div>

      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.key;
          return (
            <button key={item.key} className={`sidebar-link ${active ? "is-active" : ""}`} onClick={() => onChange(item.key)} type="button">
              <Icon size={18} />
              <span className="sidebar-link-copy">
                <span className="sidebar-link-title">{item.label}</span>
                <span className="sidebar-link-hint">{item.hint}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <StatusBadge tone="ok">仅自动上色</StatusBadge>
        <StatusBadge tone="neutral">本地阅读器模式</StatusBadge>
      </div>
    </aside>
  );
}
