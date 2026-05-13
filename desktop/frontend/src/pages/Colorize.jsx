import { useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import MangaCard from "../components/MangaCard";
import LogPanel from "../components/LogPanel";
import ProgressStrip from "../components/ProgressStrip";

export default function Colorize({ logs, projectStatus, onStartColorize, running }) {
  const defaultPdf = useMemo(() => {
    if (projectStatus?.inputPdfDefault) {
      return projectStatus.inputPdfDefault;
    }
    return "input/pdf/chapter01.pdf";
  }, [projectStatus]);

  const [inputType, setInputType] = useState("pages");
  const [pdfPath, setPdfPath] = useState(defaultPdf);
  const [message, setMessage] = useState("");

  async function handleStart() {
    setMessage("");
    const payload = {
      inputType,
      inputPath: inputType === "pages" ? "input/pages_bw" : pdfPath
    };

    try {
      const response = await onStartColorize(payload);
      setMessage(response.message || "任务已提交。");
    } catch (error) {
      setMessage(error.message);
    }
  }

  return (
    <div className="page-stack">
      <MangaCard title="自动上色任务">
        <div className="field-group">
          <label className="field-label">输入类型</label>
          <div className="segmented">
            <button className={inputType === "pages" ? "active" : ""} onClick={() => setInputType("pages")} type="button">
              图片文件夹
            </button>
            <button className={inputType === "pdf" ? "active" : ""} onClick={() => setInputType("pdf")} type="button">
              PDF
            </button>
          </div>
        </div>

        {inputType === "pages" ? (
          <div className="field-group">
            <label className="field-label">图片文件夹</label>
            <input className="path-input" value="input/pages_bw" readOnly />
          </div>
        ) : (
          <div className="field-group">
            <label className="field-label">PDF 路径</label>
            <input className="path-input" value={pdfPath} onChange={(event) => setPdfPath(event.target.value)} />
          </div>
        )}

        <div className="field-group">
          <label className="field-label">输出位置</label>
          <div className="hint-box">
            <div>彩色图片：output/colorized_fixed</div>
            <div>最终 PDF：output/final_pdf</div>
          </div>
        </div>

        <div className="button-row">
          <ActionButton onClick={handleStart} disabled={running}>开始上色</ActionButton>
        </div>
        <ProgressStrip running={running} message={message || "当前不做 reference 模式。"} />
      </MangaCard>

      <LogPanel title="最近日志" content={logs?.pipelineLog} />
      <LogPanel title="错误日志" content={logs?.errorLog} emptyText="error.log 为空，当前没有错误。" />
    </div>
  );
}
