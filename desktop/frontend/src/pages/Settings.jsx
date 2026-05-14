import { useState } from "react";

import ActionButton from "../components/ActionButton";
import ConfirmDialog from "../components/ConfirmDialog";
import MangaCard from "../components/MangaCard";
import PathField from "../components/PathField";
import { projectPaths } from "../lib/paths";

const cleanupCopy = {
  outputs: {
    title: "清理旧流水线输出",
    message: "将删除 output、logs、reports 里的旧流水线输出、日志和报告文件。\n\n不会删除书库、原始图片、模型权重或安装包。",
    confirmLabel: "清理旧输出",
  },
  libraryCache: {
    title: "清理阅读器彩图缓存",
    message: "将删除所有书籍的 pages_color 彩色缓存和 export 导出 PDF，并重置已上色页数。\n\n会保留黑白原图、缩略图、书籍记录和书库索引。",
    confirmLabel: "清理彩图缓存",
  },
};

export default function Settings({
  projectStatus,
  readerSettings,
  onReaderSettingsChange,
  onCleanOutputs,
  onRefreshEnv,
  onOpenProjectFolder,
  onOpenLibraryFolder,
  onClearLibraryCache,
}) {
  const [pendingCleanup, setPendingCleanup] = useState(null);
  const cleanupDialog = pendingCleanup ? cleanupCopy[pendingCleanup] : null;

  const confirmCleanup = async () => {
    const cleanupTarget = pendingCleanup;
    setPendingCleanup(null);
    if (cleanupTarget === "outputs") {
      await onCleanOutputs();
    } else if (cleanupTarget === "libraryCache") {
      await onClearLibraryCache();
    }
  };

  return (
    <div className="page-stack">
      <MangaCard title="工作台设置" subtitle="项目路径、书库路径与阅读器偏好。">
        <div className="settings-grid">
          <PathField label="项目根目录" value={projectPaths.projectRoot} readOnly compact />
          <PathField label="Python 路径" value={projectPaths.pythonPath} readOnly compact />
          <PathField label="书库路径" value={projectStatus?.libraryDir || projectPaths.libraryRoot} readOnly compact />
          <PathField label="输入图片目录" value={projectStatus?.inputPagesDir || projectPaths.inputPages} readOnly compact />
          <PathField label="输入 PDF 目录" value={projectStatus?.inputPdfDir || projectPaths.inputPdf} readOnly compact />
          <PathField label="输出目录" value={projectStatus?.outputDir || projectPaths.outputRoot} readOnly compact />
          <PathField label="最终 PDF 目录" value={projectStatus?.outputFinalPdfDir || projectPaths.outputFinalPdf} readOnly compact />
          <PathField label="日志目录" value={projectStatus?.logsDir || projectPaths.logsDir} readOnly compact />
        </div>
      </MangaCard>

      <div className="two-column-grid">
        <MangaCard title="阅读偏好" subtitle="这些设置保存在桌面端本地。">
          <div className="field-group">
            <label className="field-label">阅读方向</label>
            <div className="button-row">
              <ActionButton
                variant={readerSettings.readingDirection === "ltr" ? "secondary" : "ghost"}
                onClick={() => onReaderSettingsChange({ ...readerSettings, readingDirection: "ltr" })}
              >
                从左到右
              </ActionButton>
              <ActionButton
                variant={readerSettings.readingDirection === "rtl" ? "secondary" : "ghost"}
                onClick={() => onReaderSettingsChange({ ...readerSettings, readingDirection: "rtl" })}
              >
                从右到左
              </ActionButton>
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">默认缩放</label>
            <div className="button-row">
              {[{ value: "fit-width", label: "适合宽度" }, { value: "fit-height", label: "适合高度" }, { value: "100%", label: "原始比例" }].map((zoomOption) => (
                <ActionButton
                  key={zoomOption.value}
                  variant={readerSettings.defaultZoom === zoomOption.value ? "secondary" : "ghost"}
                  onClick={() => onReaderSettingsChange({ ...readerSettings, defaultZoom: zoomOption.value })}
                >
                  {zoomOption.label}
                </ActionButton>
              ))}
            </div>
          </div>
          <div className="field-group">
            <label className="field-label">滚轮翻页</label>
            <div className="button-row">
              <ActionButton
                variant={readerSettings.wheelPageTurn ? "secondary" : "ghost"}
                onClick={() => onReaderSettingsChange({ ...readerSettings, wheelPageTurn: !readerSettings.wheelPageTurn })}
              >
                {readerSettings.wheelPageTurn ? "已开启" : "已关闭"}
              </ActionButton>
            </div>
          </div>
        </MangaCard>

        <MangaCard title="维护操作" subtitle="环境检查、书库缓存和旧输出清理。">
          <div className="button-row">
            <ActionButton variant="secondary" hint="重新读取环境状态" onClick={onRefreshEnv}>
              环境检查
            </ActionButton>
            <ActionButton variant="ghost" hint="打开项目根目录" onClick={onOpenProjectFolder}>
              打开项目目录
            </ActionButton>
            <ActionButton variant="ghost" hint="打开本地书库目录" onClick={onOpenLibraryFolder}>
              打开书库目录
            </ActionButton>
            <ActionButton variant="danger" hint="清理 output、logs、reports 里的旧流水线文件" onClick={() => setPendingCleanup("outputs")}>
              清理旧流水线输出
            </ActionButton>
            <ActionButton variant="danger" hint="删除书库彩色页和导出 PDF，保留原图和书籍记录" onClick={() => setPendingCleanup("libraryCache")}>
              清理阅读器彩图缓存
            </ActionButton>
          </div>
        </MangaCard>
      </div>

      {cleanupDialog ? (
        <ConfirmDialog
          title={cleanupDialog.title}
          message={cleanupDialog.message}
          confirmLabel={cleanupDialog.confirmLabel}
          cancelLabel="取消"
          onConfirm={confirmCleanup}
          onCancel={() => setPendingCleanup(null)}
        />
      ) : null}
    </div>
  );
}
