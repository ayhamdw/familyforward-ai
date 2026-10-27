import { render, screen } from "@testing-library/react-native";
import { INITIAL_ANSWERS } from "@/storage/surveyStore";
import { setupTestI18n } from "@/test/i18nTestSetup";
import { buildMockPlan } from "../buildPlan";
import { PlanDays } from "../PlanDays";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

const answers = { ...INITIAL_ANSWERS, ageBand: "2-3" as const, focus: ["counting" as const], days: 3 as const };

beforeEach(async () => {
  await setupTestI18n("en");
});

describe("PlanDays", () => {
  it("shows a chevron on every card of a custom plan", async () => {
    await render(<PlanDays plan={buildMockPlan(answers, { weekStart: "2026-10-26", source: "custom" })} />);
    expect(screen.getAllByTestId("day-card-chevron")).toHaveLength(3);
  });

  it("shows a chevron on every card of a fallback plan", async () => {
    await render(<PlanDays plan={buildMockPlan(answers, { weekStart: "2026-10-26", source: "fallback" })} />);
    expect(screen.getAllByTestId("day-card-chevron")).toHaveLength(3);
  });

  it("uses the seed category, so Picture Book Chat is Reading", async () => {
    const plan = buildMockPlan({ ...answers, focus: ["reading" as const] }, { weekStart: "2026-10-26", source: "custom" });
    await render(<PlanDays plan={plan} />);
    expect(screen.getByText(/Picture Book Chat/)).toBeTruthy();
    expect(screen.getAllByText(/Reading/).length).toBeGreaterThan(0);
    expect(screen.queryByText(/Talking/)).toBeNull();
  });
});
