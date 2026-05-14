import ActionButton from "../components/ActionButton";
import MangaCard from "../components/MangaCard";
import PathField from "../components/PathField";
import { projectPaths } from "../lib/paths";

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
            <label className="field-label">自动预取后续页</label>
            <div className="button-row">
              <ActionButton
                variant={readerSettings.autoPrefetchNextPages ? "secondary" : "ghost"}
                onClick={() => onReaderSettingsChange({ ...readerSettings, autoPrefetchNextPages: !readerSettings.autoPrefetchNextPages })}
              >
                {readerSettings.autoPrefetchNextPages ? "已开启" : "已关闭"}
              </ActionButton>
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

        <MangaCard title="维护操作" subtitle="环境检查、书库缓存和输出清理。">
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
            <ActionButton variant="danger" hint="清理旧的临时彩图" onClick={onCleanOutputs}>
              清理输出
            </ActionButton>
            <ActionButton variant="danger" hint="清理阅读器彩色缓存和导出 PDF" onClick={onClearLibraryCache}>
              清理阅读器缓存
            </ActionButton>
          </div>
        </MangaCard>
      </div>
    </div>
  );
}
