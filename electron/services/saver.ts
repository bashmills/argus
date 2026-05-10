import { AppProgress, Source, Item } from "../../shared/types";
import { sleep } from "../utils/os";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

export interface Options {
  onAppProgress?: (appProgress: AppProgress) => void;
  folder: string;
  assets: Item[];
}

interface Filepath {
  source: string;
  dest: string;
}

const DELAY = 50;

export async function saveAssets({ onAppProgress, assets, folder }: Options): Promise<void> {
  const updateProgress = (count: number) => {
    onAppProgress?.({ progress: { total: filepaths.length, count } });
  };

  onAppProgress?.({ message: "Saving assets..." });
  const filepaths = gatherFilepaths(assets, folder);
  updateProgress(0);
  for (let index = 0; index < filepaths.length; index++) {
    const filepath = filepaths[index];
    await saveAsset(filepath);
    updateProgress(index + 1);
    await sleep(DELAY);
  }
}

function gatherFilepaths(assets: Item[], folder: string): Filepath[] {
  const maybeAddSource = (data: Source) => {
    if (seen.has(data.path)) {
      return;
    }

    const dest = path.join(folder, data.name);
    const source = data.path;
    filepaths.push({ source, dest });
    seen.add(data.path);
  };

  const filepaths: Filepath[] = [];
  const seen = new Set<string>();
  for (const asset of assets) {
    for (const visual of asset.visuals) {
      const { textures, source } = visual;
      for (const texture of textures) {
        maybeAddSource(texture);
      }

      maybeAddSource(source);
    }
  }

  return filepaths;
}

async function saveAsset(filepath: Filepath): Promise<void> {
  const { source, dest } = filepath;
  log.info(`Saving: ${source}`);
  await fs.copyFile(source, dest);
  log.info(`Saved: ${dest}`);
}
