export type AppStatus = "processing" | "processed" | "exporting" | "waiting";

export interface AppProgress {
  progress?: {
    total: number;
    count: number;
  };
  message?: string;
}

export interface Lslib {
  filepath: string;
  error: string;
}

export interface Settings {
  lslib: Lslib;
}

export interface Source {
  path?: string;
  name?: string;
  id: string;
}

export interface Material {
  virtualTextures: Source[];
  textures: Source[];
  id: string;
}

export interface Visual {
  materials: Material[];
  source: Source;
}

export interface Item {
  visuals: Visual[];
  races?: string[];
  slots?: string[];
  name: string;
  id: string;
}
