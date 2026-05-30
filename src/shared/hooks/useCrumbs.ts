import { create } from "zustand";

type CrumbState = {
  crumbs: string[];
  setCrumbs: (crumbs: string[]) => void;
};

export const useCrumbStore = create<CrumbState>((set) => ({
  crumbs: [],
  setCrumbs: (crumbs) => set({ crumbs }),
}));
