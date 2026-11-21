/* global jest */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Icon fonts cannot load in Jest, so icons render as plain host elements.
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));

// The secure store has no native module in Jest, so keep it in memory.
jest.mock("expo-secure-store", () => {
  const store = new Map();
  return {
    getItemAsync: async (key) => (store.has(key) ? store.get(key) : null),
    setItemAsync: async (key, value) => {
      store.set(key, value);
    },
    deleteItemAsync: async (key) => {
      store.delete(key);
    },
    __store: store,
  };
});
