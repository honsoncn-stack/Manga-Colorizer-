import MangaCard from "../components/MangaCard";

export default function About() {
  return (
    <div className="page-stack">
      <MangaCard title="使用说明" subtitle="导入本地漫画，阅读时按页上色，并导出完整 PDF。">
        <ul className="info-list">
          <li>从书库导入图片文件夹、PDF 或 CBZ。</li>
          <li>在阅读器里查看黑白页和彩色页，支持键盘和滚轮翻页。</li>
          <li>可以上色当前页、后续几页或整本漫画。</li>
          <li>生成的彩色页会保存在本地书库，不会上传到云端。</li>
          <li>需要分享时，可以导出完整 PDF：已上色页使用彩色结果，未上色页自动用黑白原图补齐。</li>
          <li>
            GitHub 开源项目：
            <a href="https://github.com/honsoncn-stack/Manga-Colorizer-" target="_blank" rel="noreferrer">
              https://github.com/honsoncn-stack/Manga-Colorizer-
            </a>
          </li>
          <li>仓库已开设 Bug 反馈窗口，后续会开发 2.0；喜欢的话可以点个 Star。</li>
          <li>开发者：Ray的练琴时光（全平台同名）</li>
        </ul>
      </MangaCard>
    </div>
  );
}
