import { LsxRegion, gatherAttributesValues, findChildNodes, getChildNodes, getAttribute, loadLsx } from "../utils/lsx";
import { AppProgress, Source, Visual, Item } from "../../shared/types";
import { getCacheDirectory, sleep, walk } from "../utils/os";
import { convert, extract } from "../utils/lslib";
import { RACES } from "../constants/races";
import { getLslibPath } from "./settings";
import { asArray } from "../utils/arrays";
import { loadXml } from "../utils/xml";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";

export interface Options {
  onAppProgress?: (appProgress: AppProgress) => void;
  filepath: string;
}

interface Data {
  visualData: Map<string, VisualData>;
  materialData: Map<string, string[]>;
  textureData: Map<string, string>;
  locData: Map<string, string>;
  assetData: AssetData[];
}

interface AssetData {
  visuals: string[];
  races?: string[];
  slots?: string[];
  handle: string;
  id: string;
}

interface VisualData {
  materials: string[];
  source: string;
}

interface Info {
  outputPath: string;
  lslibPath: string;
}

const CONVERT_EXTENSIONS = [".loca", ".lsb", ".lsf", ".lsj"];
const IMPORT_EXTENSIONS = [".lsx", ".xml"];
const DELAY = 5;

export async function processPak(options: Options): Promise<Item[]> {
  options.onAppProgress?.({ message: "Processing package..." });
  const info = await buildInfo(options.filepath);
  await extractPackage(options, info);
  await convertAssets(options, info);
  const data = await importData(options, info);
  const items = await buildItems(options, info, data);
  return mergeItems(options, items);
}

async function extractPackage({ onAppProgress, filepath }: Options, { outputPath, lslibPath }: Info): Promise<void> {
  onAppProgress?.({ message: "Extracting package..." });
  await extract(lslibPath, outputPath, filepath);
  await sleep(DELAY);
}

async function convertAssets({ onAppProgress }: Options, { outputPath, lslibPath }: Info): Promise<void> {
  const updateProgress = (count: number) => {
    onAppProgress?.({ progress: { total: filepaths.length, count } });
  };

  onAppProgress?.({ message: "Converting assets..." });
  const filepaths = await walk(outputPath, CONVERT_EXTENSIONS);
  updateProgress(0);
  for (let index = 0; index < filepaths.length; index++) {
    const filepath = filepaths[index];
    await convert(lslibPath, filepath);
    updateProgress(index + 1);
    await sleep(DELAY);
  }
}

async function importData({ onAppProgress }: Options, { outputPath }: Info): Promise<Data> {
  const updateProgress = (count: number) => {
    onAppProgress?.({ progress: { total: filepaths.length, count } });
  };

  onAppProgress?.({ message: "Importing assets..." });
  const data: Data = {
    visualData: new Map<string, VisualData>(),
    materialData: new Map<string, string[]>(),
    textureData: new Map<string, string>(),
    locData: new Map<string, string>(),
    assetData: [],
  };

  const filepaths = await walk(outputPath, IMPORT_EXTENSIONS);
  updateProgress(0);
  for (let index = 0; index < filepaths.length; index++) {
    const filepath = filepaths[index];
    const extension = path.extname(filepath).toLowerCase();
    switch (extension) {
      case ".lsx":
        await importLsx(filepath, data);
        break;
      case ".xml":
        await importXml(filepath, data);
        break;
    }

    updateProgress(index + 1);
    await sleep(DELAY);
  }

  return data;
}

export async function buildItems({ onAppProgress }: Options, { outputPath }: Info, data: Data): Promise<Item[]> {
  const createSource = (source: string, id: string): Source => {
    return { path: path.join(outputPath, source), name: path.basename(source), id };
  };

  const updateProgress = (count: number) => {
    onAppProgress?.({ progress: { total: data.assetData.length, count } });
  };

  onAppProgress?.({ message: "Indexing assets..." });
  const items: Item[] = [];
  updateProgress(0);

  for (let index = 0; index < data.assetData.length; index++) {
    try {
      const assetData = data.assetData[index];
      const visuals: Visual[] = [];
      for (const visual of assetData.visuals) {
        const visualData = data.visualData.get(visual);
        if (!visualData) {
          continue;
        }

        const seen = new Set<string>();
        const textures: Source[] = [];
        for (const material of visualData.materials) {
          const ids = data.materialData.get(material);
          if (!ids) {
            continue;
          }

          for (const id of ids) {
            const texture = data.textureData.get(id);
            if (!texture) {
              continue;
            }

            if (seen.has(texture)) {
              continue;
            }

            textures.push(createSource(texture, id));
            seen.add(texture);
          }
        }

        const source = createSource(visualData.source, visual);
        visuals.push({
          textures,
          source,
        });
      }

      const races = assetData.races?.map((x) => RACES.get(x) ?? "Unknown Race");
      const name = data.locData.get(assetData.handle);
      const slots = assetData.slots;
      const id = assetData.id;
      if (visuals.length === 0 || !name || !id) {
        continue;
      }

      items.push({
        visuals,
        races,
        slots,
        name,
        id,
      });
    } finally {
      updateProgress(index + 1);
      await sleep(DELAY);
    }
  }

  if (items.length === 0) {
    throw new Error("No data found");
  }

  return items;
}

async function mergeItems({ onAppProgress }: Options, items: Item[]): Promise<Item[]> {
  const normalizeItem = (item: Item): string => {
    return JSON.stringify([item.visuals.map((v) => ({ textures: v.textures.map((t) => t.path).sort(), source: v.source.path })).sort((a, b) => a.source.localeCompare(b.source)), item.name]);
  };

  const buildKey = (data: string): string => {
    return crypto.createHash("sha1").update(data).digest("hex");
  };

  const updateProgress = (count: number) => {
    onAppProgress?.({ progress: { total: items.length, count } });
  };

  onAppProgress?.({ message: "Merging assets..." });
  const merged = new Map<string, Item>();
  updateProgress(0);

  for (let index = 0; index < items.length; index++) {
    try {
      const item = items[index];
      const key = buildKey(normalizeItem(item));
      const existing = merged.get(key);
      if (existing) {
        existing.races?.push(...(item.races ?? []));
        existing.slots?.push(...(item.slots ?? []));
        continue;
      }

      merged.set(key, {
        ...item,
        races: [...(item.races ?? [])],
        slots: [...(item.slots ?? [])],
      });
    } finally {
      updateProgress(index + 1);
      await sleep(DELAY);
    }
  }

  const results = [...merged.values()];
  for (const result of results) {
    result.races = result.races ? [...new Set(result.races)].sort() : undefined;
    result.slots = result.slots ? [...new Set(result.slots)].sort() : undefined;
  }

  return results;
}

async function importLsx(filepath: string, data: Data): Promise<void> {
  const root = await loadLsx(filepath);
  const regions = asArray(root?.save?.region);
  for (const region of regions) {
    switch (region.id) {
      case "CharacterCreationAppearanceVisuals":
        parseCharacterCreationRegion(region, data);
        break;
      case "CharacterCreationSharedVisuals":
        parseCharacterCreationRegion(region, data);
        break;
      case "Templates":
        parseTemplatesRegion(region, data);
        break;
      case "VisualBank":
        parseVisualRegion(region, data);
        break;
      case "MaterialBank":
        parseMaterialRegion(region, data);
        break;
      case "TextureBank":
        parseTextureRegion(region, data);
        break;
    }
  }
}

function parseCharacterCreationRegion(region: LsxRegion, data: Data) {
  const nodes = getChildNodes(region.node);
  for (const node of nodes) {
    const visuals = asArray(getAttribute(node, "VisualResource")?.value);
    const handle = getAttribute(node, "DisplayName")?.handle;
    const id = getAttribute(node, "UUID")?.value;
    if (visuals.length === 0 || !handle || !id) {
      continue;
    }

    const races = asArray(getAttribute(node, "RaceUUID")?.value);
    const slots = asArray(getAttribute(node, "SlotName")?.value);

    data.assetData.push({
      visuals,
      races,
      slots,
      handle,
      id,
    });
  }
}

function parseTemplatesRegion(region: LsxRegion, data: Data) {
  const nodes = getChildNodes(region.node);
  for (const node of nodes) {
    const visuals = findChildNodes(node, "Visuals")
      .map((x) => gatherAttributesValues(x, "Object"))
      .flat();
    const handle = getAttribute(node, "DisplayName")?.handle;
    const id = getAttribute(node, "MapKey")?.value;
    if (visuals.length === 0 || !handle || !id) {
      continue;
    }

    const slots = findChildNodes(node, "Slot")
      .map((x) => gatherAttributesValues(x, "Object"))
      .flat();

    data.assetData.push({
      visuals,
      slots,
      handle,
      id,
    });
  }
}

function parseVisualRegion(region: LsxRegion, data: Data) {
  const nodes = getChildNodes(region.node);
  for (const node of nodes) {
    const materials = gatherAttributesValues(node, "MaterialID");
    const source = getAttribute(node, "SourceFile")?.value;
    const id = getAttribute(node, "ID")?.value;
    if (!source || !id) {
      continue;
    }

    data.visualData.set(id, { materials, source });
  }
}

function parseMaterialRegion(region: LsxRegion, data: Data) {
  const nodes = getChildNodes(region.node);
  for (const node of nodes) {
    const textures = findChildNodes(node, "Texture2DParameters")
      .map((x) => gatherAttributesValues(x, "ID"))
      .flat();
    const id = getAttribute(node, "ID")?.value;
    if (!id) {
      continue;
    }

    data.materialData.set(id, textures);
  }
}

function parseTextureRegion(region: LsxRegion, data: Data) {
  const nodes = getChildNodes(region.node);
  for (const node of nodes) {
    const source = getAttribute(node, "SourceFile")?.value;
    const id = getAttribute(node, "ID")?.value;
    if (!source || !id) {
      continue;
    }

    data.textureData.set(id, source);
  }
}

async function importXml(filepath: string, data: Data): Promise<void> {
  const root = await loadXml(filepath);
  const entries = asArray(root?.contentList?.content);
  for (const entry of entries) {
    const handle = entry?.contentuid;
    const value = entry?.text;
    if (!handle || !value) {
      continue;
    }

    data.locData.set(handle, value);
  }
}

async function buildInfo(filepath: string): Promise<Info> {
  const extension = path.extname(filepath).toLowerCase();
  if (extension !== ".pak") {
    throw new Error("Only .pak files are supported");
  }

  await fs.rm(getCacheDirectory(), { recursive: true, force: true });
  await fs.mkdir(getCacheDirectory(), { recursive: true });
  const folder = path.basename(filepath).slice(0, -4);
  const outputPath = path.join(getCacheDirectory(), folder);
  const lslibPath = await getLslibPath();

  return {
    outputPath,
    lslibPath,
  };
}
