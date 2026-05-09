export type AppStatus = "waiting" | "processing" | "processed" | "saving";

export interface SourceData {
  path: string;
  name: string;
}

export interface Visual {
  textures: SourceData[];
  source: SourceData;
}

export interface Item {
  visuals: Visual[];
  slots?: string[];
  races?: string[];
  name: string;
  id: string;
}

export interface Settings {
  lslib: Lslib;
}

export interface Lslib {
  filepath: string;
  error: string;
}
