import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppStateSlice = {};

export const useAppStore = create<AppStateSlice>()(
  persist(
    (set, get) => ({}),
    {
      name: "app-state",
      partialize: (state) => ({}),
    } // Persist only the selected state
  )
);
