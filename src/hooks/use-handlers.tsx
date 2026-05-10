import { Settings, Lslib, Item } from "../../shared/types";
import { invokeWithSleep } from "../utils/promise";
import { useAppStore } from "../store/app-store";
import log from "electron-log/renderer";
import { toast } from "sonner";

const DELAY = 500;

export function useHandlers() {
  const { updateAppStatus, setAppStatus, reset } = useAppStore.getState();

  return {
    // Export assets handler
    handleExportAssets: async (assets: Item[]) => {
      log.info(`Handling export assets: ${assets.length} items`);
      const folder = await window.backend?.chooseFolder();
      if (!folder) {
        log.info("Export assets canceled");
        return;
      }

      setAppStatus("exporting");
      const success = await invokeWithSleep(() => window.backend?.exportAssets(assets, folder), DELAY);
      if (!success) {
        log.info("Export assets failed");
        reset();
        return;
      }

      toast.success("Assets exported");
      log.info("Export assets handled");
      reset();
    },

    // Process pak handler
    handleProcessPak: async (file: File | string) => {
      log.info(`Handling process pak: ${file instanceof File ? file.name : file}`);
      setAppStatus("processing");
      const items = await invokeWithSleep(() => window.backend?.processPak(file), DELAY);
      if (items.length === 0) {
        log.info("Process pak failed");
        reset();
        return;
      }

      updateAppStatus("processed", items);
      toast.success("Pak processed");
      log.info("Process pak handled");
    },

    // Browse pak handler
    handleBrowsePak: async (): Promise<string | null> => {
      log.info("Handling browse pak");
      const result = await window.backend?.browsePak();
      if (result === null) {
        log.info("Browse pak canceled");
        return null;
      }

      log.info("Browse pak handled");
      return result;
    },

    // Browse lslib path handler
    handleBrowseLslibPath: async (): Promise<Lslib | null> => {
      log.info("Handling browse lslib path");
      const result = await window.backend?.browseLslibPath();
      if (result === null) {
        log.info("Browse lslib path canceled");
        return null;
      }

      log.info("Browse lslib path handled");
      return result;
    },

    // Save settings handler
    handleSaveSettings: async (settings: Settings) => {
      log.info("Handling save settings...");
      const success = await window.backend?.saveSettings(settings);
      if (!success) {
        log.info("Save settings failed");
        return;
      }

      toast.success("Settings saved");
      log.info("Save settings handled");
    },

    // Clear cache handler
    handleClearCache: async () => {
      log.info("Handling clear cache...");
      const success = await invokeWithSleep(() => window.backend?.clearCache(), DELAY);
      if (!success) {
        log.info("Clear cache failed");
        return;
      }

      toast.success("Cache cleared");
      log.info("Clear cache handled");
    },

    // Reset handler
    handleReset: () => {
      log.info("Handling reset...");
      reset();
      log.info("Reset handled");
    },
  };
}
