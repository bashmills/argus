import { AppProgress, AppStatus, Item } from "../../shared/types";
import { create } from "zustand";

interface AppState {
  updateAppStatus: (appStatus: AppStatus, items: Item[]) => void;

  setAppProgress: (appProgress: AppProgress) => void;
  setAppStatus: (appStatus: AppStatus) => void;
  setItems: (items: Item[]) => void;

  reset: () => void;

  appProgress: AppProgress;
  appStatus: AppStatus;
  items: Item[];
}

export const useAppStore = create<AppState>((set) => ({
  updateAppStatus: (appStatus: AppStatus, items: Item[]) => set({ appStatus, items }),

  setAppProgress: (appProgress: AppProgress) => set((state) => ({ appProgress: { message: appProgress.message ?? state.appProgress.message, progress: appProgress.progress } })),
  setAppStatus: (appStatus: AppStatus) => set({ appStatus }),
  setItems: (items: Item[]) => set({ items }),

  reset: () => set({ appProgress: {}, appStatus: "waiting", items: [] }),

  appProgress: {},
  appStatus: "waiting",
  items: [],
}));
