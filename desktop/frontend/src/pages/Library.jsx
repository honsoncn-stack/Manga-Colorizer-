import { useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import ConfirmDialog from "../components/ConfirmDialog";
import DropZone from "../components/DropZone";
import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";

export default function Library({
  books = [],
  onImportFolder,
  onImportPdf,
  onImportCbz,
  onContinueReading,
  onColorizeAll,
  onExportPdf,
  onDeleteBook
}) {
  const [title, setTitle] = useState("");
  const [folderPath, setFolderPath] = useState("");
  const [pdfPath, setPdfPath] = useState("");
  const [cbzPath, setCbzPath] = useState("");
  const [pendingDelete, setPendingDelete] = useState(null);

  const canImportFolder = useMemo(() => title.trim() && folderPath.trim(), [title, folderPath]);
  const canImportPdf = useMemo(() => title.trim() && pdfPath.trim(), [title, pdfPath]);
  const canImportCbz = useMemo(() => title.trim() && cbzPath.trim(), [title, cbzPath]);

  const handleImport = async (mode) => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      return;
    }
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
  };

  return (
    <div className="page-stack">
      <MangaCard title="本地书库" subtitle="导入图片文件夹、PDF 或 CBZ，建立本地漫画阅读书架。">
        <div className="field-group">
          <label className="field-label">书名</label>
          <input className="path-input" value={title} placeholder="例如：第 1 话试读本" onChange={(event) => setTitle(event.target.value)} />
        </div>
        <div className="library-import-grid">
          <div className="field-column">
            <DropZone mode="folder" label="导入图片文件夹" hint="拖入本地漫画图片文件夹，或点击选择文件夹。" onSelectPath={setFolderPath} />
            <div className="reader-path">{folderPath || "尚未选择图片文件夹"}</div>
            <ActionButton disabled={!canImportFolder} onClick={() => handleImport("folder")}>
              导入图片文件夹
            </ActionButton>
          </div>
          <div className="field-column">
            <DropZone mode="pdf" label="导入 PDF" hint="拖入本地 PDF，或点击选择 PDF 文件。" onSelectPath={setPdfPath} />
            <div className="reader-path">{pdfPath || "尚未选择 PDF 文件"}</div>
            <ActionButton disabled={!canImportPdf} onClick={() => handleImport("pdf")}>
              导入 PDF
            </ActionButton>
          </div>
          <div className="field-column">
            <DropZone mode="cbz" label="导入 CBZ" hint="拖入本地 CBZ，或点击选择 CBZ 文件。" onSelectPath={setCbzPath} />
            <div className="reader-path">{cbzPath || "尚未选择 CBZ 文件"}</div>
            <ActionButton disabled={!canImportCbz} onClick={() => handleImport("cbz")}>
              导入 CBZ
            </ActionButton>
          </div>
        </div>
      </MangaCard>

      <MangaCard title="书架" subtitle="本地书库中的漫画将显示在这里。">
        {books.length ? (
          <div className="bookshelf-grid">
            {books.map((book) => (
              <article key={book.book_id} className="book-card">
                {book.cover_url ? <img src={book.cover_url} alt={book.title} className="book-card-cover" /> : <div className="book-card-cover placeholder">无封面</div>}
                <div className="book-card-body">
                  <div className="book-card-title">{book.title}</div>
                  <div className="book-card-meta">页数 {book.total_pages}</div>
                  <div className="book-card-meta">已上色 {book.colorized_count} 页</div>
                  <div className="book-card-meta">当前阅读第 {book.current_page} 页</div>
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
                    <ActionButton variant="ghost" hint="导出当前书籍 PDF" onClick={() => onExportPdf(book.book_id)}>
                      导出 PDF
                    </ActionButton>
                    <ActionButton variant="danger" hint="从本地书库删除这本书" onClick={() => setPendingDelete(book)}>
                      删除
                    </ActionButton>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="gallery-status-empty">书库还是空的。先导入本地图片文件夹、PDF 或 CBZ。</div>
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
