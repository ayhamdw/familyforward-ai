import { create } from "zustand";

/** Dev-only switches used by the mock API and the dev menu. Not persisted. */
type DevState = {
  forceOffline: boolean;
  forcePlanFailure: boolean;
  setForceOffline: (value: boolean) => void;
  setForcePlanFailure: (value: boolean) => void;
};

export const useDevStore = create<DevState>((set) => ({
  forceOffline: false,
  forcePlanFailure: false,
  setForceOffline: (forceOffline) => set({ forceOffline }),
  setForcePlanFailure: (forcePlanFailure) => set({ forcePlanFailure }),
}));
