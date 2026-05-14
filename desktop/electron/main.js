const { app, BrowserWindow, dialog, ipcMain, shell } = require("electron");
const { spawn } = require("child_process");
const fs = require("fs");
const http = require("http");
const net = require("net");
const path = require("path");

const PROJECT_ROOT = path.resolve("D:\\AIProjects\\manga-auto-colorizer");
const PYTHON_EXE = path.resolve("D:\\CondaEnvs\\manga-color-v2\\python.exe");
const BACKEND_PORT = 8765;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const BACKEND_ENV = {
  MANGA_PROJECT_ROOT: PROJECT_ROOT,
  MANGA_PYTHON: PYTHON_EXE,
  PIP_CACHE_DIR: "D:\\AICache\\pip",
  HF_HOME: "D:\\AICache\\huggingface",
  HUGGINGFACE_HUB_CACHE: "D:\\AICache\\huggingface\\hub",
  TRANSFORMERS_CACHE: "D:\\AICache\\huggingface\\transformers",
  TORCH_HOME: "D:\\AICache\\torch",
  XDG_CACHE_HOME: "D:\\AICache",
  TEMP: "D:\\Temp",
  TMP: "D:\\Temp"
};

let splashWindow = null;
let mainWindow = null;
let backendProcess = null;

function getDesktopRoot() {
  return app.isPackaged ? app.getAppPath() : path.join(PROJECT_ROOT, "desktop");
}

function getBackendLogPath() {
  return path.join(getDesktopRoot(), "backend", "logs", "backend-launch.log");
}

function getRendererLogPath() {
  return path.join(getDesktopRoot(), "backend", "logs", "renderer.log");
}

function getDistIndexPath() {
  return path.join(getDesktopRoot(), "frontend", "dist", "index.html");
}

function getServerPath() {
  return path.join(getDesktopRoot(), "backend", "server.py");
}

function appendLog(filePath, message) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.appendFileSync(filePath, `${new Date().toISOString()} ${message}\n`, "utf8");
}

function appendLaunchLog(message) {
  appendLog(getBackendLogPath(), message);
}

function appendRendererLog(message) {
  appendLog(getRendererLogPath(), message);
}

function isWithinProject(targetPath) {
  const resolved = path.resolve(targetPath);
  const root = path.resolve(PROJECT_ROOT) + path.sep;
  return resolved === path.resolve(PROJECT_ROOT) || resolved.startsWith(root);
}

function resolveWithinProject(targetPath) {
  const candidate = path.isAbsolute(targetPath) ? targetPath : path.join(PROJECT_ROOT, targetPath);
  const resolved = path.resolve(candidate);
  if (!isWithinProject(resolved)) {
    throw new Error("Path is outside project root");
  }
  return resolved;
}

function isPortOccupied(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: "127.0.0.1", port }, () => {
      socket.end();
      resolve(true);
    });
    socket.on("error", () => resolve(false));
    socket.setTimeout(800, () => {
      socket.destroy();
      resolve(false);
    });
  });
}

async function ensureBackendPortAvailable() {
  if (await isPortOccupied(BACKEND_PORT)) {
    throw new Error(`Port ${BACKEND_PORT} is already in use. Close the old app or backend process and try again.`);
  }
}

function startBackend() {
  if (backendProcess) {
    return backendProcess;
  }
  const desktopRoot = getDesktopRoot();
  const serverPath = getServerPath();
  const env = { ...process.env, ...BACKEND_ENV };
  appendLaunchLog(`Starting backend: ${PYTHON_EXE} ${serverPath}`);
  backendProcess = spawn(PYTHON_EXE, [serverPath], {
    cwd: desktopRoot,
    windowsHide: true,
    stdio: "ignore",
    env
  });

  backendProcess.on("exit", (code, signal) => {
    appendLaunchLog(`Backend exited code=${code} signal=${signal}`);
    backendProcess = null;
  });
  backendProcess.on("error", (error) => {
    appendLaunchLog(`Backend launch error: ${error.message}`);
  });
  return backendProcess;
}

function waitForBackendReady(timeoutMs = 30000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const poll = () => {
      http
        .get(`${BACKEND_URL}/api/health`, (response) => {
          let body = "";
          response.setEncoding("utf8");
          response.on("data", (chunk) => {
            body += chunk;
          });
          response.on("end", () => {
            if (response.statusCode === 200) {
              resolve(body);
              return;
            }
            if (Date.now() - start >= timeoutMs) {
              reject(new Error(`Backend health check failed with status ${response.statusCode}`));
              return;
            }
            setTimeout(poll, 500);
          });
        })
        .on("error", () => {
          if (Date.now() - start >= timeoutMs) {
            reject(new Error("Backend health check timed out"));
            return;
          }
          setTimeout(poll, 500);
        });
    };
    poll();
  });
}

function createSplashWindow(message) {
  const window = new BrowserWindow({
    width: 520,
    height: 280,
    resizable: false,
    frame: true,
    title: "Manga Auto Colorizer",
    backgroundColor: "#101018",
    autoHideMenuBar: true,
    show: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  window.loadURL(
    `data:text/html;charset=utf-8,${encodeURIComponent(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8" />
          <style>
            body {
              margin: 0;
              font-family: Segoe UI, sans-serif;
              background: linear-gradient(145deg, #101018, #171a2e);
              color: #f8f4ea;
              display: grid;
              place-items: center;
              height: 100vh;
            }
            .panel {
              width: 88%;
              padding: 28px;
              border: 3px solid rgba(255,255,255,0.12);
              border-radius: 20px;
              background: rgba(255,255,255,0.06);
              box-shadow: 8px 8px 0 rgba(0,0,0,0.35);
            }
            .title { font-size: 22px; font-weight: 800; margin-bottom: 8px; }
            .text { color: rgba(248,244,234,0.72); line-height: 1.6; }
            .bar {
              margin-top: 18px;
              height: 10px;
              border-radius: 999px;
              background: rgba(255,255,255,0.08);
              overflow: hidden;
            }
            .bar::before {
              content: "";
              display: block;
              width: 45%;
              height: 100%;
              background: linear-gradient(90deg, #ff6fae, #57d7ff);
              animation: slide 1.4s infinite ease-in-out;
            }
            @keyframes slide {
              0% { transform: translateX(-30%); }
              50% { transform: translateX(80%); }
              100% { transform: translateX(-30%); }
            }
          </style>
        </head>
        <body>
          <div class="panel">
            <div class="title">Manga Auto Colorizer</div>
            <div class="text">${message}</div>
            <div class="bar"></div>
          </div>
        </body>
      </html>
    `)}`
  );
  return window;
}

function createMainWindow() {
  const window = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1080,
    minHeight: 720,
    title: "Manga Auto Colorizer",
    backgroundColor: "#101018",
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  window.webContents.on("console-message", (_event, level, message, line, sourceId) => {
    appendRendererLog(`console[level=${level}] ${message} @ ${sourceId}:${line}`);
  });
  window.webContents.on("did-start-loading", () => {
    appendRendererLog("did-start-loading");
  });
  window.webContents.on("did-finish-load", () => {
    appendRendererLog(`did-finish-load url=${window.webContents.getURL()}`);
    if (!window.isVisible()) {
      window.show();
    }
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
  });
  window.webContents.on("did-fail-load", (_event, errorCode, errorDescription, validatedURL) => {
    appendRendererLog(`did-fail-load code=${errorCode} description=${errorDescription} url=${validatedURL}`);
  });
  window.webContents.on("render-process-gone", (_event, details) => {
    appendRendererLog(`render-process-gone reason=${details.reason} exitCode=${details.exitCode}`);
  });
  window.webContents.on("unresponsive", () => {
    appendRendererLog("renderer unresponsive");
  });
  window.on("closed", () => {
    mainWindow = null;
  });
  return window;
}

async function openTarget(targetPath) {
  const resolved = resolveWithinProject(targetPath);
  return shell.openPath(resolved);
}

function registerIpc() {
  ipcMain.handle("manga:select-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择项目内文件夹",
      properties: ["openDirectory", "dontAddToRecent"]
    });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    return resolveWithinProject(result.filePaths[0]);
  });

  ipcMain.handle("manga:select-image-folder", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择漫画图片文件夹",
      properties: ["openDirectory", "dontAddToRecent"]
    });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    return path.resolve(result.filePaths[0]);
  });

  ipcMain.handle("manga:select-pdf", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择项目内 PDF",
      properties: ["openFile", "dontAddToRecent"],
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    return resolveWithinProject(result.filePaths[0]);
  });

  ipcMain.handle("manga:select-pdf-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择本地 PDF",
      properties: ["openFile", "dontAddToRecent"],
      filters: [{ name: "PDF", extensions: ["pdf"] }]
    });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    return path.resolve(result.filePaths[0]);
  });

  ipcMain.handle("manga:select-cbz-file", async () => {
    const result = await dialog.showOpenDialog({
      title: "选择本地 CBZ",
      properties: ["openFile", "dontAddToRecent"],
      filters: [{ name: "CBZ", extensions: ["cbz"] }]
    });
    if (result.canceled || !result.filePaths.length) {
      return null;
    }
    return path.resolve(result.filePaths[0]);
  });

  ipcMain.handle("manga:open-folder", async (_event, targetPath) => openTarget(targetPath));
  ipcMain.handle("manga:open-file", async (_event, targetPath) => openTarget(targetPath));
  ipcMain.handle("manga:get-app-version", async () => app.getVersion());
}

async function loadRenderer(window) {
  if (app.isPackaged) {
    const distIndex = getDistIndexPath();
    appendRendererLog(`loadFile ${distIndex}`);
    await window.loadFile(distIndex);
    return;
  }
  const devUrl = "http://127.0.0.1:5173";
  appendRendererLog(`loadURL ${devUrl}`);
  await window.loadURL(devUrl);
}

async function bootstrap() {
  splashWindow = createSplashWindow("正在启动本地后端并准备阅读器工作台。");
  try {
    await ensureBackendPortAvailable();
    startBackend();
    await waitForBackendReady();
    mainWindow = createMainWindow();
    await loadRenderer(mainWindow);
  } catch (error) {
    appendLaunchLog(`Bootstrap failed: ${error.message}`);
    if (splashWindow) {
      splashWindow.close();
      splashWindow = null;
    }
    dialog.showErrorBox("Manga Auto Colorizer", `桌面应用启动失败：\n${error.message}`);
    app.quit();
  }
}

app.whenReady().then(() => {
  registerIpc();
  bootstrap();
});

app.on("window-all-closed", () => {
  if (backendProcess && !backendProcess.killed) {
    backendProcess.kill();
  }
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    bootstrap();
  }
});
