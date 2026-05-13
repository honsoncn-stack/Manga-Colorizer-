import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import TopBar from "./components/TopBar";
import Dashboard from "./pages/Dashboard";
import Colorize from "./pages/Colorize";
import Gallery from "./pages/Gallery";
import Logs from "./pages/Logs";
import Settings from "./pages/Settings";
import { cleanOutputs, getEnv, getHealth, getLogs, getProjectStatus, getResults, openFolder, startColorize } from "./lib/api";

const pageMeta = {
  dashboard: { title: "Dashboard", subtitle: "项目状态与环境总览" },
  colorize: { title: "Colorize", subtitle: "普通自动上色任务面板" },
  gallery: { title: "Gallery", subtitle: "漫画原稿陈列板与 PDF 输出" },
  logs: { title: "Logs", subtitle: "任务情报板与错误跟踪" },
  settings: { title: "Settings", subtitle: "路径、清理与环境检查" }
};

export default function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [health, setHealth] = useState(null);
  const [env, setEnv] = useState(null);
  const [projectStatus, setProjectStatus] = useState(null);
  const [logs, setLogs] = useState(null);
  const [results, setResults] = useState(null);
  const [running, setRunning] = useState(false);

  async function refreshAll() {
    const [healthData, envData, statusData, logsData, resultsData] = await Promise.all([
      getHealth(),
      getEnv(),
      getProjectStatus(),
      getLogs(),
      getResults()
    ]);
    setHealth(healthData);
    setEnv(envData);
    setProjectStatus(statusData);
    setLogs(logsData);
    setResults(resultsData);
  }

  useEffect(() => {
    refreshAll().catch((error) => {
      console.error(error);
    });
  }, []);

  async function handleStartColorize(payload) {
    setRunning(true);
    try {
      const response = await startColorize(payload);
      await refreshAll();
      return response;
    } finally {
      setRunning(false);
    }
  }

  async function handleOpenFolder(target) {
    await openFolder(target);
  }

  async function handleCleanOutputs() {
    await cleanOutputs();
    await refreshAll();
  }

  const page = pageMeta[currentPage];
  const envStatus = env?.pythonPathOk && env?.repoExists ? "ok" : "warn";

  let content = null;
  if (currentPage === "dashboard") {
    content = <Dashboard env={env} projectStatus={projectStatus} onNavigate={setCurrentPage} />;
  } else if (currentPage === "colorize") {
    content = <Colorize logs={logs} projectStatus={projectStatus} onStartColorize={handleStartColorize} running={running} />;
  } else if (currentPage === "gallery") {
    content = <Gallery results={results} onOpenFolder={handleOpenFolder} />;
  } else if (currentPage === "logs") {
    content = <Logs logs={logs} onRefresh={refreshAll} />;
  } else if (currentPage === "settings") {
    content = <Settings env={env} onCleanOutputs={handleCleanOutputs} onRefreshEnv={refreshAll} />;
  }

  return (
    <div className="app-shell">
      <Sidebar currentPage={currentPage} onChange={setCurrentPage} />
      <main className="content-shell">
        <TopBar title={page.title} subtitle={page.subtitle} envStatus={envStatus} onRefresh={refreshAll} />
        <div className="content-scroll">{content}</div>
        <footer className="footer-strip">
          <span>Backend: {health?.status || "unknown"}</span>
          <span>API: http://127.0.0.1:8765</span>
          <span>Mode: auto-only</span>
        </footer>
      </main>
    </div>
  );
}
