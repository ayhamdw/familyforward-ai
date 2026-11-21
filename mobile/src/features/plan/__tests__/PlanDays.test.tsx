import { render, screen } from "@testing-library/react-native";
import { serverPlan } from "@/test/fixtures";
import { setupTestI18n } from "@/test/i18nTestSetup";
import { PlanDays } from "../PlanDays";

jest.mock("expo-router", () => ({ useRouter: () => ({ push: jest.fn() }) }));

beforeEach(async () => {
  await setupTestI18n("en");
});

describe("PlanDays", () => {
  it("shows a card with a chevron for every planned day, with the plan's own titles", async () => {
    const plan = serverPlan();
    await render(<PlanDays plan={plan} />);
    expect(screen.getAllByTestId("day-card-chevron")).toHaveLength(plan.days.length);
    expect(screen.getByText(plan.days[0].activity.title)).toBeTruthy();
  });

  it("uses the activity's own focus label", async () => {
    const plan = serverPlan();
    plan.days[0].activity = { ...plan.days[0].activity, focus: "reading" };
    await render(<PlanDays plan={plan} />);
    expect(screen.getAllByText(/Reading/).length).toBeGreaterThan(0);
  });
});
