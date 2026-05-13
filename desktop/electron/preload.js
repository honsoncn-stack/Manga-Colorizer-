const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("mangaAPI", {
  backendUrl: "http://127.0.0.1:8765",
  selectFolder: () => ipcRenderer.invoke("manga:select-folder"),
  selectPdf: () => ipcRenderer.invoke("manga:select-pdf"),
  openFolder: (targetPath) => ipcRenderer.invoke("manga:open-folder", targetPath),
  openFile: (targetPath) => ipcRenderer.invoke("manga:open-file", targetPath),
  getAppVersion: () => ipcRenderer.invoke("manga:get-app-version")
});
