import { useEffect, useState } from "react";
import ActionButton from "../components/ActionButton";
import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";
import {
  colorizeLibraryPage,
  colorizeLibraryRange,
  exportLibraryPdf,
  getLibraryBook,
  getLibraryBookPage,
  openFolder,
  setLibraryCurrentPage
} from "../lib/api";

const zoomPresets = [
  { key: "fit-width", label: "适合宽度", value: "fit-width" },
  { key: "fit-height", label: "适合高度", value: "fit-height" },
  { key: "100%", label: "100%", value: "100%" }
];

export default function Reader({ currentBookId, readerSettings, onReaderSettingsChange, onBookLoaded, readerJobStatus, env, onOpenQueue }) {
  const [manifest, setManifest] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [pageInput, setPageInput] = useState("1");
  const [viewMode, setViewMode] = useState("color");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    async function loadBook() {
      if (!currentBookId) {
        setManifest(null);
        setPageData(null);
        return;
      }
      const nextManifest = await getLibraryBook(currentBookId);
      setManifest(nextManifest);
      setPageInput(String(nextManifest.current_page || 1));
      const nextPage = await getLibraryBookPage(currentBookId, nextManifest.current_page || 1);
      setPageData(nextPage);
      onBookLoaded?.(nextManifest);
    }
    loadBook().catch((error) => console.error(error));
  }, [currentBookId, readerJobStatus?.progress]);

  const totalPages = manifest?.total_pages || 0;
  const currentPage = pageData?.page_number || manifest?.current_page || 1;
  const displayUrl = viewMode === "color" && pageData?.color_image_url ? pageData.color_image_url : pageData?.bw_image_url;

  const goToPage = async (pageNumber) => {
    if (!currentBookId || !manifest) {
      return;
    }
    const safePage = Math.min(Math.max(pageNumber, 1), manifest.total_pages);
    await setLibraryCurrentPage(currentBookId, safePage);
    const nextPage = await getLibraryBookPage(currentBookId, safePage);
    setPageData(nextPage);
    setPageInput(String(safePage));
  };

  const runAction = async (work) => {
    setBusy(true);
    try {
      await work();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="page-stack">
      <MangaCard title="阅读器" subtitle="单页阅读、逐页上色与整本缓存。">
        {!currentBookId || !manifest ? (
          <div className="gallery-status-empty">还没有选中的书。先去书库页导入一本漫画，再进入阅读器。</div>
        ) : (
          <div className="reader-layout">
            <aside className="reader-sidebar">
              <div className="reader-book-title">{manifest.title}</div>
              <div className="reader-book-meta">共 {manifest.total_pages} 页 · 已上色 {manifest.colorized_pages?.length || 0} 页</div>
              <div className="reader-toolbar">
                <ActionButton variant="secondary" disabled={currentPage <= 1} onClick={() => goToPage(currentPage - 1)}>
                  上一页
                </ActionButton>
                <ActionButton variant="secondary" disabled={currentPage >= totalPages} onClick={() => goToPage(currentPage + 1)}>
                  下一页
                </ActionButton>
              </div>
              <div className="field-group">
                <label className="field-label">页码跳转</label>
                <div className="reader-jump-row">
                  <input className="path-input" value={pageInput} onChange={(event) => setPageInput(event.target.value)} />
                  <ActionButton variant="ghost" onClick={() => goToPage(Number(pageInput) || 1)}>
                    跳转
                  </ActionButton>
                </div>
              </div>
              <div className="reader-toolbar">
                <ActionButton variant={viewMode === "bw" ? "secondary" : "ghost"} onClick={() => setViewMode("bw")}>
                  黑白
                </ActionButton>
                <ActionButton variant={viewMode === "color" ? "secondary" : "ghost"} onClick={() => setViewMode("color")}>
                  彩色
                </ActionButton>
              </div>
              <div className="reader-toolbar reader-toolbar-wrap">
                {zoomPresets.map((preset) => (
                  <ActionButton
                    key={preset.key}
                    variant={readerSettings.defaultZoom === preset.value ? "secondary" : "ghost"}
                    onClick={() => onReaderSettingsChange({ ...readerSettings, defaultZoom: preset.value })}
                  >
                    {preset.label}
                  </ActionButton>
                ))}
                <ActionButton variant="ghost" onClick={() => onReaderSettingsChange({ ...readerSettings, defaultZoom: "zoom-in" })}>
                  放大
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => onReaderSettingsChange({ ...readerSettings, defaultZoom: "zoom-out" })}>
                  缩小
                </ActionButton>
              </div>
              <div className="reader-toolbar reader-toolbar-wrap">
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
              <div className="reader-toolbar reader-toolbar-wrap">
                <StatusBadge tone={pageData?.is_colorized ? "ok" : "warn"}>{pageData?.is_colorized ? "当前页已有彩色缓存" : "当前页仍为黑白页"}</StatusBadge>
                <StatusBadge tone={env?.weightsReady ? "ok" : "missing"}>{env?.weightsReady ? "模型可用" : "模型权重缺失"}</StatusBadge>
              </div>
              <div className="reader-toolbar reader-toolbar-wrap">
                <ActionButton loading={busy} disabled={!env?.weightsReady} onClick={() => runAction(() => colorizeLibraryPage(currentBookId, currentPage))}>
                  上色当前页
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() => runAction(() => colorizeLibraryRange(currentBookId, currentPage, Math.min(currentPage + 4, totalPages)))}
                >
                  上色后 5 页
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() => runAction(() => colorizeLibraryRange(currentBookId))}
                >
                  整本上色
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => runAction(() => exportLibraryPdf(currentBookId))}>
                  导出彩色 PDF
                </ActionButton>
                <ActionButton variant="ghost" onClick={() => openFolder(`library\\books\\${currentBookId}`)}>
                  打开书籍目录
                </ActionButton>
                <ActionButton variant="ghost" onClick={onOpenQueue}>
                  查看队列
                </ActionButton>
              </div>
            </aside>

            <div className="reader-stage">
              <div className="reader-stage-meta">
                <div>第 {currentPage} / {totalPages} 页</div>
                <div>阅读模式：单页，双页模式稍后开放</div>
              </div>
              <div className={`reader-canvas zoom-${readerSettings.defaultZoom}`}>
                {displayUrl ? <img src={displayUrl} alt={`${manifest.title} 第 ${currentPage} 页`} className="reader-page-image" /> : null}
              </div>
            </div>
          </div>
        )}
      </MangaCard>
    </div>
  );
}
