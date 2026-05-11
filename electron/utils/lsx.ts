import { XMLParser } from "fast-xml-parser";
import { asArray } from "./arrays";
import fs from "fs/promises";

export interface LsxAttribute {
  handle?: string;
  value?: string;
  id: string;
}

export interface LsxNode {
  children?: {
    node?: LsxNode[] | LsxNode;
  };
  attribute?: LsxAttribute[] | LsxAttribute;
  id: string;
}

export interface LsxRegion {
  node?: LsxNode;
  id: string;
}

export interface LsxSave {
  region?: LsxRegion[] | LsxRegion;
}

export interface LsxRoot {
  save?: LsxSave;
}

const PARSER = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
  textNodeName: "text",
});

export function gatherAttributesValues(root: LsxNode, id: string): string[] {
  const attributes = gatherAttributes(root, id);
  const results = attributes.map((x) => x.value).filter((x) => x !== undefined);
  return results;
}

export function gatherAttributes(root: LsxNode, id: string): LsxAttribute[] {
  const nodes = findChildNodes(root);
  const results: LsxAttribute[] = [];
  for (const node of nodes) {
    const attribute = getAttribute(node, id);
    if (!attribute) {
      continue;
    }

    results.push(attribute);
  }

  return results;
}

export function findChildNodes(root: LsxNode, id?: string): LsxNode[] {
  function walk(node: LsxNode) {
    if (!node) {
      return;
    }

    const children = getChildNodes(node);
    for (const child of children) {
      walk(child);
    }

    if (node.id !== id && id) {
      return;
    }

    results.push(node);
  }

  const results: LsxNode[] = [];
  walk(root);
  return results;
}

export function getAttribute(node: LsxNode, id: string): LsxAttribute | undefined {
  const attributes = asArray(node.attribute);
  return attributes.find((x) => x.id === id);
}

export function getChildNodes(node?: LsxNode): LsxNode[] {
  return asArray(node?.children?.node);
}

export async function loadLsx(filepath: string): Promise<LsxRoot> {
  const data = await fs.readFile(filepath, "utf8");
  const root = PARSER.parse(data) as LsxRoot;
  return root;
}
