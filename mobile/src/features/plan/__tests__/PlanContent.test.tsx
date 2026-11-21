import { Linking } from "react-native";
import { fireEvent, render, screen } from "@testing-library/react-native";
import { CLOSING_LINES, findResource, type PlanDto } from "@familyforward/shared";
import { buildLocalPlan } from "../buildPlan";
import { PlanContent } from "../PlanContent";
import { CHILD, ANSWERS, serverPlan } from "@/test/fixtures";
import { setupTestI18n } from "@/test/i18nTestSetup";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const LANGS = ["en", "es", "ar"] as const;

function planFor(language: (typeof LANGS)[number], over: Partial<PlanDto> = {}): PlanDto {
  return { ...buildLocalPlan({ ...CHILD, homeLanguages: ["es", "ar"] }, { ...ANSWERS, focus: ["feelings", "talking"], minutes: 5, materials: [] }, language), ...over };
}

describe.each(LANGS)("plan rendering in %s", (language) => {
  beforeEach(async () => {
    await setupTestI18n(language);
    jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
  });

  it("shows the summary, every activity, the worth-noticing cards, resources and the fixed closing line", async () => {
    const plan = planFor(language);
    await render(<PlanContent plan={plan} />);
    expect(screen.getByText(plan.summary)).toBeTruthy();
    for (const day of plan.days) expect(screen.getByText(day.activity.title)).toBeTruthy();
    expect(screen.getAllByTestId("worth-noticing-card").length).toBe(Math.min(plan.worthNoticing.length, 3));
    for (const card of plan.worthNoticing.slice(0, 3)) expect(screen.getByText(card.observation)).toBeTruthy();
    for (const id of plan.resourceIds) expect(screen.getAllByText(findResource(id)!.name).length).toBeGreaterThan(0);
    expect(screen.getByText(CLOSING_LINES[language])).toBeTruthy();
  });

  it("describes each resource in the plan language", async () => {
    const plan = planFor(language);
    await render(<PlanContent plan={plan} />);
    const offers = findResource(plan.resourceIds[0])!.offers[language];
    expect(screen.getAllByText(offers).length).toBeGreaterThan(0);
  });
});

describe("plan rendering rules", () => {
  beforeEach(async () => {
    await setupTestI18n("en");
    jest.spyOn(Linking, "openURL").mockResolvedValue(true as never);
  });

  it("never shows more than three worth-noticing cards", async () => {
    const card = { observation: "A", tryThis: "B", mentionTo: "none" as const, resourceIds: [] };
    const plan = serverPlan({ worthNoticing: [card, { ...card, observation: "A2" }, { ...card, observation: "A3" }, { ...card, observation: "A4" }] });
    await render(<PlanContent plan={plan} />);
    expect(screen.getAllByTestId("worth-noticing-card")).toHaveLength(3);
    expect(screen.queryByText("A4")).toBeNull();
  });

  it("shows no worth-noticing section when there are no cards", async () => {
    await render(<PlanContent plan={serverPlan({ worthNoticing: [] })} />);
    expect(screen.queryByText("Worth noticing")).toBeNull();
  });

  it("tells the parent who to mention a concern to, in plain words", async () => {
    const plan = serverPlan({ worthNoticing: [{ observation: "Thanks.", tryThis: "I have a question.", mentionTo: "teacher", resourceIds: ["cps-child-find"] }] });
    await render(<PlanContent plan={plan} />);
    expect(screen.getByText("Worth mentioning to: your child's teacher")).toBeTruthy();
    expect(screen.getByText("You could say: I have a question.")).toBeTruthy();
  });

  it("opens https links in the browser", async () => {
    const plan = serverPlan({ resourceIds: ["vroom", "pbs-kids-for-parents"] });
    await render(<PlanContent plan={plan} />);
    await fireEvent.press(screen.getByLabelText(/^Vroom\./));
    expect(Linking.openURL).toHaveBeenCalledWith("https://www.vroom.org/");
    for (const [url] of (Linking.openURL as jest.Mock).mock.calls) expect(String(url).startsWith("https://")).toBe(true);
  });

  it("opens the dialer for a phone number, digits only", async () => {
    const plan = serverPlan({ resourceIds: ["cps-child-find", "vroom"] });
    await render(<PlanContent plan={plan} />);
    await fireEvent.press(screen.getByLabelText(/Call 773-251-4855/));
    expect(Linking.openURL).toHaveBeenCalledWith("tel:7732514855");
  });

  it("skips ids that are not in the directory instead of crashing", async () => {
    await render(<PlanContent plan={serverPlan({ resourceIds: ["made-up", "vroom"] })} />);
    expect(screen.getAllByText("Vroom").length).toBeGreaterThan(0);
  });

  it("does not show a note or any label on the plan", async () => {
    await render(<PlanContent plan={serverPlan()} />);
    expect(screen.queryByText(/risk|score|percentile|behind|delayed/i)).toBeNull();
  });
});
