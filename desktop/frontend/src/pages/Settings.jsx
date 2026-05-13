import ActionButton from "../components/ActionButton";
import MangaCard from "../components/MangaCard";
import { projectPaths } from "../lib/paths";

export default function Settings({ env, onCleanOutputs, onRefreshEnv }) {
  return (
    <div className="page-stack">
      <MangaCard title="项目路径">
        <ul className="info-list">
          <li>项目路径：{projectPaths.projectRoot}</li>
          <li>Python：{projectPaths.pythonPath}</li>
          <li>input/pages_bw：{projectPaths.inputPages}</li>
          <li>input/pdf：{projectPaths.inputPdf}</li>
          <li>output/colorized_fixed：{projectPaths.outputFixed}</li>
          <li>output/final_pdf：{projectPaths.outputFinalPdf}</li>
        </ul>
      </MangaCard>

      <MangaCard title="维护操作">
        <div className="button-row">
          <ActionButton tone="warning" onClick={onCleanOutputs}>清理输出</ActionButton>
          <ActionButton tone="cyan" onClick={onRefreshEnv}>环境检查</ActionButton>
        </div>
      </MangaCard>

      <MangaCard title="环境明细">
        <ul className="info-list">
          <li>目标 Python：{env?.pythonPath || "-"}</li>
          <li>仓库：{env?.repoExists ? "存在" : "缺失"}</li>
          <li>inference.py：{env?.inferenceExists ? "存在" : "缺失"}</li>
          <li>权重：{env?.weightsReady ? "已就绪" : "缺失"}</li>
          <li>CUDA：{env?.cudaAvailable ? "可用" : "不可用"}</li>
        </ul>
      </MangaCard>
    </div>
  );
}
