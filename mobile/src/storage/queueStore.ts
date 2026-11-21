import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CheckInAnswer, Reaction } from "@familyforward/shared";
import { persistStorage } from "./createStore";

/** A write made while offline. Only ids, booleans and enums: never free text. */
export type QueuedWrite =
  | { id: string; type: "activity"; planId: string; index: number; done: boolean; reaction: Reaction | null }
  | { id: string; type: "checkin"; planId: string; answers: CheckInAnswer[] };

type DistributiveOmit<T, K extends keyof T> = T extends unknown ? Omit<T, K> : never;
export type NewWrite = DistributiveOmit<QueuedWrite, "id"> & { id?: string };

type QueueState = {
  items: QueuedWrite[];
  hydrated: boolean;
  enqueue: (item: NewWrite) => void;
  remove: (id: string) => void;
  clear: () => void;
};

let counter = 0;
const newId = () => `${Date.now().toString(36)}-${(counter += 1)}`;

export const useQueueStore = create<QueueState>()(
  persist(
    (set) => ({
      items: [],
      hydrated: false,
      enqueue: (item) =>
        set((s) => {
          const entry = { ...item, id: item.id ?? newId() } as QueuedWrite;
          // A newer write to the same activity replaces the older one.
          const kept = s.items.filter((q) =>
            entry.type === "activity" ? !(q.type === "activity" && q.planId === entry.planId && q.index === entry.index) : !(q.type === "checkin" && q.planId === entry.planId),
          );
          return { items: [...kept, entry] };
        }),
      remove: (id) => set((s) => ({ items: s.items.filter((q) => q.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "familyforward.queue",
      storage: persistStorage,
      partialize: (s) => ({ items: s.items }),
      onRehydrateStorage: () => () => {
        useQueueStore.setState({ hydrated: true });
      },
    },
  ),
);
