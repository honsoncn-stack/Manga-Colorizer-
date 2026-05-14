import ActionButton from "../components/ActionButton";
import LogPanel from "../components/LogPanel";
import MangaCard from "../components/MangaCard";
import ProgressStrip, { readerProgressAliases } from "../components/ProgressStrip";
import StatusBadge from "../components/StatusBadge";

const stages = ["等待", "准备中", "上色中", "完成", "失败"];

export default function ColorizeQueue({ readerJobStatus, logs, books = [], onRefresh }) {
  const currentBook = books.find((book) => book.book_id === readerJobStatus?.book_id);

  return (
    <div className="page-stack">
      <ProgressStrip
        currentStep={readerJobStatus?.current_step || "Waiting"}
        status={readerJobStatus?.status || "idle"}
        progress={readerJobStatus?.progress || 0}
        message={
          readerJobStatus?.running
            ? `当前任务：${currentBook?.title || readerJobStatus?.book_id || "-"} / 第 ${readerJobStatus?.current_page || "-"} 页`
            : "当前没有阅读器上色任务。"
        }
        stages={stages}
        aliases={readerProgressAliases}
      />

      <div className="two-column-grid">
        <MangaCard title="当前任务" subtitle="阅读器上色队列的实时状态。">
          <ul className="info-list">
            <li>状态：{readerJobStatus?.status || "idle"}</li>
            <li>书籍：{currentBook?.title || readerJobStatus?.book_id || "-"}</li>
            <li>当前页：{readerJobStatus?.current_page || "-"}</li>
            <li>进度：{readerJobStatus?.progress ?? 0}%</li>
            <li>成功页数：{readerJobStatus?.success_count ?? 0}</li>
            <li>失败页数：{readerJobStatus?.failure_count ?? 0}</li>
          </ul>
          <div className="gallery-status-badges">
            <StatusBadge tone={readerJobStatus?.running ? "running" : "neutral"}>{readerJobStatus?.running ? "运行中" : "空闲"}</StatusBadge>
            <StatusBadge tone={readerJobStatus?.last_error ? "warn" : "ok"}>{readerJobStatus?.last_error ? "存在错误" : "暂无错误"}</StatusBadge>
          </div>
          <div className="button-row">
            <ActionButton variant="ghost" onClick={onRefresh}>
              刷新
            </ActionButton>
            <ActionButton variant="secondary" disabled hint="停止任务功能稍后提供">
              Coming soon
            </ActionButton>
          </div>
        </MangaCard>

        <MangaCard title="等待队列" subtitle="批量上色时的剩余页列表。">
          {readerJobStatus?.queue?.length ? (
            <div className="queue-list">
              {readerJobStatus.queue.map((page) => (
                <span key={page} className="queue-chip">
                  第 {page} 页
                </span>
              ))}
            </div>
          ) : (
            <div className="gallery-status-empty">当前没有等待中的书页。</div>
          )}
        </MangaCard>
      </div>

      <LogPanel title="reader_colorize.log" content={logs?.readerLog} emptyText="暂无阅读器上色日志。" />
    </div>
  );
}
