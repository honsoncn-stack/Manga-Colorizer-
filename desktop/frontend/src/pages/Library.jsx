import { useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import BookCover from "../components/BookCover";
import ConfirmDialog from "../components/ConfirmDialog";
import DropZone from "../components/DropZone";
import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";
import { basename } from "../lib/paths";

function inferTitleFromPath(pathValue) {
  const fileName = basename(pathValue || "");
  return fileName.replace(/\.(pdf|cbz|zip|png|jpg|jpeg|webp|bmp)$/i, "").trim();
}

function sortBooks(books, sortMode) {
  const items = [...books];
  if (sortMode === "title") {
    items.sort((a, b) => String(a.title || "").localeCompare(String(b.title || ""), "zh-CN"));
  } else if (sortMode === "created") {
    items.sort((a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")));
  } else {
    items.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
  }
  return items;
}

export default function Library({
  books = [],
  onImportFolder,
  onImportPdf,
  onImportCbz,
  onContinueReading,
  onColorizeAll,
  onExportPdf,
  onDeleteBook,
}) {
  const [title, setTitle] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [cbzPath, setCbzPath] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);
  const [busyMode, setBusyMode] = useState("");
  const [exportingBookId, setExportingBookId] = useState("");
  const [sortMode, setSortMode] = useState("updated");
  const [searchText, setSearchText] = useState("");
  const [statusText, setStatusText] = useState("");

  const canImportFolder = useMemo(() => Boolean(title.trim() && folderPath.trim()), [title, folderPath]);
  const canImportPdf = useMemo(() => Boolean(title.trim() && pdfPath.trim()), [title, pdfPath]);
  const canImportCbz = useMemo(() => Boolean(title.trim() && cbzPath.trim()), [title, cbzPath]);

  const visibleBooks = useMemo(() => {
    const filtered = books.filter((book) => String(book.title || "").toLowerCase().includes(searchText.trim().toLowerCase()));
    const sorted = sortBooks(filtered, sortMode);
    return sorted.slice(0, 50);
  }, [books, searchText, sortMode]);

  const assignPath = (mode, nextPath) => {
    if (mode === "folder") {
      setFolderPath(nextPath);
    }
    if (mode === "pdf") {
      setPdfPath(nextPath);
    }
    if (mode === "cbz") {
      setCbzPath(nextPath);
    }
    if (!title.trim()) {
      const nextTitle = inferTitleFromPath(nextPath);
      if (nextTitle) {
        setTitle(nextTitle);
      }
    }
  };

  const handleImport = async (mode) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }

    setBusyMode(mode);
    setStatusText("");
    try {
      if (mode === "folder" && folderPath) {
        await onImportFolder({ title: cleanTitle, inputPath: folderPath });
        setFolderPath("");
      }
      if (mode === "pdf" && pdfPath) {
        await onImportPdf({ title: cleanTitle, inputPath: pdfPath });
        setPdfPath("");
      }
      if (mode === "cbz" && cbzPath) {
        await onImportCbz({ title: cleanTitle, inputPath: cbzPath });
        setCbzPath("");
      }
      setTitle("");
      setStatusText(`已导入《${cleanTitle}》。`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "导入失败。");
    } finally {
      setBusyMode("");
    }
  };

  const handleExportPdf = async (book) => {
    if (!book?.book_id || exportingBookId) {
      return;
    }

    setExportingBookId(book.book_id);
    setStatusText(`正在导出《${book.title}》的完整 PDF...`);
    try {
      const result = await onExportPdf(book.book_id);
      const totalPages = Number(result?.totalPages || book.total_pages || 0);
      const colorPages = Number(result?.colorPages || 0);
      const bwFallbackPages = Number(result?.bwFallbackPages || 0);
      const detail = totalPages
        ? `共 ${totalPages} 页，${colorPages} 页使用彩色结果，${bwFallbackPages} 页用黑白原图补齐。`
        : "已生成完整 PDF。";
      setStatusText(`《${book.title}》PDF 导出完成，已打开所在目录。${detail}`);
    } catch (error) {
      setStatusText(error instanceof Error ? error.message : "PDF 导出失败。");
    } finally {
      setExportingBookId("");
    }
  };

  return (
    <div className="page-stack">
      <MangaCard title="本地书库" subtitle="导入图片文件夹、PDF 或 CBZ，建立本地漫画阅读书架。">
        <div className="field-group">
          <label className="field-label">书名</label>
          <input className="path-input" value={title} placeholder="例如：第 1 话试读本" onChange={(event) => setTitle(event.target.value)} />
          <div className="runtime-note">如果这里留空，选择 PDF 或 CBZ 后会自动带入文件名。</div>
          {statusText ? <div className="settings-note">{statusText}</div> : null}
        </div>

        <div className="library-import-grid">
          <div className="field-column">
            <DropZone mode="folder" label="导入图片文件夹" hint="拖入本地漫画图片文件夹，或点击选择文件夹。" onSelectPath={(value) => assignPath("folder", value)} />
            <div className="reader-path">{folderPath || "尚未选择图片文件夹"}</div>
            <ActionButton disabled={!canImportFolder} loading={busyMode === "folder"} onClick={() => handleImport("folder")}>
              导入图片文件夹
            </ActionButton>
          </div>

          <div className="field-column">
            <DropZone mode="pdf" label="导入 PDF" hint="拖入本地 PDF，或点击选择 PDF 文件。" onSelectPath={(value) => assignPath("pdf", value)} />
            <div className="reader-path">{pdfPath || "尚未选择 PDF 文件"}</div>
            <ActionButton disabled={!canImportPdf} loading={busyMode === "pdf"} onClick={() => handleImport("pdf")}>
              导入 PDF
            </ActionButton>
          </div>

          <div className="field-column">
            <DropZone mode="cbz" label="导入 CBZ" hint="拖入本地 CBZ，或点击选择 CBZ 文件。" onSelectPath={(value) => assignPath("cbz", value)} />
            <div className="reader-path">{cbzPath || "尚未选择 CBZ 文件"}</div>
            <ActionButton disabled={!canImportCbz} loading={busyMode === "cbz"} onClick={() => handleImport("cbz")}>
              导入 CBZ
            </ActionButton>
          </div>
        </div>
      </MangaCard>

      <MangaCard title="书架" subtitle="支持搜索、排序和阅读进度查看。">
        <div className="library-toolbar">
          <div className="field-group library-filter-group">
            <label className="field-label">搜索书名</label>
            <input className="path-input" value={searchText} placeholder="输入关键字搜索" onChange={(event) => setSearchText(event.target.value)} />
          </div>
          <div className="field-group library-filter-group">
            <label className="field-label">排序方式</label>
            <select className="path-input gallery-select" value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
              <option value="updated">最近更新</option>
              <option value="created">最近导入</option>
              <option value="title">标题</option>
            </select>
          </div>
        </div>

        {books.length > 50 ? <div className="settings-note">当前书库超过 50 本，为了保持流畅，页面只显示前 50 本结果。</div> : null}

        {visibleBooks.length ? (
          <div className="bookshelf-grid">
            {visibleBooks.map((book) => {
              const progressPercent = Math.min(100, Math.round(((book.colorized_count || 0) / Math.max(book.total_pages || 1, 1)) * 100));
              return (
                <article key={book.book_id} className="book-card">
                  <button
                    type="button"
                    className="book-card-delete-overlay"
                    aria-label={`删除 ${book.title}`}
                    title={`删除 ${book.title}`}
                    onClick={() => setPendingDelete(book)}
                  >
                    ×
                  </button>
                  <BookCover src={book.cover_url} title={book.title} className="book-card-cover" />
                  <div className="book-card-body">
                    <div className="book-card-title">{book.title}</div>
                    <div className="book-card-meta">页数 {book.total_pages}</div>
                    <div className="book-card-meta">最近阅读：第 {book.current_page} / {book.total_pages} 页</div>
                    <div className="book-card-meta">已上色：{book.colorized_count} / {book.total_pages} 页</div>
                    <div className="mini-progress">
                      <div className="mini-progress-fill" style={{ width: `${progressPercent}%` }} />
                    </div>
                    <div className="book-card-badges">
                      <StatusBadge tone="neutral">{book.source_type?.toUpperCase?.() || "BOOK"}</StatusBadge>
                      <StatusBadge tone={book.colorized_count ? "ok" : "warn"}>{book.colorized_count ? "已有缓存" : "待上色"}</StatusBadge>
                    </div>
                    <div className="book-card-actions">
                      <ActionButton hint="进入阅读器继续阅读" onClick={() => onContinueReading(book.book_id)}>
                        继续阅读
                      </ActionButton>
                      <ActionButton variant="secondary" hint="批量上色整本书" onClick={() => onColorizeAll(book.book_id)}>
                        全书上色
                      </ActionButton>
                      <ActionButton
                        variant="ghost"
                        loading={exportingBookId === book.book_id}
                        disabled={Boolean(exportingBookId && exportingBookId !== book.book_id)}
                        hint={exportingBookId === book.book_id ? "正在生成 PDF 并准备打开目录" : "彩页优先，未上色页用黑白原图补齐"}
                        onClick={() => handleExportPdf(book)}
                      >
                        导出完整 PDF
                      </ActionButton>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="gallery-status-empty">书库还是空的，或者当前搜索条件没有匹配结果。</div>
        )}
      </MangaCard>

      {pendingDelete ? (
        <ConfirmDialog
          title="删除书籍"
          message={`确认删除《${pendingDelete.title}》及其本地上色缓存吗？`}
          confirmLabel="是，删除"
          cancelLabel="否，保留"
          onConfirm={async () => {
            await onDeleteBook(pendingDelete.book_id);
            setPendingDelete(null);
          }}
          onCancel={() => setPendingDelete(null)}
        />
      ) : null}
    </div>
  );
}
