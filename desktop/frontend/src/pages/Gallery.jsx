import { useMemo, useState } from "react";
import ActionButton from "../components/ActionButton";
import ImageGrid from "../components/ImageGrid";
import MangaCard from "../components/MangaCard";
import StatusBadge from "../components/StatusBadge";

const filters = [
  { key: "pipeline", label: "Pipeline Outputs" },
  { key: "reader", label: "Reader Library Outputs" }
];

export default function Gallery({ results, onOpenFolder, onPreview, onDelete }) {
  const [activeFilter, setActiveFilter] = useState("reader");
  const pipelineImages = results?.images || [];
  const libraryImages = useMemo(
    () =>
      (results?.libraryOutputs || []).map((item) => ({
        ...item,
        caption: `${item.bookTitle} · 第 ${item.pageNumber} 页`
      })),
    [results]
  );
  const visibleItems = activeFilter === "pipeline" ? pipelineImages : libraryImages;

  return (
    <div className="page-stack gallery-layout">
      <MangaCard title="输出图库" subtitle="兼容旧流水线输出与阅读器书库彩色缓存。">
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
        <div className="button-row">
          <ActionButton variant="secondary" hint="打开旧流水线输出目录" onClick={() => onOpenFolder("output/colorized_fixed")}>
            打开流水线输出
          </ActionButton>
          <ActionButton variant="ghost" hint="打开阅读器书库目录" onClick={() => onOpenFolder("library/books")}>
            打开书库输出
          </ActionButton>
          <ActionButton variant="ghost" hint="打开最终 PDF 目录" onClick={() => onOpenFolder("output/final_pdf")}>
            打开 PDF 目录
          </ActionButton>
        </div>
        <ImageGrid
          items={visibleItems}
          onSelect={onPreview}
          onDeleteRequest={activeFilter === "pipeline" ? onDelete : null}
          emptyTitle="暂无可预览的上色结果"
          emptyDescription="先运行流水线上色，或在阅读器里缓存彩色页。"
        />
      </MangaCard>

      <MangaCard title="状态概览" subtitle="流水线输出与阅读器彩色缓存统计。">
        <div className="gallery-status-row">
          <div className="gallery-status-badges">
            <StatusBadge tone="ok">流水线页数：{pipelineImages.length}</StatusBadge>
            <StatusBadge tone="running">书库彩页：{libraryImages.length}</StatusBadge>
            <StatusBadge tone="warn">待复核：{results?.needsReviewCount ?? 0}</StatusBadge>
            <StatusBadge tone="neutral">PDF：{results?.pdfs?.length ?? 0}</StatusBadge>
          </div>
          <div className="gallery-status-copy">
            {(results?.pdfs || []).length ? (
              <div className="gallery-status-list">
                {results.pdfs.map((pdf) => (
                  <span key={pdf.name} className="gallery-status-item">
                    {pdf.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="gallery-status-empty">当前还没有导出的 PDF。</div>
            )}
          </div>
        </div>
      </MangaCard>
    </div>
  );
}
