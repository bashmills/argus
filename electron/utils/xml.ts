import { XMLParser } from "fast-xml-parser";
import fs from "fs/promises";

export interface XmlContent {
  contentuid?: string;
  text?: string;
}

export interface XmlContentList {
  content?: XmlContent[] | XmlContent;
}

export interface XmlRoot {
  contentList?: XmlContentList;
}

const PARSER = new XMLParser({
  attributeNamePrefix: "",
  ignoreAttributes: false,
  textNodeName: "text",
});

export async function loadXml(filepath: string): Promise<XmlRoot> {
  const data = await fs.readFile(filepath, "utf8");
  const root = PARSER.parse(data) as XmlRoot;
  return root;
}
