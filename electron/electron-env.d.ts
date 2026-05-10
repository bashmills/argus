/// <reference types="vite-plugin-electron/electron-env" />

interface Window {
  backend: {
    onAppProgress: (callback: (appProgress: AppProgress) => void) => () => void;
    onShowError: (callback: (error: Error) => void) => () => void;

    processPak: (file: File | string) => Promise<Item[]>;
    browsePak: () => Promise<string | null>;

    exportAssets: (assets: Item[], folder: string) => Promise<boolean>;
    chooseFolder: () => Promise<string>;

    validateLslibPath: (lslibPath: string) => Promise<Lslib | null>;
    browseLslibPath: () => Promise<Lslib | null>;

    saveSettings: (settings: Settings) => Promise<boolean>;
    getSettings: () => Promise<Settings | null>;

    clearCache: () => Promise<boolean>;
    getVersion: () => Promise<string>;
  };
}

declare namespace NodeJS {
  interface ProcessEnv {
    VITE_PUBLIC: string;
    APP_ROOT: string;
  }
}
