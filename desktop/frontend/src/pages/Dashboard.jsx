import { BookOpen, Library, ScrollText } from "lucide-react";
import ActionButton from "../components/ActionButton";
import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";

export default function Dashboard({ env, projectStatus, jobStatus, readerJobStatus, libraryBooks, onNavigate, onContinueReading }) {
  const recentBook = projectStatus?.recentBook || libraryBooks?.[0] || null;
  const queueRunning = readerJobStatus?.running;
  const statCards = [
    { label: "Python", value: env?.pythonPathOk ? "已匹配" : "待检查", tone: env?.pythonPathOk ? "ok" : "warn" },
    { label: "CUDA", value: env?.cudaAvailable ? "可用" : "CPU", tone: env?.cudaAvailable ? "ok" : "warn" },
    { label: "模型", value: env?.weightsReady ? "已就绪" : "缺失", tone: env?.weightsReady ? "ok" : "missing" },
    { label: "书库数量", value: `${projectStatus?.libraryBookCount ?? 0} 本`, tone: "neutral" },
    { label: "最近输出", value: `${projectStatus?.recentOutputCount ?? 0} 页`, tone: "neutral" }
  ];

  return (
    <div className="page-stack dashboard-page">
      <div className="stat-grid">
        {statCards.map((card) => (
          <MangaCard key={card.label} title={card.label} subtitle={<StatusBadge tone={card.tone}>{card.value}</StatusBadge>}>
            <div className="dashboard-card-value">{card.value}</div>
          </MangaCard>
        ))}
      </div>

      <div className="two-column-grid">
        <MangaCard title="阅读器状态" subtitle="书库、最近阅读与上色队列">
          <ul className="info-list">
            <li>书库数量：{projectStatus?.libraryBookCount ?? 0}</li>
            <li>最近阅读：{recentBook?.title || "暂无"}</li>
            <li>阅读器任务：{readerJobStatus?.status || "idle"}</li>
            <li>上色成功页数：{readerJobStatus?.success_count ?? 0}</li>
            <li>上色失败页数：{readerJobStatus?.failure_count ?? 0}</li>
          </ul>
        </MangaCard>

        <MangaCard title="快捷操作" subtitle="导入书籍、继续阅读与查看队列">
          <div className="button-row">
            <ActionButton hint="进入书库导入本地漫画" onClick={() => onNavigate("library")}>
              导入书籍
            </ActionButton>
            <ActionButton variant="secondary" hint="回到最近一本继续阅读" disabled={!recentBook} onClick={() => onContinueReading(recentBook?.book_id)}>
              继续阅读
            </ActionButton>
            <ActionButton variant="ghost" hint="查看阅读器任务队列" onClick={() => onNavigate("queue")}>
              查看队列
            </ActionButton>
          </div>
        </MangaCard>
      </div>

      <div className="two-column-grid">
        <MangaCard
          title="最近书籍"
          subtitle="继续当前阅读进度"
          actions={<BookOpen size={18} aria-hidden="true" />}
        >
          {recentBook ? (
            <div className="recent-book-panel">
              {recentBook.cover_url ? <img src={recentBook.cover_url} alt={recentBook.title} className="recent-book-cover" /> : null}
              <div className="recent-book-copy">
                <div className="recent-book-title">{recentBook.title}</div>
                <div className="recent-book-meta">页数 {recentBook.total_pages} · 当前第 {recentBook.current_page} 页</div>
                <div className="recent-book-meta">已上色 {recentBook.colorized_count} 页</div>
              </div>
            </div>
          ) : (
            <div className="gallery-status-empty">还没有导入书籍。先去书库页导入图片文件夹、PDF 或 CBZ。</div>
          )}
        </MangaCard>

        <MangaCard title="入口导航" subtitle="旧工具输出与运维页面">
          <div className="dashboard-shortcuts">
            <button type="button" className="dashboard-shortcut" onClick={() => onNavigate("library")}>
              <Library size={18} />
              <span>打开书库</span>
            </button>
            <button type="button" className="dashboard-shortcut" onClick={() => onNavigate("gallery")}>
              <BookOpen size={18} />
              <span>查看输出</span>
            </button>
            <button type="button" className="dashboard-shortcut" onClick={() => onNavigate("logs")}>
              <ScrollText size={18} />
              <span>查看日志</span>
            </button>
          </div>
        </MangaCard>
      </div>
    </div>
  );
}
