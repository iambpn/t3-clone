import type { api } from "convex/_generated/api";
import { create } from "zustand";
import { persist } from "zustand/middleware";

type ModelReturnType = (typeof api.model.getSupportedModels._returnType)[0];

export type ModelState = {
  selectedModel: ModelReturnType | null;
  setSelectedModel: (model: ModelReturnType | null) => void;
};

export const useModalStore = create<ModelState>()(
  persist(
    (set) => ({
      selectedModel: null,
      setSelectedModel: (model: ModelReturnType | null) => set({ selectedModel: model }),
    }),
    {
      name: "modal-state",
      partialize: (state) => ({
        selectedModel: state.selectedModel,
      }),
    } // Persist only the selected state
  )
);
