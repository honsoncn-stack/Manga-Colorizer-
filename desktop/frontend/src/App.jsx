import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Library from "./pages/Library";
import Reader from "./pages/Reader";
import ColorizeQueue from "./pages/ColorizeQueue";
import Gallery from "./pages/Gallery";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import About from "./pages/About";
import ImagePreviewModal from "./components/ImagePreviewModal";
import ConfirmDialog from "./components/ConfirmDialog";
import {
  cleanOutputs,
  clearLibraryCache,
  colorizeLibraryRange,
  deleteFile,
  deleteLibraryBook,
  exportLibraryPdf,
  getEnv,
  getHealth,
  getJobStatus,
  getLibraryBooks,
  getLibraryJobStatus,
  getLogs,
  getProjectStatus,
  getResults,
  importLibraryCbz,
  importLibraryFolder,
  importLibraryPdf,
  openFolder
} from "./lib/api";

const pageMeta = {
  dashboard: { title: "Manga Workbench Dashboard", subtitle: "阅读器、书库和自动上色状态总览" },
  library: { title: "Local Manga Library", subtitle: "导入本地漫画并生成阅读缓存" },
  reader: { title: "Reader Workbench", subtitle: "本地单页阅读、上色与导出" },
  queue: { title: "Colorize Queue", subtitle: "阅读器上色任务、等待队列与 reader_colorize.log" },
  gallery: { title: "Colorized Gallery", subtitle: "旧流水线输出与阅读器彩色页预览" },
  logs: { title: "Mission Logs", subtitle: "查看流水线、阅读器与后端日志" },
  settings: { title: "Workbench Settings", subtitle: "路径、缓存和阅读偏好" },
  about: { title: "About Reader Mode", subtitle: "阅读器模式范围与当前版本说明" }
};

const DEFAULT_READER_SETTINGS = {
  readingDirection: "rtl",
  defaultZoom: "fit-width",
  autoPrefetchNextPages: false
};

function loadReaderSettings() {
  try {
    const raw = window.localStorage.getItem("reader-settings");
    return raw ? { ...DEFAULT_READER_SETTINGS, ...JSON.parse(raw) } : DEFAULT_READER_SETTINGS;
  } catch {
    return DEFAULT_READER_SETTINGS;
  }
}

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [health, setHealth] = useState(null);
  const [env, setEnv] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [logs, setLogs] = useState(null);
  const [results, setResults] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [libraryJobStatus, setLibraryJobStatus] = useState(null);
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [currentBookId, setCurrentBookId] = useState(() => window.localStorage.getItem("reader-current-book") || "");
  const [readerSettings, setReaderSettings] = useState(loadReaderSettings);
  const [previewItem, setPreviewItem] = useState(null);
  const [deleteItem, setDeleteItem] = useState(null);

  const loadAll = async () => {
    const [healthData, envData, statusData, logsData, resultsData, jobData, booksData, readerJobData] = await Promise.all([
      getHealth().catch(() => null),
      getEnv().catch(() => null),
      getProjectStatus().catch(() => null),
      getLogs().catch(() => null),
      getResults().catch(() => null),
      getJobStatus().catch(() => null),
      getLibraryBooks().catch(() => ({ books: [] })),
      getLibraryJobStatus().catch(() => null)
    ]);
    setHealth(healthData);
    setEnv(envData);
    setProjectStatus(statusData);
    setLogs(logsData);
    setResults(resultsData);
    setJobStatus(jobData);
    setLibraryBooks(booksData?.books || []);
    setLibraryJobStatus(readerJobData || jobData?.readerJob || null);
  };

  useEffect(() => {
    loadAll().catch((error) => console.error(error));
    const timer = window.setInterval(() => {
      loadAll().catch((error) => console.error(error));
    }, 2000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("reader-settings", JSON.stringify(readerSettings));
  }, [readerSettings]);

  useEffect(() => {
    if (currentBookId) {
      window.localStorage.setItem("reader-current-book", currentBookId);
    } else {
      window.localStorage.removeItem("reader-current-book");
    }
  }, [currentBookId]);

  const refreshEnv = async () => {
    await loadAll();
  };

  const openReaderForBook = (bookId) => {
    if (!bookId) {
      return;
    }
    setCurrentBookId(bookId);
    setCurrentPage("reader");
  };

  const handleImport = async (handler, payload) => {
    await handler(payload);
    await loadAll();
  };

  const handleDeleteGalleryItem = (item) => {
    setDeleteItem(item);
  };

  const confirmDeleteGalleryItem = async () => {
    if (!deleteItem) {
      return;
    }
    await deleteFile(deleteItem.path);
    setPreviewItem(null);
    setDeleteItem(null);
    await loadAll();
  };

  const page = pageMeta[currentPage];
  let content = null;

  if (currentPage === "dashboard") {
    content = (
      <Dashboard
        env={env}
        projectStatus={projectStatus}
        jobStatus={jobStatus}
        readerJobStatus={libraryJobStatus}
        libraryBooks={libraryBooks}
        onNavigate={setCurrentPage}
        onContinueReading={openReaderForBook}
      />
    );
  } else if (currentPage === "library") {
    content = (
      <Library
        books={libraryBooks}
        onImportFolder={(payload) => handleImport(importLibraryFolder, payload)}
        onImportPdf={(payload) => handleImport(importLibraryPdf, payload)}
        onImportCbz={(payload) => handleImport(importLibraryCbz, payload)}
        onContinueReading={openReaderForBook}
        onColorizeAll={async (bookId) => {
          await colorizeLibraryRange(bookId);
          await loadAll();
          setCurrentPage("queue");
        }}
        onExportPdf={async (bookId) => {
          await exportLibraryPdf(bookId);
          await loadAll();
        }}
        onDeleteBook={async (bookId) => {
          await deleteLibraryBook(bookId);
          if (currentBookId === bookId) {
            setCurrentBookId("");
          }
          await loadAll();
        }}
      />
    );
  } else if (currentPage === "reader") {
    content = (
      <Reader
        currentBookId={currentBookId}
        readerSettings={readerSettings}
        readerJobStatus={libraryJobStatus}
        env={env}
        onReaderSettingsChange={setReaderSettings}
        onBookLoaded={(manifest) => {
          if (manifest?.book_id) {
            setCurrentBookId(manifest.book_id);
          }
        }}
        onOpenQueue={() => setCurrentPage("queue")}
      />
    );
  } else if (currentPage === "queue") {
    content = <ColorizeQueue readerJobStatus={libraryJobStatus} logs={logs} />;
  } else if (currentPage === "gallery") {
    content = <Gallery results={results} onOpenFolder={openFolder} onPreview={setPreviewItem} onDelete={handleDeleteGalleryItem} />;
  } else if (currentPage === "logs") {
    content = <Logs logs={logs} onRefresh={loadAll} />;
  } else if (currentPage === "settings") {
    content = (
      <Settings
        env={env}
        projectStatus={projectStatus}
        readerSettings={readerSettings}
        onReaderSettingsChange={setReaderSettings}
        onCleanOutputs={async () => {
          await cleanOutputs();
          await loadAll();
        }}
        onRefreshEnv={refreshEnv}
        onOpenProjectFolder={() => openFolder("D:\\AIProjects\\manga-auto-colorizer")}
        onOpenLibraryFolder={() => openFolder("library")}
        onClearLibraryCache={async () => {
          await clearLibraryCache();
          await loadAll();
        }}
      />
    );
  } else if (currentPage === "about") {
    content = <About />;
  }

  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} onChange={setCurrentPage} />
      <main className="content-shell">
        <TopBar
          title={page.title}
          subtitle={page.subtitle}
          env={env}
          health={health}
          jobStatus={jobStatus}
          readerJobStatus={libraryJobStatus}
          onRefresh={loadAll}
        />
        <div className="content-scroll">{content}</div>
        <footer className="footer-strip">
          <span>后端：{health?.status || "未知"}</span>
          <span>接口：{health?.backendUrl || "http://127.0.0.1:8765"}</span>
          <span>模式：本地阅读器 + 自动上色</span>
        </footer>
      </main>
      <ImagePreviewModal item={previewItem} onClose={() => setPreviewItem(null)} />
      {deleteItem ? (
        <ConfirmDialog
          title="确认删除"
          message={`确定删除这张图片吗？\n\n${deleteItem.name}`}
          confirmLabel="是，删除"
          cancelLabel="否，保留"
          onConfirm={confirmDeleteGalleryItem}
          onCancel={() => setDeleteItem(null)}
        />
      ) : null}
    </div>
  );
}
