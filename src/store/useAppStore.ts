import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppStateSlice = {
  isMessageLoading: boolean;
  setIsMessageLoading: (isLoading: boolean) => void;
};

export const useAppStore = create<AppStateSlice>()(
  persist(
    (set, get) => ({
      isMessageLoading: false,
      setIsMessageLoading: (isLoading: boolean) => set({ isMessageLoading: isLoading }),
    }),
    {
      name: "app-state",
      partialize: (state) => ({}),
    } // Persist only the selected state
  )
);
