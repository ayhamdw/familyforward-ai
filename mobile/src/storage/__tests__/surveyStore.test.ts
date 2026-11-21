import AsyncStorage from "@react-native-async-storage/async-storage";
import { MAX_FOCUS_AREAS } from "@familyforward/shared";
import { useDraftStore } from "../draftStore";
import { INITIAL_ANSWERS, isSurveyComplete, toggleInList, useSurveyStore } from "../surveyStore";

beforeEach(() => {
  useSurveyStore.getState().reset();
  useDraftStore.getState().clear();
});

describe("toggleInList", () => {
  it("adds and removes", () => {
    expect(toggleInList(["a"], "b")).toEqual(["a", "b"]);
    expect(toggleInList(["a", "b"], "a")).toEqual(["b"]);
  });
  it("ignores adds beyond the max but still allows removing", () => {
    expect(toggleInList(["a", "b"], "c", 2)).toEqual(["a", "b"]);
    expect(toggleInList(["a", "b"], "b", 2)).toEqual(["a"]);
  });
});

describe("surveyStore", () => {
  it("starts empty and is complete once a focus is picked", () => {
    expect(isSurveyComplete(INITIAL_ANSWERS)).toBe(false);
    expect(isSurveyComplete({ ...INITIAL_ANSWERS, focus: ["talking"] })).toBe(true);
  });

  it("allows at most two focus areas", () => {
    const s = useSurveyStore.getState();
    for (const f of ["talking", "reading", "counting"] as const) s.toggleFocus(f);
    expect(useSurveyStore.getState().focus).toHaveLength(MAX_FOCUS_AREAS);
  });

  it("has no age field and no note field: age comes from the child", () => {
    const keys = Object.keys(useSurveyStore.getState());
    expect(keys).not.toContain("ageBand");
    expect(keys).not.toContain("note");
  });
});

describe("saving midway (drafts)", () => {
  it("saves every change under the child's id and restores it later", () => {
    const s = useSurveyStore.getState();
    s.loadForChild("c1");
    s.toggleFocus("reading");
    s.setMinutes(20);
    s.toggleMaterial("books");
    s.reachStep(3);
    expect(useDraftStore.getState().drafts.c1).toMatchObject({ focus: ["reading"], minutes: 20, materials: ["books"], step: 3 });

    // Another child starts clean, and the first child's draft is untouched.
    useSurveyStore.getState().loadForChild("c2");
    expect(useSurveyStore.getState().focus).toEqual([]);
    expect(useSurveyStore.getState().step).toBe(1);
    useSurveyStore.getState().loadForChild("c1");
    expect(useSurveyStore.getState()).toMatchObject({ focus: ["reading"], minutes: 20, materials: ["books"], step: 3 });
  });

  it("only moves the step forward", () => {
    const s = useSurveyStore.getState();
    s.loadForChild("c1");
    s.reachStep(4);
    s.reachStep(2);
    expect(useSurveyStore.getState().step).toBe(4);
  });

  it("never saves a note, even if one is sneaked into the draft", async () => {
    const s = useSurveyStore.getState();
    s.loadForChild("c1");
    s.toggleFocus("talking");
    useDraftStore.getState().save("c1", { ...useDraftStore.getState().drafts.c1, note: "zzz-secret-note" } as never);
    await new Promise((resolve) => setTimeout(resolve, 10));
    const raw = (await AsyncStorage.getItem("familyforward.drafts")) ?? "";
    expect(raw).toContain("talking");
    expect(raw).not.toMatch(/note|zzz-secret-note/);
  });

  it("keeps the answers as next week's starting point at the last step when a plan is built", () => {
    const s = useSurveyStore.getState();
    s.loadForChild("c1");
    s.toggleFocus("counting");
    s.finish();
    expect(useDraftStore.getState().drafts.c1).toMatchObject({ focus: ["counting"], step: 5 });
  });

  it("resumes drafts after a restart", async () => {
    const s = useSurveyStore.getState();
    s.loadForChild("c1");
    s.toggleFocus("feelings");
    await new Promise((resolve) => setTimeout(resolve, 10));
    const raw = (await AsyncStorage.getItem("familyforward.drafts")) as string;
    useDraftStore.setState({ drafts: {} });
    await new Promise((resolve) => setTimeout(resolve, 10));
    await AsyncStorage.setItem("familyforward.drafts", raw);
    await useDraftStore.persist.rehydrate();
    expect(useDraftStore.getState().drafts.c1.focus).toEqual(["feelings"]);
  });
});
