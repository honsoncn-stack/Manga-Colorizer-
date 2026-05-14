import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  setLibraryCurrentPage,
} from "../lib/api";

const zoomPresets = [
  { key: "fit-width", label: "适合宽度", value: "fit-width" },
  { key: "fit-height", label: "适合高度", value: "fit-height" },
  { key: "100%", label: "100%", value: "100%" },
];

function formatPdfExportMessage(result) {
  if (!result || typeof result !== "object") {
    return "PDF 导出完成。";
  }
  const totalPages = Number(result.totalPages || 0);
  const colorPages = Number(result.colorPages || 0);
  const bwFallbackPages = Number(result.bwFallbackPages || 0);
  if (!totalPages) {
    return "PDF 导出完成。";
  }
  if (!colorPages) {
    return `完整 PDF 导出完成：共 ${totalPages} 页。当前没有阅读器彩色缓存，本次全部使用黑白原图。`;
  }
  return `完整 PDF 导出完成：共 ${totalPages} 页，${colorPages} 页使用彩色结果，${bwFallbackPages} 页用黑白原图补齐。`;
}

export default function Reader({
  currentBookId,
  libraryBooks = [],
  readerSettings,
  onReaderSettingsChange,
  onChangeBook,
  onBookLoaded,
  readerJobStatus,
  env,
  restoreState,
  onOpenLibrary,
  onOpenQueue,
}) {
  const [manifest, setManifest] = useState(null);
  const [pageData, setPageData] = useState(null);
  const [pageInput, setPageInput] = useState("1");
  const [viewMode, setViewMode] = useState("color");
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [statusText, setStatusText] = useState("");
  const [pageLoading, setPageLoading] = useState(false);
  const readerCanvasRef = useRef(null);
  const wheelTurnReadyRef = useRef(true);

  const totalPages = manifest?.total_pages || 0;
  const colorizedCount = manifest?.colorized_pages?.length || 0;
  const currentPage = pageData?.page_number || manifest?.current_page || 1;
  const hasColorPage = Boolean(pageData?.color_image_url);
  const isCurrentBookColorizing = Boolean(readerJobStatus?.running && readerJobStatus?.book_id === currentBookId);
  const displayUrl = viewMode === "color" && pageData?.color_image_url ? pageData.color_image_url : pageData?.bw_image_url;

  const loadBook = useCallback(
    async (bookId, targetPage = null, options = {}) => {
      const showLoading = options.showLoading ?? true;
      if (!bookId) {
        setManifest(null);
        setPageData(null);
        setPageInput("1");
        setLoadError("");
        return;
      }

      if (showLoading) {
        setPageLoading(true);
      }
      setLoadError("");
      try {
        const nextManifest = await getLibraryBook(bookId);
        const safeTotalPages = Math.max(Number(nextManifest.total_pages || 1), 1);
        const rawPage = targetPage ?? Number(nextManifest.current_page || 1);
        const safePage = Math.min(Math.max(rawPage, 1), safeTotalPages);
        const nextPage = await getLibraryBookPage(bookId, safePage);
        setManifest(nextManifest);
        setPageData(nextPage);
        setPageInput(String(safePage));
        onBookLoaded?.(nextManifest);
      } catch (error) {
        console.error(error);
        setLoadError(error instanceof Error ? error.message : "读取书籍失败。");
      } finally {
        if (showLoading) {
          setPageLoading(false);
        }
      }
    },
    [onBookLoaded]
  );

  useEffect(() => {
    if (!currentBookId) {
      setManifest(null);
      setPageData(null);
      return;
    }
    loadBook(currentBookId).catch((error) => console.error(error));
  }, [currentBookId, loadBook]);

  useEffect(() => {
    if (!currentBookId || !readerJobStatus) {
      return;
    }
    if (readerJobStatus.book_id !== currentBookId) {
      return;
    }
    if (
      readerJobStatus.status === "done" ||
      (readerJobStatus.current_page === currentPage && (readerJobStatus.success_count || readerJobStatus.failure_count))
    ) {
      loadBook(currentBookId, currentPage, { showLoading: false }).catch((error) => console.error(error));
    }
  }, [
    readerJobStatus?.status,
    readerJobStatus?.current_page,
    readerJobStatus?.book_id,
    readerJobStatus?.success_count,
    readerJobStatus?.failure_count,
    currentBookId,
    currentPage,
    loadBook,
  ]);

  useEffect(() => {
    if (!pageData?.color_image_url && viewMode === "color") {
      setViewMode("bw");
    }
  }, [pageData?.color_image_url, viewMode]);

  const goToPage = useCallback(
    async (pageNumber) => {
      if (!currentBookId || !manifest) {
        return;
      }
      const safePage = Math.min(Math.max(pageNumber, 1), Number(manifest.total_pages || 1));
      await setLibraryCurrentPage(currentBookId, safePage);
      await loadBook(currentBookId, safePage);
    },
    [currentBookId, manifest, loadBook]
  );

  const handleReaderWheel = useCallback(
    (event) => {
      if (!readerSettings.wheelPageTurn) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (!manifest || busy || pageLoading) {
        return;
      }

      const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 35) {
        return;
      }

      if (!wheelTurnReadyRef.current) {
        return;
      }

      const targetPage = dominantDelta > 0 ? currentPage + 1 : currentPage - 1;
      if (targetPage < 1 || targetPage > totalPages) {
        return;
      }

      wheelTurnReadyRef.current = false;
      goToPage(targetPage)
        .catch((error) => console.error(error))
        .finally(() => {
          window.setTimeout(() => {
            wheelTurnReadyRef.current = true;
          }, 320);
        });
    },
    [busy, currentPage, goToPage, manifest, pageLoading, readerSettings.wheelPageTurn, totalPages]
  );

  useEffect(() => {
    const canvas = readerCanvasRef.current;
    if (!canvas || !readerSettings.wheelPageTurn) {
      return undefined;
    }

    canvas.addEventListener("wheel", handleReaderWheel, { passive: false });
    return () => {
      canvas.removeEventListener("wheel", handleReaderWheel);
    };
  }, [handleReaderWheel, readerSettings.wheelPageTurn]);

  const runAction = useCallback(
    async (work, successMessage) => {
      setBusy(true);
      setLoadError("");
      setStatusText("");
      try {
        if (!env?.weightsReady && successMessage?.includes("上色")) {
          throw new Error("模型权重缺失，当前无法执行上色。");
        }
        const result = await work();
        const nextStatus = typeof successMessage === "function" ? successMessage(result) : successMessage;
        if (nextStatus) {
          setStatusText(nextStatus);
        }
      } catch (error) {
        console.error(error);
        setLoadError(error instanceof Error ? error.message : "操作失败。");
      } finally {
        setBusy(false);
      }
    },
    [env?.weightsReady]
  );

  useEffect(() => {
    const handleKeyDown = (event) => {
      const tagName = document.activeElement?.tagName || "";
      const isTyping = tagName === "INPUT" || tagName === "TEXTAREA";
      if (isTyping && event.key !== "Enter") {
        return;
      }
      if (!manifest || busy) {
        return;
      }

      if (event.key === "ArrowRight" || event.key === " ") {
        event.preventDefault();
        goToPage(currentPage + 1).catch((error) => console.error(error));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPage(currentPage - 1).catch((error) => console.error(error));
      } else if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setViewMode((value) => (value === "bw" ? "color" : "bw"));
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        if (env?.weightsReady) {
          runAction(() => colorizeLibraryPage(currentBookId, currentPage), "已提交当前页上色任务。");
        } else {
          setLoadError("模型权重缺失，当前无法执行上色。");
        }
      } else if (event.key === "Enter" && isTyping) {
        event.preventDefault();
        goToPage(Number(pageInput) || 1).catch((error) => console.error(error));
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [busy, currentBookId, currentPage, env?.weightsReady, goToPage, manifest, pageInput, runAction]);

  const progressText = useMemo(() => `第 ${currentPage} / ${totalPages || 1} 页 · 已上色 ${colorizedCount} / ${totalPages || 1} 页`, [colorizedCount, currentPage, totalPages]);

  return (
    <div className="page-stack">
      <MangaCard title="阅读器" subtitle="单页阅读、逐页上色与整本缓存。">
        {restoreState?.status === "loading" ? (
          <div className="gallery-status-empty">正在恢复最近阅读...</div>
        ) : restoreState?.status === "empty" ? (
          <div className="gallery-status-empty">
            <div>书库为空，请先到 Library 导入漫画。</div>
            <div className="button-row">
              <ActionButton onClick={onOpenLibrary}>前往 Library</ActionButton>
            </div>
          </div>
        ) : restoreState?.status === "error" ? (
          <div className="gallery-status-empty">
            <div>恢复最近阅读失败。</div>
            <div>{restoreState.error || "请回到 Library 重新选择书籍。"}</div>
            <div className="button-row">
              <ActionButton onClick={onOpenLibrary}>打开 Library</ActionButton>
            </div>
          </div>
        ) : currentBookId && !manifest && !loadError ? (
          <div className="gallery-status-empty">正在打开书籍...</div>
        ) : !currentBookId || !manifest ? (
          <div className="gallery-status-empty">还没有选中的书。先去 Library 导入一本漫画，再进入阅读器。</div>
        ) : (
          <div className="reader-layout">
            <aside className="reader-sidebar">
              {restoreState?.message ? <div className="settings-note">{restoreState.message}</div> : null}
              {statusText ? <div className="settings-note">{statusText}</div> : null}
              {loadError ? <div className="settings-note">{loadError}</div> : null}
              <div className="reader-book-title">{manifest.title}</div>
              <div className="reader-book-meta">{progressText}</div>

              <div className="field-group reader-book-switcher">
                <label className="field-label">切换书籍</label>
                <div className="reader-book-switch-row">
                  <select className="path-input" value={currentBookId} onChange={(event) => onChangeBook?.(event.target.value)}>
                    {libraryBooks.length ? (
                      libraryBooks.map((book) => (
                        <option key={book.book_id} value={book.book_id}>
                          {book.title}
                        </option>
                      ))
                    ) : (
                      <option value="">暂无书籍</option>
                    )}
                  </select>
                  <ActionButton variant="ghost" onClick={onOpenLibrary}>
                    书库
                  </ActionButton>
                </div>
              </div>

              <div className="reader-toolbar">
                <ActionButton variant="secondary" disabled={currentPage <= 1 || pageLoading} onClick={() => goToPage(currentPage - 1)}>
                  上一页
                </ActionButton>
                <ActionButton variant="secondary" disabled={currentPage >= totalPages || pageLoading} onClick={() => goToPage(currentPage + 1)}>
                  下一页
                </ActionButton>
              </div>

              <div className="field-group">
                <label className="field-label">页码跳转</label>
                <div className="reader-jump-row">
                  <input
                    className="path-input"
                    value={pageInput}
                    onChange={(event) => setPageInput(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        goToPage(Number(pageInput) || 1).catch((error) => console.error(error));
                      }
                    }}
                  />
                  <ActionButton variant="ghost" onClick={() => goToPage(Number(pageInput) || 1)}>
                    跳转
                  </ActionButton>
                </div>
              </div>

              <div className="reader-toolbar">
                <ActionButton variant={viewMode === "bw" ? "secondary" : "ghost"} onClick={() => setViewMode("bw")}>
                  查看黑白原图
                </ActionButton>
                <ActionButton variant={viewMode === "color" ? "secondary" : "ghost"} disabled={!hasColorPage} onClick={() => setViewMode("color")}>
                  查看彩色结果
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
                <ActionButton
                  variant={readerSettings.autoPrefetchNextPages ? "secondary" : "ghost"}
                  onClick={() => onReaderSettingsChange({ ...readerSettings, autoPrefetchNextPages: !readerSettings.autoPrefetchNextPages })}
                >
                  自动预上色后 3 页
                </ActionButton>
                <ActionButton
                  variant={readerSettings.wheelPageTurn ? "secondary" : "ghost"}
                  onClick={() => onReaderSettingsChange({ ...readerSettings, wheelPageTurn: !readerSettings.wheelPageTurn })}
                >
                  滚轮翻页
                </ActionButton>
              </div>

              <div className="reader-toolbar reader-toolbar-wrap">
                <StatusBadge tone={pageData?.is_colorized ? "ok" : "warn"}>
                  {pageData?.is_colorized ? "当前页已有彩色缓存" : "当前页仍为黑白页"}
                </StatusBadge>
                <StatusBadge tone={env?.weightsReady ? "ok" : "missing"}>
                  {env?.weightsReady ? "模型可用" : "模型权重缺失"}
                </StatusBadge>
              </div>

              <div className="reader-toolbar reader-toolbar-wrap">
                <ActionButton
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() => runAction(() => colorizeLibraryPage(currentBookId, currentPage), hasColorPage ? "已提交当前页重新上色任务。" : "已提交当前页上色任务。")}
                >
                  {hasColorPage ? "重新上色当前页" : "上色当前页"}
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() =>
                    runAction(() => colorizeLibraryRange(currentBookId, currentPage, Math.min(currentPage + 4, totalPages)), "已提交后 5 页上色任务。")
                  }
                >
                  上色后 5 页
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() => runAction(() => colorizeLibraryRange(currentBookId), "已提交整本上色任务。")}
                >
                  整本上色
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  loading={busy}
                  disabled={isCurrentBookColorizing}
                  hint={isCurrentBookColorizing ? "上色任务完成后再导出，避免漏掉刚生成的彩页" : "彩页优先，未上色页用黑白原图补齐"}
                  onClick={() => runAction(() => exportLibraryPdf(currentBookId), formatPdfExportMessage)}
                >
                  导出完整 PDF
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
                <div>{progressText}</div>
                <div>快捷键：→ / Space 翻页，← 上一页，滚轮翻页，B 切换黑白彩色，C 上色当前页</div>
              </div>
              <div
                ref={readerCanvasRef}
                className={`reader-canvas zoom-${readerSettings.defaultZoom}${readerSettings.wheelPageTurn ? " wheel-page-turn" : ""}`}
              >
                {pageLoading ? <div className="reader-loading">正在加载页面...</div> : null}
                {displayUrl ? <img src={displayUrl} alt={`${manifest.title} 第 ${currentPage} 页`} className="reader-page-image" /> : null}
              </div>
            </div>
          </div>
        )}
      </MangaCard>
    </div>
  );
}
