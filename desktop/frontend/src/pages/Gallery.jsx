import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActionButton from "../components/ActionButton";
import ConfirmDialog from "../components/ConfirmDialog";
import EmptyState from "../components/EmptyState";
import ImageGrid, { galleryItemKey } from "../components/ImageGrid";
import ImagePreviewModal from "../components/ImagePreviewModal";
import MangaCard from "../components/MangaCard";
import { deleteFile, getGalleryBook, getGalleryLibrary, getGalleryPipeline } from "../lib/api";

const filters = [
  { key: "pipeline", label: "临时彩图" },
  { key: "reader", label: "书库彩页" },
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
  const [batchMode, setBatchMode] = useState(false);
  const [selectedImageKeys, setSelectedImageKeys] = useState([]);
  const [batchDeleteOpen, setBatchDeleteOpen] = useState(false);
  const [batchDeleting, setBatchDeleting] = useState(false);
  const wheelTurnReadyRef = useRef(true);

  useEffect(() => {
    if (!selectedBookId && libraryBooks.length) {
      setSelectedBookId(libraryBooks[0].book_id);
    }
  }, [libraryBooks, selectedBookId]);

  useEffect(() => {
    setPage(1);
    setPageInput("1");
    setSelectedImageKeys([]);
  }, [activeFilter, selectedBookId, pageSize]);

  useEffect(() => {
    setSelectedImageKeys([]);
    setBatchDeleteOpen(false);
  }, [page, reloadToken]);

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
  const activeGalleryLabel = activeFilter === "pipeline" ? "临时彩图" : "书库彩页";
  const currentColorFolder = activeFilter === "pipeline" ? "output/colorized_fixed" : selectedBookId ? `library\\books\\${selectedBookId}\\pages_color` : "library/books";
  const currentPdfFolder = activeFilter === "pipeline" ? "output/final_pdf" : selectedBookId ? `library\\books\\${selectedBookId}\\export` : "library/books";
  const folderActionsDisabled = activeFilter === "reader" && !selectedBookId;
  const visibleItems = galleryData.items || [];
  const selectedKeySet = useMemo(() => new Set(selectedImageKeys), [selectedImageKeys]);
  const deletableVisibleItems = useMemo(() => visibleItems.filter((item) => item.file_path || item.path), [visibleItems]);
  const selectedItems = useMemo(() => deletableVisibleItems.filter((item) => selectedKeySet.has(galleryItemKey(item))), [deletableVisibleItems, selectedKeySet]);
  const isCurrentPageSelected = deletableVisibleItems.length > 0 && deletableVisibleItems.every((item) => selectedKeySet.has(galleryItemKey(item)));

  const handleDelete = async () => {
    if (!deleteItem) {
      return;
    }
    await deleteFile(deleteItem.file_path || deleteItem.path);
    setDeleteItem(null);
    setPreviewIndex(-1);
    setReloadToken((value) => value + 1);
  };

  const toggleSelectedItem = useCallback((item) => {
    const key = galleryItemKey(item);
    setSelectedImageKeys((current) => (current.includes(key) ? current.filter((value) => value !== key) : [...current, key]));
  }, []);

  const toggleCurrentPageSelection = useCallback(() => {
    setSelectedImageKeys(isCurrentPageSelected ? [] : deletableVisibleItems.map((item) => galleryItemKey(item)));
  }, [deletableVisibleItems, isCurrentPageSelected]);

  const handleBatchDelete = async () => {
    if (!selectedItems.length) {
      return;
    }
    setBatchDeleting(true);
    try {
      for (const item of selectedItems) {
        await deleteFile(item.file_path || item.path);
      }
      setBatchDeleteOpen(false);
      setSelectedImageKeys([]);
      setPreviewIndex(-1);
      setReloadToken((value) => value + 1);
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "批量删除失败");
    } finally {
      setBatchDeleting(false);
    }
  };

  const changePage = useCallback(
    (nextPage) => {
      const safeTotalPages = Math.max(Number(galleryData.total_pages || 1), 1);
      setPage(Math.min(Math.max(nextPage, 1), safeTotalPages));
    },
    [galleryData.total_pages]
  );

  const handleGalleryWheel = useCallback(
    (event) => {
      if (loading || previewIndex >= 0) {
        return;
      }

      const tagName = event.target?.tagName || "";
      if (["BUTTON", "INPUT", "SELECT", "TEXTAREA"].includes(tagName)) {
        return;
      }

      const dominantDelta = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? event.deltaY : event.deltaX;
      if (Math.abs(dominantDelta) < 35) {
        return;
      }

      event.preventDefault();
      if (!wheelTurnReadyRef.current) {
        return;
      }

      const currentGalleryPage = Number(galleryData.page || page || 1);
      const totalGalleryPages = Math.max(Number(galleryData.total_pages || 1), 1);
      const nextPage = dominantDelta > 0 ? currentGalleryPage + 1 : currentGalleryPage - 1;
      if (nextPage < 1 || nextPage > totalGalleryPages) {
        return;
      }

      wheelTurnReadyRef.current = false;
      changePage(nextPage);
      window.setTimeout(() => {
        wheelTurnReadyRef.current = true;
      }, 320);
    },
    [changePage, galleryData.page, galleryData.total_pages, loading, page, previewIndex]
  );

  return (
    <div className="page-stack gallery-layout">
      <MangaCard title="图库" subtitle="分页查看临时彩图和书库彩页。鼠标放在图片区可用滚轮翻页。">
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

        <div className="gallery-action-strip">
          <div className="gallery-action-copy">
            <div className="gallery-action-title">{activeGalleryLabel}操作</div>
            <div className="gallery-action-desc">刷新列表、打开当前输出目录；进入批量模式后可勾选多张彩图。</div>
          </div>
          <div className="button-row gallery-action-buttons">
            <ActionButton variant="secondary" hint="重新读取" onClick={() => setReloadToken((value) => value + 1)}>
              刷新列表
            </ActionButton>
            <ActionButton
              variant={batchMode ? "secondary" : "ghost"}
              hint={batchMode ? "返回预览" : "多选删除"}
              onClick={() => {
                setBatchMode((value) => !value);
                setSelectedImageKeys([]);
              }}
            >
              {batchMode ? "退出批量" : "批量操作"}
            </ActionButton>
            <ActionButton variant="ghost" hint={activeGalleryLabel} disabled={folderActionsDisabled} onClick={() => onOpenFolder(currentColorFolder)}>
              打开彩图目录
            </ActionButton>
            <ActionButton variant="ghost" hint={activeFilter === "pipeline" ? "临时导出" : "当前书籍"} disabled={folderActionsDisabled} onClick={() => onOpenFolder(currentPdfFolder)}>
              打开 PDF 输出
            </ActionButton>
          </div>
        </div>
        {batchMode ? (
          <div className="gallery-batch-bar">
            <span>已选择 {selectedItems.length} / {deletableVisibleItems.length} 张</span>
            <div className="button-row gallery-batch-actions">
              <ActionButton variant="ghost" disabled={!deletableVisibleItems.length} onClick={toggleCurrentPageSelection}>
                {isCurrentPageSelected ? "取消全选" : "全选当前页"}
              </ActionButton>
              <ActionButton variant="ghost" disabled={!selectedItems.length} onClick={() => setSelectedImageKeys([])}>
                清空选择
              </ActionButton>
              <ActionButton variant="danger" disabled={!selectedItems.length} loading={batchDeleting} onClick={() => setBatchDeleteOpen(true)}>
                删除所选
              </ActionButton>
            </div>
          </div>
        ) : null}

        <div className="gallery-wheel-area" onWheel={handleGalleryWheel}>
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
              onSelect={(index) => (batchMode ? toggleSelectedItem(visibleItems[index]) : setPreviewIndex(index))}
              onDeleteRequest={batchMode ? null : setDeleteItem}
              selectable={batchMode}
              selectedKeys={selectedImageKeys}
              onToggleSelect={toggleSelectedItem}
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
            onPageJump={() => changePage(Number(pageInput) || 1)}
            onChangePage={changePage}
          />
        </div>
      </MangaCard>

      <ImagePreviewModal items={visibleItems} activeIndex={previewIndex} onClose={() => setPreviewIndex(-1)} onChangeIndex={setPreviewIndex} />

      {deleteItem ? (
        <ConfirmDialog
          title="确认删除"
          message={`确定删除这张彩图吗？黑白原图会保留。\n\n${deleteItem.caption || deleteItem.filename || deleteItem.name}`}
          confirmLabel="是，删除"
          cancelLabel="否，保留"
          onConfirm={handleDelete}
          onCancel={() => setDeleteItem(null)}
        />
      ) : null}
      {batchDeleteOpen ? (
        <ConfirmDialog
          title="批量删除"
          message={`确定删除选中的 ${selectedItems.length} 张彩图吗？黑白原图会保留。`}
          confirmLabel="是，删除所选"
          cancelLabel="否，保留"
          onConfirm={handleBatchDelete}
          onCancel={() => setBatchDeleteOpen(false)}
        />
      ) : null}
    </div>
  );
}
