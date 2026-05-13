import { RefreshCcw } from "lucide-react";
import ActionButton from "./ActionButton";
import StatusBadge from "./StatusBadge";

export default function TopBar({ title, subtitle, env, health, jobStatus, readerJobStatus, onRefresh }) {
  const modelTone = env?.weightsReady ? "ok" : "missing";
  const backendTone = health?.status === "ok" ? "ok" : "error";
  const cudaTone = env?.cudaAvailable ? "ok" : "warn";
  const readerTone = readerJobStatus?.running ? "running" : readerJobStatus?.status === "failed" ? "error" : "neutral";

  return (
    <header className="topbar">
      <div>
        <div className="topbar-title">{title || "Manga Auto Colorizer"}</div>
        <div className="topbar-subtitle">{subtitle}</div>
      </div>
      <div className="topbar-right">
        <div className="topbar-badges">
          <StatusBadge tone={backendTone}>后端 {health?.status === "ok" ? "正常" : "异常"}</StatusBadge>
          <StatusBadge tone={env?.pythonPathOk ? "ok" : "warn"}>Python {env?.pythonPathOk ? "匹配" : "待检查"}</StatusBadge>
          <StatusBadge tone={cudaTone}>CUDA {env?.cudaAvailable ? "可用" : "CPU"}</StatusBadge>
          <StatusBadge tone={modelTone}>模型 {env?.weightsReady ? "已就绪" : "缺失"}</StatusBadge>
          <StatusBadge tone={readerTone}>阅读器任务 {readerJobStatus?.status || jobStatus?.status || "idle"}</StatusBadge>
        </div>
        <ActionButton variant="ghost" hint="刷新状态与日志" onClick={onRefresh}>
          <RefreshCcw size={16} />
          刷新
        </ActionButton>
      </div>
    </header>
  );
}
