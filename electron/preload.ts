import { IpcRendererEvent, contextBridge, ipcRenderer, webUtils } from "electron";
import { Settings, Item } from "../shared/types";

contextBridge.exposeInMainWorld("backend", {
  onAppProgress: (callback: (message: string) => void) => {
    const listener = (_: IpcRendererEvent, message: string) => {
      callback(message);
    };
    ipcRenderer.on("app-progress", listener);
    return () => {
      ipcRenderer.off("app-progress", listener);
    };
  },

  onShowError: (callback: (error: Error) => void) => {
    const listener = (_: IpcRendererEvent, error: Error) => {
      callback(error);
    };
    ipcRenderer.on("show-error", listener);
    return () => {
      ipcRenderer.off("show-error", listener);
    };
  },

  processPak: (file: File | string) => ipcRenderer.invoke("process-pak", file instanceof File ? webUtils.getPathForFile(file) : file),
  browsePak: () => ipcRenderer.invoke("browse-pak"),

  exportAssets: (assets: Item[], folder: string) => ipcRenderer.invoke("export-assets", assets, folder),
  chooseFolder: () => ipcRenderer.invoke("choose-folder"),

  validateLslibPath: (lslibPath: string) => ipcRenderer.invoke("validate-lslib-path", lslibPath),
  browseLslibPath: () => ipcRenderer.invoke("browse-lslib-path"),

  saveSettings: (settings: Settings) => ipcRenderer.invoke("save-settings", settings),
  getSettings: () => ipcRenderer.invoke("get-settings"),

  clearCache: () => ipcRenderer.invoke("clear-cache"),
  getVersion: () => ipcRenderer.invoke("get-version"),
});
