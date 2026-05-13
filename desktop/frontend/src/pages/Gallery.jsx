import ActionButton from "../components/ActionButton";
import ImageGrid from "../components/ImageGrid";
import MangaCard from "../components/MangaCard";

export default function Gallery({ results, onOpenFolder }) {
  return (
    <div className="page-stack">
      <MangaCard title="漫画原稿陈列板">
        <div className="button-row">
          <ActionButton onClick={() => onOpenFolder("output/colorized_fixed")}>打开输出文件夹</ActionButton>
          <ActionButton tone="cyan" onClick={() => onOpenFolder("output/final_pdf")}>打开最终 PDF 文件夹</ActionButton>
        </div>
        <ImageGrid items={results?.images || []} />
      </MangaCard>

      <MangaCard title="PDF 与复核状态">
        <ul className="info-list">
          <li>PDF 文件数：{results?.pdfs?.length ?? 0}</li>
          <li>needs_review 数量：{results?.needsReviewCount ?? 0}</li>
          {(results?.pdfs || []).map((pdf) => (
            <li key={pdf.name}>{pdf.name}</li>
          ))}
        </ul>
      </MangaCard>
    </div>
  );
}
