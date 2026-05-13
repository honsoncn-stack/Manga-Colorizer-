import ActionButton from "../components/ActionButton";
import LogPanel from "../components/LogPanel";
import MangaCard from "../components/MangaCard";

export default function Logs({ logs, onRefresh }) {
  return (
    <div className="page-stack">
      <MangaCard title="任务情报板" extra={<ActionButton tone="ghost" onClick={onRefresh}>刷新日志</ActionButton>}>
        <div className="logs-grid">
          <LogPanel title="pipeline.log" content={logs?.pipelineLog} />
          <LogPanel title="error.log" content={logs?.errorLog} emptyText="错误日志为空，状态正常。" />
          <LogPanel title="backend.log" content={logs?.backendLog} />
        </div>
      </MangaCard>
    </div>
  );
}
