import { Settings, Lslib } from "../../shared/types";
import { writeConfig, readConfig } from "./config";
import { doesExist } from "../utils/os";

export async function validateLslibPath(lslibPath: string): Promise<Lslib> {
  const error = await checkLslibPath(lslibPath);
  return {
    filepath: lslibPath,
    error,
  };
}

export async function loadSettings(): Promise<Settings> {
  const config = await readConfig();
  const { lslibPath } = config;

  const lslib = await validateLslibPath(lslibPath);

  return {
    lslib,
  };
}

export async function saveSettings(settings: Settings) {
  const config = {
    lslibPath: settings.lslib.filepath,
  };

  await writeConfig(config);
}

export async function getLslibPath(): Promise<string> {
  const settings = await loadSettings();
  const { lslib } = settings;
  if (lslib.error) {
    throw new Error(`Invalid lslib: ${lslib.error}`);
  }

  return lslib.filepath;
}

async function checkLslibPath(lslibPath: string): Promise<string> {
  if (!lslibPath) {
    return "This is a required field";
  }

  const exists = await doesExist(lslibPath);
  if (!exists) {
    return "Path does not exist";
  }

  const valid = lslibPath.endsWith(".exe");
  if (!valid) {
    return "Not an executable";
  }

  return "";
}
