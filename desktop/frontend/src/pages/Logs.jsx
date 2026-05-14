import { useState } from "react";
import ActionButton from "../components/ActionButton";
import LogPanel from "../components/LogPanel";
import MangaCard from "../components/MangaCard";

const tabs = [
  { key: "pipeline", label: "流水线日志" },
  { key: "error", label: "错误日志" },
  { key: "backend", label: "后端日志" },
  { key: "reader", label: "阅读器日志" },
];

export default function Logs({ logs, onRefresh }) {
  const [activeTab, setActiveTab] = useState("pipeline");
  const logContent =
    activeTab === "pipeline"
      ? logs?.pipelineLog
      : activeTab === "error"
        ? logs?.errorLog
        : activeTab === "backend"
          ? logs?.backendLog
          : logs?.readerLog;

  const emptyText = activeTab === "error" ? "没有错误记录。" : "暂无日志。";

  return (
    <div className="page-stack">
      <MangaCard
        title="运行日志"
        subtitle="流水线、阅读器与后端日志都集中在这里。"
        actions={
          <ActionButton variant="ghost" hint="重新读取日志" onClick={onRefresh}>
            刷新
          </ActionButton>
        }
      >
        <div className="tab-row">
          {tabs.map((tab) => (
            <button key={tab.key} type="button" className={`tab-pill ${activeTab === tab.key ? "is-active" : ""}`} onClick={() => setActiveTab(tab.key)}>
              {tab.label}
            </button>
          ))}
        </div>
        <LogPanel title={tabs.find((tab) => tab.key === activeTab)?.label || "日志"} content={logContent} emptyText={emptyText} />
      </MangaCard>
    </div>
  );
}
