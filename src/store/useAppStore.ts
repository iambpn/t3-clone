import { create } from "zustand";
import { persist } from "zustand/middleware";

export type AppStateSlice = {
  isMessageLoading: boolean;
  setIsMessageLoading: (isLoading: boolean) => void;
};

export const useAppStore = create<AppStateSlice>()(
  persist(
    (set) => ({
      isMessageLoading: false,
      setIsMessageLoading: (isLoading: boolean) => set({ isMessageLoading: isLoading }),
    }),
    {
      name: "app-state",
      partialize: () => ({}),
    } // Persist only the selected state
  )
);
