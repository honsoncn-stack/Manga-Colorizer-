import { useEffect, useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import DropZone from "../components/DropZone";
import LogPanel from "../components/LogPanel";
import MangaCard from "../components/MangaCard";
import PathField from "../components/PathField";
import ProgressStrip from "../components/ProgressStrip";

export default function Colorize({ logs, projectStatus, jobStatus, onStartColorize, running }) {
  const defaultFolder = projectStatus?.inputPagesDir || "input/pages_bw";
  const defaultPdf = projectStatus?.inputPdfDefault || "input/pdf/chapter01.pdf";
  const [inputType, setInputType] = useState("pages");
  const [pagesPath, setPagesPath] = useState(defaultFolder);
  const [pdfPath, setPdfPath] = useState(defaultPdf);
  const [message, setMessage] = useState("");

  useEffect(() => {
    setPagesPath(defaultFolder);
  }, [defaultFolder]);

  useEffect(() => {
    setPdfPath(defaultPdf);
  }, [defaultPdf]);

  const selectedPath = inputType === "pages" ? pagesPath : pdfPath;
  const jobMessage = useMemo(() => {
    if (jobStatus?.status === "running") {
      return `当前阶段：${jobStatus.current_step || "准备中"}`;
    }
    if (jobStatus?.status === "failed") {
      return jobStatus.last_error || "任务失败";
    }
    if (message) {
      return message;
    }
    return "等待开始。";
  }, [jobStatus, message]);

  const handleStart = async () => {
    setMessage("");
    try {
      const response = await onStartColorize({
        inputType,
        inputPath: inputType === "pages" ? pagesPath : pdfPath
      });
      setMessage(response.message || "任务已启动");
    } catch (error) {
      setMessage(error.message);
    }
  };

  return (
    <div className="page-stack">
      <MangaCard title="自动上色工作室" subtitle="本地自动上色流程">
        <div className="two-column-grid colorize-grid">
          <div className="field-column">
            <div className="field-group">
              <label className="field-label">输入类型</label>
              <div className="segmented">
                <button className={inputType === "pages" ? "active" : ""} onClick={() => setInputType("pages")} type="button">
                  图片文件夹
                </button>
                <button className={inputType === "pdf" ? "active" : ""} onClick={() => setInputType("pdf")} type="button">
                  PDF 文件
                </button>
              </div>
            </div>

            {inputType === "pages" ? (
              <PathField
                label="图片文件夹路径"
                value={pagesPath}
                onChange={(event) => setPagesPath(event.target.value)}
                onPick={async () => {
                  const selected = await window.mangaAPI?.selectFolder?.();
                  if (selected) {
                    setPagesPath(selected);
                  }
                }}
              />
            ) : (
              <PathField
                label="PDF 路径"
                value={pdfPath}
                onChange={(event) => setPdfPath(event.target.value)}
                onPick={async () => {
                  const selected = await window.mangaAPI?.selectPdf?.();
                  if (selected) {
                    setPdfPath(selected);
                  }
                }}
                openTarget="file"
              />
            )}

            <DropZone
              mode={inputType === "pages" ? "folder" : "pdf"}
              label={inputType === "pages" ? "可拖入文件夹，或点击选择文件夹" : "可拖入 PDF，或点击选择 PDF"}
              hint="仅处理本地文件，不上传云端。"
              onSelectPath={(value) => {
                if (inputType === "pages") {
                  setPagesPath(value);
                } else {
                  setPdfPath(value);
                }
              }}
            />

            <div className="button-row">
              <ActionButton loading={running} disabled={running || jobStatus?.running} hint="启动自动上色任务" onClick={handleStart}>
                开始自动上色
              </ActionButton>
            </div>
          </div>

          <div className="field-column">
            <ProgressStrip currentStep={jobStatus?.current_step} status={jobStatus?.status} progress={jobStatus?.progress} message={jobMessage} />
            <MangaCard title="当前输入" subtitle="当前任务目标">
              <div className="selected-path">{selectedPath}</div>
            </MangaCard>
          </div>
        </div>
      </MangaCard>

      <LogPanel title="最近流水线日志" content={logs?.pipelineLog} />
      <LogPanel title="最近错误日志" content={logs?.errorLog} emptyText="暂无错误记录。" />
    </div>
  );
}
