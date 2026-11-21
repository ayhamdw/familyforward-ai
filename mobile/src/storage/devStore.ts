import { create } from "zustand";

/** Dev-only switches used by the dev menu. Not persisted. */
type DevState = {
  /** Use the in-memory demo profile instead of the real API. */
  demo: boolean;
  forceOffline: boolean;
  forcePlanFailure: boolean;
  setDemo: (value: boolean) => void;
  setForceOffline: (value: boolean) => void;
  setForcePlanFailure: (value: boolean) => void;
};

export const useDevStore = create<DevState>((set) => ({
  demo: false,
  forceOffline: false,
  forcePlanFailure: false,
  setDemo: (demo) => set({ demo }),
  setForceOffline: (forceOffline) => set({ forceOffline }),
  setForcePlanFailure: (forcePlanFailure) => set({ forcePlanFailure }),
}));
