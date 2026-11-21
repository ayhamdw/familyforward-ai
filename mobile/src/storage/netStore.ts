import { create } from "zustand";

/** Whether the last request reached the server. Not persisted. */
type NetState = {
  online: boolean;
  setOnline: (online: boolean) => void;
};

export const useNetStore = create<NetState>((set) => ({
  online: true,
  setOnline: (online) => set({ online }),
}));
