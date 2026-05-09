import { validateLslibPath, loadSettings, saveSettings } from "./services/settings";
import { BrowserWindow, ipcMain, app, dialog } from "electron";
import { processPak } from "./services/processor";
import { Settings, Item } from "../shared/types";
import { getCacheDirectory } from "./utils/os";
import { APP_ROOT, DIRNAME } from "./utils/os";
import { saveAssets } from "./services/saver";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

export const VITE_DEV_SERVER_URL = process.env["VITE_DEV_SERVER_URL"];
export const ELECTRON_DIST = path.join(APP_ROOT, "dist-electron");
export const PUBLIC = path.join(APP_ROOT, "public");
export const DIST = path.join(APP_ROOT, "dist");
export const VITE_PUBLIC = VITE_DEV_SERVER_URL ? PUBLIC : DIST;

let mainWindow: BrowserWindow | null;

process.env.VITE_PUBLIC = VITE_PUBLIC;
process.env.APP_ROOT = APP_ROOT;

log.transports.console.level = VITE_DEV_SERVER_URL ? "debug" : "info";
log.transports.remote.level = false;
log.transports.file.level = "silly";
log.transports.ipc.level = false;
log.initialize();

function createWindow() {
  mainWindow = new BrowserWindow({
    icon: path.join(VITE_PUBLIC, "icon.png"),
    webPreferences: {
      preload: path.join(DIRNAME, "preload.mjs"),
    },
    minWidth: 640,
    minHeight: 512,
    width: 1280,
    height: 1024,
  });

  if (!VITE_DEV_SERVER_URL) {
    mainWindow.loadFile(path.join(DIST, "index.html"));
    mainWindow.removeMenu();
  } else {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  }
}

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    mainWindow = null;
    app.quit();
  }
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

ipcMain.handle("process-pak", async (event, filepath: string) => {
  try {
    log.info(`Processing pak: ${filepath}`);
    const results = await processPak({
      onProgress: (message) => {
        event.sender.send("app-progress", message);
      },
      filepath,
    });

    log.info("Pak processed successfully");
    return results;
  } catch (error) {
    log.error(`Pak processing failed: ${error}`);
    event.sender.send("show-error", error);
    return [];
  }
});

ipcMain.handle("browse-pak", async (event) => {
  try {
    log.info("Waiting for user to browse pak...");
    const results = await dialog.showOpenDialog({
      filters: [{ extensions: ["pak"], name: "Mods" }],
      properties: ["openFile"],
    });

    if (results.filePaths.length === 0 || results.canceled) {
      return "";
    }

    const filepath = results.filePaths[0];
    log.info(`Pak path chosen: ${filepath}`);
    return filepath;
  } catch (error) {
    log.error(`Browse pak failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("export-assets", async (event, assets: Item[], folder: string) => {
  try {
    log.info(`Exporting assets: ${assets.length} items`);
    await saveAssets({
      onProgress: (message) => {
        event.sender.send("app-progress", message);
      },
      folder,
      assets,
    });

    log.info("Assets exported successfully");
    return true;
  } catch (error) {
    log.error(`Export assets failed: ${error}`);
    event.sender.send("show-error", error);
    return [];
  }
});

ipcMain.handle("choose-folder", async (event) => {
  try {
    log.info("Waiting for user to choose folder...");
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.filePaths.length === 0 || result.canceled) {
      return "";
    }

    const folder = result.filePaths[0];
    log.info(`Folder chosen: ${folder}`);
    return folder;
  } catch (error) {
    log.error(`Choose folder failed: ${error}`);
    event.sender.send("show-error", error);
    return "";
  }
});

ipcMain.handle("validate-lslib-path", async (event, lslibPath: string) => {
  try {
    log.info(`Validating lslib path: ${lslibPath}`);
    const lslib = await validateLslibPath(lslibPath);
    return lslib;
  } catch (error) {
    log.error(`Validating lslib failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("browse-lslib-path", async (event) => {
  try {
    log.info("Waiting for user to browse lslib path...");
    const results = await dialog.showOpenDialog({
      filters: [{ extensions: ["exe"], name: "Executables" }],
      properties: ["openFile"],
    });

    if (results.filePaths.length === 0 || results.canceled) {
      return "";
    }

    const filepath = results.filePaths[0];
    const lslib = await validateLslibPath(filepath);
    log.info(`Lslib path chosen: ${filepath}`);
    return lslib;
  } catch (error) {
    log.error(`Browse lslib path failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("save-settings", async (event, settings: Settings) => {
  try {
    log.info("Saving settings...");
    await saveSettings(settings);
    log.info("Settings saved");
    return true;
  } catch (error) {
    log.error(`Saving settings failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  }
});

ipcMain.handle("get-settings", async (event) => {
  try {
    log.info("Getting settings...");
    const settings = await loadSettings();
    log.info("Got settings");
    return settings;
  } catch (error) {
    log.error(`Getting settings failed: ${error}`);
    event.sender.send("show-error", error);
    return null;
  }
});

ipcMain.handle("clear-cache", async (event) => {
  try {
    log.info("Clearing cache...");
    await fs.rm(getCacheDirectory(), { recursive: true, force: true });
    log.info("Cache cleared");
    return true;
  } catch (error) {
    log.error(`Clear cached failed: ${error}`);
    event.sender.send("show-error", error);
    return false;
  }
});

ipcMain.handle("get-version", async () => {
  return app.getVersion();
});
