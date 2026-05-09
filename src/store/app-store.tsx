import { AppStatus, Item } from "../../shared/types";
import { create } from "zustand";

interface AppState {
  updateStatus: (appStatus: AppStatus, items: Item[]) => void;
  setAppStatus: (appStatus: AppStatus) => void;
  setProgress: (progress: string) => void;
  reset: () => void;

  appStatus: AppStatus;
  progress: string;
  items: Item[];
}

export const useAppStore = create<AppState>((set) => ({
  updateStatus: (appStatus: AppStatus, items: Item[]) => set({ appStatus, progress: "", items }),
  setAppStatus: (appStatus: AppStatus) => set({ appStatus, progress: "" }),
  setProgress: (progress: string) => set({ progress }),
  reset: () => set({ appStatus: "waiting", progress: "", items: [] }),

  appStatus: "waiting",
  progress: "",
  items: [],
}));
