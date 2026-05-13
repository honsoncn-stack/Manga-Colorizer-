import { FolderCog, GalleryHorizontal, LayoutDashboard, Logs, Sparkles } from "lucide-react";

const items = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "colorize", label: "Colorize", icon: Sparkles },
  { key: "gallery", label: "Gallery", icon: GalleryHorizontal },
  { key: "logs", label: "Logs", icon: Logs },
  { key: "settings", label: "Settings", icon: FolderCog }
];

export default function Sidebar({ currentPage, onChange }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 64 64" aria-hidden="true">
            <path d="M16 52 28 12l20 20-40 20 8 0z" fill="none" stroke="currentColor" strokeWidth="4" />
            <path d="M30 16 46 32" stroke="currentColor" strokeWidth="4" />
          </svg>
        </div>
        <div>
          <div className="brand-title">Manga Auto</div>
          <div className="brand-subtitle">Colorizer</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {items.map((item) => {
          const Icon = item.icon;
          const active = currentPage === item.key;
          return (
            <button
              key={item.key}
              className={`sidebar-link ${active ? "is-active" : ""}`}
              onClick={() => onChange(item.key)}
              type="button"
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
