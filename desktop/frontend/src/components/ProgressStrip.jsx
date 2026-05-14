const DEFAULT_STAGES = ["等待", "准备中", "预处理", "上色中", "线稿回叠", "质量检查", "导出 PDF", "完成", "失败"];

const DEFAULT_ALIASES = {
  Waiting: "等待",
  Preparing: "准备中",
  Preprocessing: "预处理",
  Colorizing: "上色中",
  "Preserving Lines": "线稿回叠",
  "Quality Check": "质量检查",
  "Exporting PDF": "导出 PDF",
  Done: "完成",
  Failed: "失败",
};

const READER_ALIASES = {
  Waiting: "等待",
  Preparing: "准备中",
  Colorizing: "上色中",
  Done: "完成",
  Failed: "失败",
};

export default function ProgressStrip({
  currentStep = "Waiting",
  status = "idle",
  progress = 0,
  message = "",
  stages = DEFAULT_STAGES,
  aliases = DEFAULT_ALIASES,
}) {
  const normalizedStep = aliases[String(currentStep)] || String(currentStep);
  const activeIndex = stages.findIndex((stage) => stage === normalizedStep);
  const safeProgress = Math.max(0, Math.min(100, Number(progress) || 0));
  const displayStep = normalizedStep || "等待";

  return (
    <div className="progress-strip manga-card">
      <div className="progress-strip-head">
        <div>
          <div className="progress-strip-title">任务进度</div>
          <div className="progress-strip-subtitle">{message || `当前阶段：${displayStep}`}</div>
        </div>
        <div className="progress-strip-percent">{safeProgress}%</div>
      </div>
      <div className="progress-strip-bar">
        <div className={`progress-strip-fill status-${status}`} style={{ width: `${safeProgress}%` }} />
      </div>
      <div className="progress-stage-row">
        {stages.map((stage, index) => {
          const isActive = index === activeIndex;
          const isDone = activeIndex >= 0 && index < activeIndex;
          return (
            <div key={stage} className={`progress-stage ${isActive ? "is-active" : ""} ${isDone ? "is-done" : ""}`}>
              {stage}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export const readerProgressAliases = READER_ALIASES;
