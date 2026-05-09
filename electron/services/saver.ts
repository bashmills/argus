import { SourceData, Item } from "../../shared/types";
import log from "electron-log/main";
import fs from "fs/promises";
import path from "path";

export interface Options {
  onProgress?: (message: string) => void;
  folder: string;
  assets: Item[];
}

interface Filepath {
  source: string;
  dest: string;
}

export async function saveAssets({ onProgress, assets, folder }: Options): Promise<void> {
  onProgress?.("Saving assets...");
  const filepaths = gatherFilepaths(assets, folder);
  for (const filepath of filepaths) {
    await saveAsset(filepath);
  }
}

function gatherFilepaths(assets: Item[], folder: string): Filepath[] {
  const maybeAddSource = (data: SourceData) => {
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
