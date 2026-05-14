import { useEffect, useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import ImageGrid from "../components/ImageGrid";
import ImagePreviewModal from "../components/ImagePreviewModal";
import MangaCard from "../components/MangaCard";
import { deleteFile, getGalleryBook, getGalleryLibrary, getGalleryPipeline } from "../lib/api";

const filters = [
  { key: "pipeline", label: "流水线输出" },
  { key: "reader", label: "书库彩页输出" },
];

const pageSizeOptions = [12, 24, 48, 96];

function PaginationControls({ page, totalPages, pageInput, onPageInputChange, onPageJump, onChangePage }) {
  return (
    <div className="gallery-pagination">
      <div className="button-row">
        <ActionButton variant="secondary" disabled={page <= 1} onClick={() => onChangePage(1)}>
          首页
        </ActionButton>
        <ActionButton variant="secondary" disabled={page <= 1} onClick={() => onChangePage(page - 1)}>
          上一页
        </ActionButton>
        <ActionButton variant="secondary" disabled={page >= totalPages} onClick={() => onChangePage(page + 1)}>
          下一页
        </ActionButton>
        <ActionButton variant="secondary" disabled={page >= totalPages} onClick={() => onChangePage(totalPages)}>
          末页
        </ActionButton>
      </div>
      <div className="reader-jump-row gallery-jump-row">
        <div className="gallery-page-indicator">第 {page} / {totalPages} 页</div>
        <input className="path-input" value={pageInput} onChange={(event) => onPageInputChange(event.target.value)} />
        <ActionButton variant="ghost" onClick={onPageJump}>
          跳转
        </ActionButton>
      </div>
    </div>
  );
}

export default function Gallery({ libraryBooks = [], onOpenFolder }) {
  const [activeFilter, setActiveFilter] = useState("reader");
  const [selectedBookId, setSelectedBookId] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);
  const [pageInput, setPageInput] = useState("1");
  const [reloadToken, setReloadToken] = useState(0);
  const [galleryData, setGalleryData] = useState({
    items: [],
    page: 1,
    page_size: 24,
    total: 0,
    total_pages: 1,
    has_prev: false,
    has_next: false,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [previewIndex, setPreviewIndex] = useState(-1);
  const [deleteItem, setDeleteItem] = useState(null);

  useEffect(() => {
    if (!selectedBookId && libraryBooks.length) {
      setSelectedBookId(libraryBooks[0].book_id);
    }
  }, [libraryBooks, selectedBookId]);

  useEffect(() => {
    setPage(1);
    setPageInput("1");
  }, [activeFilter, selectedBookId, pageSize]);

  useEffect(() => {
    let cancelled = false;

    async function loadGallery() {
      setLoading(true);
      setError("");
      try {
        const payload =
          activeFilter === "pipeline"
            ? await getGalleryPipeline({ page, pageSize })
            : selectedBookId
              ? await getGalleryBook(selectedBookId, { page, pageSize, onlyColorized: true })
              : await getGalleryLibrary({ page, pageSize, onlyColorized: true });

        if (!cancelled) {
          setGalleryData(payload);
          setPageInput(String(payload.page || 1));
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError instanceof Error ? loadError.message : "读取图库失败");
          setGalleryData({
            items: [],
            page: 1,
            page_size: pageSize,
            total: 0,
            total_pages: 1,
            has_prev: false,
            has_next: false,
          });
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadGallery();
    return () => {
      cancelled = true;
    };
  }, [activeFilter, selectedBookId, page, pageSize, reloadToken]);

  const selectedBook = useMemo(
    () => libraryBooks.find((book) => book.book_id === selectedBookId) || null,
    [libraryBooks, selectedBookId]
  );

  const handleDelete = async () => {
    if (!deleteItem) {
      return;
    }
    await deleteFile(deleteItem.file_path || deleteItem.path);
    setDeleteItem(null);
    setPreviewIndex(-1);
    setReloadToken((value) => value + 1);
  };

  const visibleItems = galleryData.items || [];

  return (
    <div className="page-stack gallery-layout">
      <MangaCard title="图库" subtitle="分页查看流水线输出和书库彩页，避免大量图片一次性卡顿。">
        <div className="tab-row">
          {filters.map((filter) => (
            <button
              key={filter.key}
              type="button"
              className={`tab-pill ${activeFilter === filter.key ? "is-active" : ""}`}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </button>
          ))}
        </div>

        <div className="gallery-toolbar">
          {activeFilter === "reader" ? (
            <div className="field-group gallery-filter-group">
              <label className="field-label">书籍筛选</label>
              <select className="path-input gallery-select" value={selectedBookId} onChange={(event) => setSelectedBookId(event.target.value)}>
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
            </div>
          ) : null}

          <div className="field-group gallery-filter-group">
            <label className="field-label">每页数量</label>
            <select className="path-input gallery-select" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
              {pageSizeOptions.map((option) => (
                <option key={option} value={option}>
                  {option} 张
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="button-row">
          <ActionButton variant="secondary" onClick={() => setReloadToken((value) => value + 1)}>
            刷新当前页
          </ActionButton>
          <ActionButton variant="ghost" onClick={() => onOpenFolder("output/colorized_fixed")}>
            打开流水线输出
          </ActionButton>
          <ActionButton variant="ghost" onClick={() => onOpenFolder(selectedBookId ? `library\\books\\${selectedBookId}\\pages_color` : "library/books")}>
            打开书库彩页
          </ActionButton>
          <ActionButton variant="ghost" onClick={() => onOpenFolder("output/final_pdf")}>
            打开 PDF 目录
          </ActionButton>
        </div>

        {error ? (
          <EmptyState title="图库读取失败" description={error} />
        ) : (
          <>
            <div className="gallery-summary">
              <span className="gallery-status-item">总数量：{galleryData.total ?? 0}</span>
              <span className="gallery-status-item">当前页：{galleryData.page ?? 1}</span>
              {activeFilter === "reader" && selectedBook ? <span className="gallery-status-item">当前书籍：{selectedBook.title}</span> : null}
            </div>
            <ImageGrid
              items={visibleItems}
              onSelect={(index) => setPreviewIndex(index)}
              onDeleteRequest={activeFilter === "pipeline" ? setDeleteItem : null}
              emptyTitle="暂无可预览图片"
              emptyDescription={activeFilter === "pipeline" ? "先运行一次自动上色，结果才会出现在这里。" : "当前书籍还没有生成彩色页。"}
              loading={loading}
            />
          </>
        )}

        <PaginationControls
          page={galleryData.page || 1}
          totalPages={galleryData.total_pages || 1}
          pageInput={pageInput}
          onPageInputChange={setPageInput}
          onPageJump={() => setPage(Math.max(1, Number(pageInput) || 1))}
          onChangePage={(nextPage) => setPage(Math.max(1, nextPage))}
        />
      </MangaCard>

      <ImagePreviewModal items={visibleItems} activeIndex={previewIndex} onClose={() => setPreviewIndex(-1)} onChangeIndex={setPreviewIndex} />

      {deleteItem ? (
        <ConfirmDialog
          title="确认删除"
          message={`确定删除这张图片吗？\n\n${deleteItem.filename || deleteItem.name}`}
          confirmLabel="是，删除"
          cancelLabel="否，保留"
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      ) : null}
    </div>
  );
}
