export type AppStatus = "processing" | "processed" | "exporting" | "waiting";

export interface AppProgress {
  message?: string;
  progress?: {
    total: number;
    count: number;
  };
}

export interface Lslib {
  filepath: string;
  error: string;
}

export interface Settings {
  lslib: Lslib;
}

export interface Source {
  path: string;
  name: string;
}

export interface Visual {
  textures: Source[];
  source: Source;
}

export interface Item {
  visuals: Visual[];
  slots?: string[];
  races?: string[];
  name: string;
  id: string;
}
