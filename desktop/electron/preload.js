const { contextBridge, shell } = require("electron");

contextBridge.exposeInMainWorld("desktopAPI", {
  backendUrl: "http://127.0.0.1:8765",
  openExternal: (url) => shell.openExternal(url)
});
