/* global jest */
jest.mock("@react-native-async-storage/async-storage", () =>
  require("@react-native-async-storage/async-storage/jest/async-storage-mock"),
);

// Icon fonts cannot load in Jest, so icons render as plain host elements.
jest.mock("@expo/vector-icons", () => ({ Ionicons: "Ionicons" }));
