import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";
import {
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

function formatColorizeMessage(result, fallback) {
  if (!result || typeof result !== "object") {
    return fallback;
  }
  const skippedCount = Array.isArray(result.skippedPages) ? result.skippedPages.length : 0;
  const queuedCount = Number(result.queuedPages || 0);
  if (result.started === false) {
    return result.message || "所选页面已有彩色缓存，已跳过。";
  }
  if (skippedCount && queuedCount) {
    return `已提交 ${queuedCount} 页上色任务，跳过 ${skippedCount} 页已有彩色缓存。`;
  }
  return fallback;
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
  const [secondPageData, setSecondPageData] = useState(null);
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
  const spreadEndPage = Math.min(currentPage + 1, totalPages || currentPage);
  const spreadPages = useMemo(() => [pageData, secondPageData].filter(Boolean), [pageData, secondPageData]);
  const visibleSpreadPages = useMemo(() => {
    if (readerSettings.readingDirection === "rtl") {
      return [...spreadPages].reverse();
    }
    return spreadPages;
  }, [readerSettings.readingDirection, spreadPages]);
  const hasColorPage = spreadPages.some((page) => Boolean(page?.color_image_url));
  const hasUncoloredSpreadPage = spreadPages.some((page) => !page?.is_colorized);
  const isCurrentBookColorizing = Boolean(readerJobStatus?.running && readerJobStatus?.book_id === currentBookId);
  const progressText = useMemo(() => {
    const pageLabel = currentPage === spreadEndPage ? `${currentPage}` : `${currentPage}-${spreadEndPage}`;
    return `第 ${pageLabel} / ${totalPages || 1} 页 · 已上色 ${colorizedCount} / ${totalPages || 1} 页`;
  }, [colorizedCount, currentPage, spreadEndPage, totalPages]);

  const loadBook = useCallback(
    async (bookId, targetPage = null, options = {}) => {
      const showLoading = options.showLoading ?? true;
      if (!bookId) {
        setManifest(null);
        setPageData(null);
        setSecondPageData(null);
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
        const nextPageRequests = [getLibraryBookPage(bookId, safePage)];
        if (safePage < safeTotalPages) {
          nextPageRequests.push(getLibraryBookPage(bookId, safePage + 1));
        }
        const [nextPage, pairedPage = null] = await Promise.all(nextPageRequests);
        setManifest(nextManifest);
        setPageData(nextPage);
        setSecondPageData(pairedPage);
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
        setSecondPageData(null);
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
    if (!hasColorPage && viewMode === "color") {
      setViewMode("bw");
    }
  }, [hasColorPage, viewMode]);

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

      const targetPage = dominantDelta > 0 ? currentPage + 2 : currentPage - 2;
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
        goToPage(currentPage + 2).catch((error) => console.error(error));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        goToPage(currentPage - 2).catch((error) => console.error(error));
      } else if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        setViewMode((value) => (value === "bw" ? "color" : "bw"));
      } else if (event.key.toLowerCase() === "c") {
        event.preventDefault();
        if (!hasUncoloredSpreadPage) {
          setStatusText("当前跨页已有彩色缓存，已跳过。");
          return;
        }
        if (env?.weightsReady) {
          runAction(
            () => colorizeLibraryRange(currentBookId, currentPage, spreadEndPage),
            (result) => formatColorizeMessage(result, "已提交当前跨页上色任务。")
          );
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
  }, [busy, currentBookId, currentPage, env?.weightsReady, goToPage, hasUncoloredSpreadPage, manifest, pageInput, runAction, spreadEndPage]);

  return (
    <div className="page-stack">
      <MangaCard title="阅读器" subtitle="双页阅读、跨页上色与整本缓存。">
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
                <ActionButton variant="secondary" disabled={currentPage <= 1 || pageLoading} onClick={() => goToPage(currentPage - 2)}>
                  上一跨页
                </ActionButton>
                <ActionButton variant="secondary" disabled={spreadEndPage >= totalPages || pageLoading} onClick={() => goToPage(currentPage + 2)}>
                  下一跨页
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
                  variant={readerSettings.wheelPageTurn ? "secondary" : "ghost"}
                  onClick={() => onReaderSettingsChange({ ...readerSettings, wheelPageTurn: !readerSettings.wheelPageTurn })}
                >
                  滚轮翻页
                </ActionButton>
              </div>

              <div className="reader-toolbar reader-toolbar-wrap">
                <StatusBadge tone={!hasUncoloredSpreadPage ? "ok" : "warn"}>
                  {!hasUncoloredSpreadPage ? "当前跨页已有彩色缓存" : "当前跨页仍有黑白页"}
                </StatusBadge>
                <StatusBadge tone={env?.weightsReady ? "ok" : "missing"}>
                  {env?.weightsReady ? "模型可用" : "模型权重缺失"}
                </StatusBadge>
              </div>

              <div className="reader-toolbar reader-toolbar-wrap">
                {hasUncoloredSpreadPage ? (
                  <ActionButton
                    loading={busy}
                    disabled={!env?.weightsReady}
                    onClick={() =>
                      runAction(
                        () => colorizeLibraryRange(currentBookId, currentPage, spreadEndPage),
                        (result) => formatColorizeMessage(result, "已提交当前跨页上色任务。")
                      )
                    }
                  >
                    上色当前跨页
                  </ActionButton>
                ) : null}
                <ActionButton
                  variant="secondary"
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() =>
                    runAction(
                      () => colorizeLibraryRange(currentBookId, currentPage, Math.min(currentPage + 5, totalPages)),
                      (result) => formatColorizeMessage(result, "已提交后 3 组跨页上色任务。")
                    )
                  }
                >
                  上色后 3 组跨页
                </ActionButton>
                <ActionButton
                  variant="secondary"
                  loading={busy}
                  disabled={!env?.weightsReady}
                  onClick={() => runAction(() => colorizeLibraryRange(currentBookId), (result) => formatColorizeMessage(result, "已提交整本上色任务。"))}
                >
                  整本上色
                </ActionButton>
                <ActionButton
                  variant="ghost"
                  loading={busy}
                  disabled={isCurrentBookColorizing}
                  hint={isCurrentBookColorizing ? "上色任务完成后再导出，避免漏掉刚生成的彩页" : "彩页优先，未上色页用黑白原图补齐"}
                  onClick={() =>
                    runAction(async () => {
                      const result = await exportLibraryPdf(currentBookId);
                      await openFolder(`library\\books\\${currentBookId}\\export`);
                      return result;
                    }, formatPdfExportMessage)
                  }
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
                <div>快捷键：→ / Space 下一跨页，← 上一跨页，滚轮翻页，B 切换黑白/彩色，C 上色当前跨页</div>
              </div>
              <div
                ref={readerCanvasRef}
                className={`reader-canvas zoom-${readerSettings.defaultZoom}${readerSettings.wheelPageTurn ? " wheel-page-turn" : ""}`}
              >
                {pageLoading ? <div className="reader-loading">正在加载页面...</div> : null}
                <div className="reader-spread">
                  {visibleSpreadPages.map((page) => {
                    const displayUrl = viewMode === "color" && page.color_image_url ? page.color_image_url : page.bw_image_url;
                    const displayModeLabel = viewMode === "color" && page.color_image_url ? "彩色" : "黑白";
                    return (
                      <figure key={page.page_number} className="reader-page-frame">
                        {displayUrl ? (
                          <img src={displayUrl} alt={`${manifest.title} 第 ${page.page_number} 页`} className="reader-page-image" />
                        ) : (
                          <div className="reader-loading">第 {page.page_number} 页暂不可用</div>
                        )}
                        <figcaption className="reader-page-caption">
                          第 {page.page_number} 页 · {displayModeLabel}
                        </figcaption>
                      </figure>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </MangaCard>
    </div>
  );
}
