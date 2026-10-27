import { create } from "zustand";
import { persist } from "zustand/middleware";
import { persistStorage } from "./createStore";

type AuthState = {
  email: string | null;
  signedIn: boolean;
  sessionExpired: boolean;
  hydrated: boolean;
  signIn: (email: string) => void;
  signOut: () => void;
  expireSession: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      email: null,
      signedIn: false,
      sessionExpired: false,
      hydrated: false,
      signIn: (email) => set({ email, signedIn: true, sessionExpired: false }),
      signOut: () => set({ email: null, signedIn: false, sessionExpired: false }),
      expireSession: () => set({ signedIn: false, sessionExpired: true }),
    }),
    {
      name: "familyforward.auth",
      storage: persistStorage,
      partialize: (state) => ({ email: state.email, signedIn: state.signedIn, sessionExpired: state.sessionExpired }),
      onRehydrateStorage: () => () => {
        useAuthStore.setState({ hydrated: true });
      },
    },
  ),
);
