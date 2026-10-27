import AsyncStorage from "@react-native-async-storage/async-storage";
import { INITIAL_ANSWERS, isSurveyComplete, toggleInList, useSurveyStore } from "../surveyStore";

beforeEach(() => {
  useSurveyStore.getState().reset();
});

describe("toggleInList", () => {
  it("adds and removes values", () => {
    expect(toggleInList(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleInList(["a", "b"], "a")).toEqual(["b"]);
  });

  it("ignores additions once max is reached, but still allows removal", () => {
    expect(toggleInList(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    expect(toggleInList(["a", "b"], "b", 2)).toEqual(["a"]);
  });
});

describe("survey store", () => {
  it("starts with the defaults", () => {
    const state = useSurveyStore.getState();
    expect(state.ageBand).toBeNull();
    expect(state.focus).toEqual([]);
    expect(state.minutes).toBe(10);
    expect(state.days).toBe(3);
  });

  it("allows at most 2 focus areas", () => {
    const { toggleFocus } = useSurveyStore.getState();
    toggleFocus("talking");
    toggleFocus("reading");
    toggleFocus("counting");
    expect(useSurveyStore.getState().focus).toEqual(["talking", "reading"]);

    toggleFocus("talking");
    toggleFocus("counting");
    expect(useSurveyStore.getState().focus).toEqual(["reading", "counting"]);
  });

  it("toggles interests and materials without a limit", () => {
    const state = useSurveyStore.getState();
    state.toggleInterest("songs");
    state.toggleInterest("books");
    state.toggleInterest("building");
    state.toggleMaterial("paper");
    expect(useSurveyStore.getState().interests).toHaveLength(3);
    expect(useSurveyStore.getState().materials).toEqual(["paper"]);
  });

  it("is complete only with an age band and at least one focus area", () => {
    expect(isSurveyComplete(INITIAL_ANSWERS)).toBe(false);
    expect(isSurveyComplete({ ...INITIAL_ANSWERS, ageBand: "2-3" })).toBe(false);
    expect(isSurveyComplete({ ...INITIAL_ANSWERS, ageBand: "2-3", focus: ["talking"] })).toBe(true);
  });

  it("persists only the answers, never a note", async () => {
    useSurveyStore.getState().setAgeBand("4-5");
    useSurveyStore.getState().toggleFocus("counting");
    await new Promise((resolve) => setTimeout(resolve, 0));

    const raw = await AsyncStorage.getItem("familyforward.survey");
    expect(raw).not.toBeNull();
    const saved = JSON.parse(raw ?? "{}") as { state: Record<string, unknown> };
    expect(Object.keys(saved.state).sort()).toEqual(["ageBand", "days", "focus", "interests", "materials", "minutes"]);
    expect(saved.state.ageBand).toBe("4-5");
  });
});
