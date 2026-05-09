import { fileURLToPath } from "url";
import { app } from "electron";
import fs from "fs/promises";
import path from "path";
import os from "os";

export const DIRNAME = path.dirname(fileURLToPath(import.meta.url));
export const APP_ROOT = path.join(DIRNAME, "..");

const FOLDER_NAME = "argus";

export function getResourcesDirectory(): string {
  if (!app.isPackaged) {
    return path.join(APP_ROOT, "resources");
  }

  return process.resourcesPath;
}

export function getCacheDirectory(): string {
  const platform = process.platform;
  const home = os.homedir();
  switch (platform) {
    case "darwin":
      return path.join(home, "Library", "Caches", FOLDER_NAME);
    case "win32":
      return path.join(home, "AppData", "Local", FOLDER_NAME, "Cache");
    case "linux":
      return path.join(home, ".cache", FOLDER_NAME);
  }

  throw new Error("Unknown platform");
}

export function getDataDirectory(): string {
  const platform = process.platform;
  const home = os.homedir();
  switch (platform) {
    case "darwin":
      return path.join(home, "Library", "Application Support", FOLDER_NAME);
    case "win32":
      return path.join(home, "AppData", "Local", FOLDER_NAME, "Data");
    case "linux":
      return path.join(home, ".local", "share", FOLDER_NAME);
  }

  throw new Error("Unknown platform");
}

export async function doesExist(filepath?: string | null): Promise<boolean> {
  try {
    const stats = filepath ? await fs.stat(filepath) : null;
    if (!stats) {
      return false;
    }

    return stats.size > 0;
  } catch (error) {
    return false;
  }
}

export async function walk(directory: string, filter: string[]): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const results = await Promise.all(
    entries
      .filter((entry) => {
        if (entry.isDirectory()) {
          return true;
        }

        const extension = path.extname(entry.name).toLowerCase();
        if (filter.includes(extension)) {
          return true;
        }

        return false;
      })
      .map(async (entry) => {
        const fullpath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return walk(fullpath, filter);
        }

        return fullpath;
      }),
  );

  return results.flat();
}
