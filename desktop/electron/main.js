const { app, BrowserWindow, shell } = require("electron");
const { spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const PROJECT_ROOT = "D:\\AIProjects\\manga-auto-colorizer";
const PYTHON_EXE = "D:\\CondaEnvs\\manga-color-v2\\python.exe";
const BACKEND_PORT = 8765;
const BACKEND_URL = `http://127.0.0.1:${BACKEND_PORT}`;
const DESKTOP_ROOT = path.join(PROJECT_ROOT, "desktop");
const BACKEND_LOG = path.join(DESKTOP_ROOT, "backend", "logs", "backend-launch.log");

let mainWindow = null;
let backendProcess = null;

function appendLaunchLog(message) {
  fs.mkdirSync(path.dirname(BACKEND_LOG), { recursive: true });
  fs.appendFileSync(BACKEND_LOG, `${new Date().toISOString()} ${message}\n`, "utf8");
}

function startBackend() {
  if (backendProcess) {
    return;
  }

  const serverPath = path.join(DESKTOP_ROOT, "backend", "server.py");
  appendLaunchLog(`Starting backend: ${PYTHON_EXE} ${serverPath}`);
  backendProcess = spawn(PYTHON_EXE, [serverPath], {
    cwd: PROJECT_ROOT,
    windowsHide: true,
    stdio: "ignore"
  });

  backendProcess.on("exit", (code, signal) => {
    appendLaunchLog(`Backend exited code=${code} signal=${signal}`);
    backendProcess = null;
  });

  backendProcess.on("error", (error) => {
    appendLaunchLog(`Backend launch error: ${error.message}`);
  });
}

async function createWindow() {
  startBackend();

  mainWindow = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 1080,
    minHeight: 720,
    title: "Manga Auto Colorizer",
    backgroundColor: "#101018",
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, "preload.js")
    }
  });

  const devUrl = process.env.ELECTRON_START_URL;
  if (devUrl) {
    await mainWindow.loadURL(devUrl);
  } else {
    await mainWindow.loadFile(path.join(DESKTOP_ROOT, "frontend", "dist", "index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

function stopBackend() {
  if (backendProcess && !backendProcess.killed) {
    try {
      backendProcess.kill();
    } catch (error) {
      appendLaunchLog(`Backend kill error: ${error.message}`);
    }
  }
  backendProcess = null;
}

app.whenReady().then(createWindow);

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on("before-quit", () => {
  stopBackend();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
