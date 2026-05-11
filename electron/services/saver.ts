import { AppProgress, Source, Item } from "../../shared/types";
import { doesExist, sleep } from "../utils/os";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

export interface Options {
  onAppProgress?: (appProgress: AppProgress) => void;
  folder: string;
  assets: Item[];
}

interface Result {
  filepaths: Filepath[];
  report: string[];
}

interface Filepath {
  source: string;
  dest: string;
}

const REPORT_FILENAME = "report.txt";
const DELAY = 50;

export async function saveAssets(options: Options): Promise<void> {
  options.onAppProgress?.({ message: "Gathering assets..." });
  const result = await gatherFilepaths(options);
  await saveFilepaths(options, result);
  await saveReport(options, result);
}

async function gatherFilepaths({ folder, assets }: Options): Promise<Result> {
  const maybeAddSource = async (prefix: string, data: Source, indent: number) => {
    const exists = await doesExist(data.path);
    report.push(`${(!exists ? "*" : "").padEnd(indent)}${exists ? "[PRESENT]" : "[MISSING]"} ${prefix}: ${data.name} (${data.id})`);
    if (seen.has(data.path)) {
      return;
    }

    if (!exists) {
      return;
    }

    const dest = path.join(folder, data.name);
    const source = data.path;
    filepaths.push({ source, dest });
    seen.add(data.path);
  };

  const filepaths: Filepath[] = [];
  const report: string[] = [];

  const seen = new Set<string>();
  for (const asset of assets) {
    report.push("==================================================");
    report.push(`Asset: ${asset.name} (${asset.id})`);

    if (asset.races?.length) {
      report.push(`Races: ${asset.races.join(", ")}`);
    }

    if (asset.slots?.length) {
      report.push(`Slots: ${asset.slots.join(", ")}`);
    }

    report.push("--------------------------------------------------");

    for (const visual of asset.visuals) {
      const { textures, source } = visual;
      await maybeAddSource("Visual", source, 4);
      for (const texture of textures) {
        await maybeAddSource("Texture", texture, 8);
      }
    }

    report.push("==================================================");
    report.push("");
  }

  return {
    filepaths,
    report,
  };
}

async function saveFilepaths({ onAppProgress }: Options, { filepaths }: Result): Promise<void> {
  const updateProgress = (count: number) => {
    onAppProgress?.({ progress: { total: filepaths.length, count } });
  };

  onAppProgress?.({ message: "Saving assets..." });
  updateProgress(0);
  for (let index = 0; index < filepaths.length; index++) {
    const filepath = filepaths[index];
    await saveAsset(filepath);
    updateProgress(index + 1);
    await sleep(DELAY);
  }
}

async function saveReport({ onAppProgress, folder }: Options, { report }: Result): Promise<void> {
  onAppProgress?.({ message: "Saving report..." });
  const filepath = path.join(folder, REPORT_FILENAME);
  const data = report.join("\n");
  await fs.writeFile(filepath, data, "utf8");
  log.info(`Saved report: ${filepath}`);
}

async function saveAsset(filepath: Filepath): Promise<void> {
  const { source, dest } = filepath;
  log.info(`Saving: ${source}`);
  await fs.copyFile(source, dest);
  log.info(`Saved: ${dest}`);
}
