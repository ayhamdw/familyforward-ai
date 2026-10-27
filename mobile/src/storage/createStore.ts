import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage } from "zustand/middleware";

/** AsyncStorage-backed JSON storage shared by every persisted store. */
export const persistStorage = createJSONStorage(() => AsyncStorage);
