import { useState } from "react";
import ActionButton from "../components/ActionButton";
import LogPanel from "../components/LogPanel";
import MangaCard from "../components/MangaCard";

const tabs = [
  { key: "pipeline", label: "上色记录" },
  { key: "error", label: "错误记录" },
  { key: "backend", label: "应用记录" },
  { key: "reader", label: "阅读记录" },
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

  const emptyText = activeTab === "error" ? "没有错误记录。" : "暂无记录。";

  return (
    <div className="page-stack">
      <MangaCard
        title="运行记录"
        subtitle="上色、阅读和应用运行记录都集中在这里。遇到 Bug 时，可以把错误记录复制到 GitHub Issues 反馈。"
        actions={
          <ActionButton variant="ghost" hint="重新读取记录" onClick={onRefresh}>
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
        <LogPanel title={tabs.find((tab) => tab.key === activeTab)?.label || "记录"} content={logContent} emptyText={emptyText} />
      </MangaCard>
    </div>
  );
}
