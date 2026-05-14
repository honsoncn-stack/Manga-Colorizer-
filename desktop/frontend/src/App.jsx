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
import { LAST_READER_BOOK_KEY, pickPreferredReaderBook } from "./lib/readerState";
import {
  cleanOutputs,
  clearLibraryCache,
  colorizeLibraryRange,
  deleteLibraryBook,
  exportLibraryPdf,
  getEnv,
  getHealth,
  getJobStatus,
  getLibraryBooks,
  getLibraryJobStatus,
  getLogs,
  getProjectStatus,
  importLibraryCbz,
  importLibraryFolder,
  importLibraryPdf,
  openFolder,
} from "./lib/api";

const pageMeta = {
  dashboard: { title: "阅读器总览", subtitle: "查看书库、阅读进度与自动上色状态" },
  library: { title: "本地书库", subtitle: "导入本地漫画并生成阅读缓存" },
  reader: { title: "阅读器", subtitle: "本地单页阅读、上色与导出" },
  queue: { title: "上色队列", subtitle: "查看阅读器上色任务、等待队列与日志" },
  gallery: { title: "彩图预览", subtitle: "分页查看流水线输出和书库彩页" },
  logs: { title: "运行日志", subtitle: "查看流水线、阅读器与后端日志" },
  settings: { title: "设置", subtitle: "管理路径、缓存和阅读偏好" },
  about: { title: "关于阅读器模式", subtitle: "查看当前版本说明与使用范围" },
};

const DEFAULT_READER_SETTINGS = {
  readingDirection: "rtl",
  defaultZoom: "fit-height",
  autoPrefetchNextPages: false,
};

function loadReaderSettings() {
  try {
    const raw = window.localStorage.getItem("reader-settings");
    if (!raw) {
      return DEFAULT_READER_SETTINGS;
    }
    return { ...DEFAULT_READER_SETTINGS, ...JSON.parse(raw) };
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
  const [jobStatus, setJobStatus] = useState(null);
  const [libraryJobStatus, setLibraryJobStatus] = useState(null);
  const [libraryBooks, setLibraryBooks] = useState([]);
  const [libraryLoaded, setLibraryLoaded] = useState(false);
  const [currentBookId, setCurrentBookId] = useState(() => window.localStorage.getItem("reader-current-book") || "");
  const [readerSettings, setReaderSettings] = useState(loadReaderSettings);
  const [readerRestoreState, setReaderRestoreState] = useState({ status: "idle", message: "", error: "" });

  const loadAll = async () => {
    const [healthData, envData, statusData, logsData, jobData, booksData, readerJobData] = await Promise.all([
      getHealth().catch(() => null),
      getEnv().catch(() => null),
      getProjectStatus().catch(() => null),
      getLogs().catch(() => null),
      getJobStatus().catch(() => null),
      getLibraryBooks().catch(() => ({ books: [] })),
      getLibraryJobStatus().catch(() => null),
    ]);

    setHealth(healthData);
    setEnv(envData);
    setProjectStatus(statusData);
    setLogs(logsData);
    setJobStatus(jobData);
    setLibraryBooks(booksData?.books || []);
    setLibraryLoaded(true);
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
      window.localStorage.setItem(LAST_READER_BOOK_KEY, currentBookId);
    } else {
      window.localStorage.removeItem("reader-current-book");
    }
  }, [currentBookId]);

  useEffect(() => {
    if (currentPage !== "reader") {
      return;
    }

    const hasCurrentBook = currentBookId && libraryBooks.some((book) => book?.book_id === currentBookId);
    if (hasCurrentBook) {
      setReaderRestoreState((state) => (state.status === "loading" ? { status: "ready", message: "", error: "" } : state));
      return;
    }

    if (!libraryLoaded) {
      setReaderRestoreState({ status: "loading", message: "", error: "" });
      return;
    }

    if (!libraryBooks.length) {
      setReaderRestoreState({ status: "empty", message: "", error: "" });
      return;
    }

    try {
      const preferredBookId = window.localStorage.getItem(LAST_READER_BOOK_KEY) || "";
      const preferredBook = pickPreferredReaderBook(libraryBooks, preferredBookId);
      if (!preferredBook?.book_id) {
        setReaderRestoreState({ status: "empty", message: "", error: "" });
        return;
      }
      setCurrentBookId(preferredBook.book_id);
      setReaderRestoreState({
        status: "ready",
        message: `已恢复最近阅读：${preferredBook.title}`,
        error: "",
      });
    } catch (error) {
      console.error(error);
      setReaderRestoreState({
        status: "error",
        message: "",
        error: error instanceof Error ? error.message : "恢复最近阅读失败。",
      });
    }
  }, [currentPage, currentBookId, libraryBooks, libraryLoaded]);

  const openReaderForBook = (bookId) => {
    if (!bookId) {
      return;
    }
    setReaderRestoreState({ status: "ready", message: "", error: "" });
    setCurrentBookId(bookId);
    setCurrentPage("reader");
  };

  const page = pageMeta[currentPage] || pageMeta.dashboard;
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
        onImportFolder={async (payload) => {
          await importLibraryFolder(payload);
          await loadAll();
        }}
        onImportPdf={async (payload) => {
          await importLibraryPdf(payload);
          await loadAll();
        }}
        onImportCbz={async (payload) => {
          await importLibraryCbz(payload);
          await loadAll();
        }}
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
        restoreState={readerRestoreState}
        onReaderSettingsChange={setReaderSettings}
        onBookLoaded={(manifest) => {
          if (manifest?.book_id) {
            setCurrentBookId(manifest.book_id);
          }
        }}
        onOpenLibrary={() => setCurrentPage("library")}
        onOpenQueue={() => setCurrentPage("queue")}
      />
    );
  } else if (currentPage === "queue") {
    content = <ColorizeQueue readerJobStatus={libraryJobStatus} logs={logs} books={libraryBooks} onRefresh={loadAll} />;
  } else if (currentPage === "gallery") {
    content = <Gallery libraryBooks={libraryBooks} onOpenFolder={openFolder} />;
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
        onRefreshEnv={loadAll}
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
        <TopBar title={page.title} subtitle={page.subtitle} onRefresh={loadAll} />
        <div className="content-scroll">{content}</div>
        <footer className="footer-strip">
          <span>后端：{health?.status || "未知"}</span>
          <span>接口：{health?.backendUrl || "http://127.0.0.1:8765"}</span>
          <span>模式：本地阅读器 + 自动上色</span>
        </footer>
      </main>
    </div>
  );
}
