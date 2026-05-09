import { LsxRegion, gatherAttributesValues, getChildNodes, getAttribute, findNodes, loadLsx } from "../utils/lsx";
import { getCacheDirectory, doesExist, walk } from "../utils/os";
import { SourceData, Item, Visual } from "../../shared/types";
import { convert, extract } from "../utils/lslib";
import { RACES } from "../constants/races";
import { getLslibPath } from "./settings";
import { asArray } from "../utils/arrays";
import { loadXml } from "../utils/xml";
import fs from "fs/promises";
import crypto from "crypto";
import path from "path";

export interface Options {
  onProgress?: (message: string) => void;
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
  slots?: string[];
  races?: string[];
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

export async function processPak(options: Options): Promise<Item[]> {
  options.onProgress?.("Processing package...");
  const info = await buildInfo(options.filepath);
  await extractPackage(options, info);
  await convertAssets(options, info);
  const data = await importData(options, info);
  const items = await buildItems(options, info, data);
  const merged = mergeItems(items);
  return merged;
}

async function extractPackage({ onProgress, filepath }: Options, { outputPath, lslibPath }: Info): Promise<void> {
  onProgress?.("Extracting package using lslib...");
  await extract(lslibPath, outputPath, filepath);
}

async function convertAssets({ onProgress }: Options, { outputPath, lslibPath }: Info): Promise<void> {
  onProgress?.("Converting assets using lslib...");
  const filepaths = await walk(outputPath, CONVERT_EXTENSIONS);
  for (const filepath of filepaths) {
    await convert(lslibPath, filepath);
  }
}

async function importData({ onProgress }: Options, { outputPath }: Info): Promise<Data> {
  onProgress?.("Importing assets...");
  const data: Data = {
    visualData: new Map<string, VisualData>(),
    materialData: new Map<string, string[]>(),
    textureData: new Map<string, string>(),
    locData: new Map<string, string>(),
    assetData: [],
  };

  const filepaths = await walk(outputPath, IMPORT_EXTENSIONS);
  for (const filepath of filepaths) {
    const extension = path.extname(filepath).toLowerCase();
    if (extension === ".lsx") {
      await importLsx(filepath, data);
    }

    if (extension === ".xml") {
      await importXml(filepath, data);
    }
  }

  return data;
}

export async function buildItems({ onProgress }: Options, { outputPath }: Info, data: Data): Promise<Item[]> {
  const createSourceData = (source: string): SourceData => {
    return { path: path.join(outputPath, source), name: path.basename(source) };
  };

  onProgress?.("Indexing assets...");
  const items: Item[] = [];
  for (const assetData of data.assetData) {
    const visuals: Visual[] = [];
    for (const visual of assetData.visuals) {
      const visualData = data.visualData.get(visual);
      if (!visualData) {
        continue;
      }

      const textures: SourceData[] = [];
      const seen = new Set<string>();
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

          const filepath = path.join(outputPath, texture);
          const exists = await doesExist(filepath);
          if (!exists) {
            continue;
          }

          if (seen.has(texture)) {
            continue;
          }

          textures.push(createSourceData(texture));
          seen.add(texture);
        }
      }

      const source = createSourceData(visualData.source);
      visuals.push({
        textures,
        source,
      });
    }

    const races = assetData.races?.map((x) => RACES.get(x) ?? "Unknown Race") ?? undefined;
    const name = data.locData.get(assetData.handle);
    const slots = assetData.slots;
    const id = assetData.id;
    if (visuals.length === 0 || !name || !id) {
      continue;
    }

    items.push({
      visuals,
      slots,
      races,
      name,
      id,
    });
  }

  if (items.length === 0) {
    throw new Error("No data found");
  }

  return items;
}

function mergeItems(items: Item[]): Item[] {
  const normalizeItem = (item: Item): string => {
    return JSON.stringify([item.visuals.map((v) => ({ textures: v.textures.map((t) => t.path).sort(), source: v.source.path })).sort((a, b) => a.source.localeCompare(b.source)), item.name]);
  };

  const buildKey = (data: string): string => {
    return crypto.createHash("sha1").update(data).digest("hex");
  };

  const merged = new Map<string, Item>();
  for (const item of items) {
    const key = buildKey(normalizeItem(item));
    const existing = merged.get(key);
    if (existing) {
      existing.slots?.push(...(item.slots ?? []));
      existing.races?.push(...(item.races ?? []));
      continue;
    }

    merged.set(key, {
      ...item,
      slots: [...(item.slots ?? [])],
      races: [...(item.races ?? [])],
    });
  }

  const results = [...merged.values()];
  for (const result of results) {
    result.slots = result.slots ? [...new Set(result.slots)].sort() : undefined;
    result.races = result.races ? [...new Set(result.races)].sort() : undefined;
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
    const visual = getAttribute(node, "VisualResource")?.value;
    const handle = getAttribute(node, "DisplayName")?.handle;
    const race = getAttribute(node, "RaceUUID")?.value;
    const id = getAttribute(node, "UUID")?.value;
    if (!visual || !handle || !race || !id) {
      continue;
    }

    data.assetData.push({
      visuals: [visual],
      races: [race],
      handle,
      id,
    });
  }
}

function parseTemplatesRegion(region: LsxRegion, data: Data) {
  const nodes = getChildNodes(region.node);
  for (const node of nodes) {
    const visuals = findNodes(node, "Visuals")
      .map((x) => gatherAttributesValues(x, "Object"))
      .flat();
    const slots = findNodes(node, "Slot")
      .map((x) => gatherAttributesValues(x, "Object"))
      .flat();
    const handle = getAttribute(node, "DisplayName")?.handle;
    const id = getAttribute(node, "MapKey")?.value;
    if (visuals.length === 0 || !handle || !id) {
      continue;
    }

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
    const textures = findNodes(node, "Texture2DParameters")
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
    throw new Error("Only pak files are supported");
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
