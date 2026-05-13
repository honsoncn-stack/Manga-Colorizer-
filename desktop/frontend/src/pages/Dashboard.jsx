import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";
import ActionButton from "../components/ActionButton";

export default function Dashboard({ env, projectStatus, onNavigate }) {
  const cards = [
    { label: "项目目录", value: projectStatus?.projectRoot || "-" },
    { label: "最近输出", value: `${projectStatus?.recentOutputCount ?? 0} 张` },
    { label: "待复核", value: `${projectStatus?.needsReviewCount ?? 0} 张` },
    { label: "CUDA", value: env?.cudaAvailable ? "可用" : "CPU 模式" }
  ];

  return (
    <div className="page-stack">
      <div className="stat-grid">
        {cards.map((card) => (
          <MangaCard key={card.label} title={card.label}>
            <div className="metric-value-large">{card.value}</div>
          </MangaCard>
        ))}
      </div>

      <div className="two-column-grid">
        <MangaCard
          title="环境状态"
          extra={<StatusBadge tone={env?.pythonPathOk ? "cyan" : "warning"}>{env?.pythonPathOk ? "OK" : "异常"}</StatusBadge>}
        >
          <ul className="info-list">
            <li>Python：{env?.pythonPath || "-"}</li>
            <li>torch：{env?.torchImport ? "已就绪" : "缺失"}</li>
            <li>CUDA：{env?.cudaAvailable ? "可用" : "不可用"}</li>
            <li>模型仓库：{env?.repoExists ? "已接入" : "缺失"}</li>
            <li>权重状态：{env?.weightsReady ? "可运行" : "缺失"}</li>
          </ul>
        </MangaCard>

        <MangaCard title="快捷操作">
          <div className="button-row">
            <ActionButton onClick={() => onNavigate("colorize")}>开始上色</ActionButton>
            <ActionButton tone="cyan" onClick={() => onNavigate("gallery")}>查看结果</ActionButton>
            <ActionButton tone="ghost" onClick={() => onNavigate("logs")}>查看日志</ActionButton>
          </div>
        </MangaCard>
      </div>
    </div>
  );
}
