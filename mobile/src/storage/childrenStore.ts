import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChildDto } from "@familyforward/shared";
import { persistStorage } from "./createStore";

type ChildrenState = {
  children: ChildDto[];
  activeChildId: string | null;
  hydrated: boolean;
  setChildren: (children: ChildDto[]) => void;
  upsert: (child: ChildDto) => void;
  remove: (id: string) => void;
  setActive: (id: string | null) => void;
  clear: () => void;
};

export function activeChild(state: Pick<ChildrenState, "children" | "activeChildId">): ChildDto | null {
  return state.children.find((c) => c.id === state.activeChildId) ?? state.children[0] ?? null;
}

export const useChildrenStore = create<ChildrenState>()(
  persist(
    (set) => ({
      children: [],
      activeChildId: null,
      hydrated: false,
      setChildren: (children) =>
        set((s) => ({ children, activeChildId: children.some((c) => c.id === s.activeChildId) ? s.activeChildId : (children[0]?.id ?? null) })),
      upsert: (child) =>
        set((s) => {
          const exists = s.children.some((c) => c.id === child.id);
          const children = exists ? s.children.map((c) => (c.id === child.id ? child : c)) : [...s.children, child];
          return { children, activeChildId: s.activeChildId ?? child.id };
        }),
      remove: (id) =>
        set((s) => {
          const children = s.children.filter((c) => c.id !== id);
          return { children, activeChildId: s.activeChildId === id ? (children[0]?.id ?? null) : s.activeChildId };
        }),
      setActive: (activeChildId) => set({ activeChildId }),
      clear: () => set({ children: [], activeChildId: null }),
    }),
    {
      name: "familyforward.children",
      storage: persistStorage,
      partialize: (s) => ({ children: s.children, activeChildId: s.activeChildId }),
      onRehydrateStorage: () => () => {
        useChildrenStore.setState({ hydrated: true });
      },
    },
  ),
);
