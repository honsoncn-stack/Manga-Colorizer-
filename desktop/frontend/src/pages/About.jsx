import MangaCard from "../components/MangaCard";

export default function About() {
  return (
    <div className="page-stack">
      <MangaCard title="关于阅读器模式" subtitle="本地文件输入、本地缓存与自动上色阅读。">
        <ul className="info-list">
          <li>当前主线是 Electron 桌面应用 + FastAPI 后端。</li>
          <li>输入只来自本地文件：图片文件夹、PDF、CBZ。</li>
          <li>当前只做普通自动上色，不做 reference 模式。</li>
          <li>核心模型仍然是 external/manga-colorization-v2。</li>
          <li>浏览器插件、网页实时抓图和云端上传都不在当前版本范围内。</li>
        </ul>
      </MangaCard>
    </div>
  );
}
