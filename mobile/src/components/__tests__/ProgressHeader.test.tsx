import { render, screen } from "@testing-library/react-native";
import { StyleSheet } from "react-native";
import { chevronBackName, chevronForwardName, isRTL } from "@/i18n/direction";
import { setupTestI18n } from "@/test/i18nTestSetup";
import { ProgressHeader } from "../ProgressHeader";

jest.mock("@/i18n/direction", () => ({
  ...jest.requireActual<typeof import("@/i18n/direction")>("@/i18n/direction"),
  isRTL: jest.fn(),
}));

const mockedIsRTL = isRTL as jest.MockedFunction<typeof isRTL>;

beforeEach(async () => {
  await setupTestI18n("en");
});

describe("ProgressHeader", () => {
  it("shows a back chevron pointing to the start edge in LTR", async () => {
    mockedIsRTL.mockReturnValue(false);
    await render(<ProgressHeader step={2} onBack={() => undefined} />);
    expect(screen.getByTestId("back-button-ltr")).toBeTruthy();
    expect(screen.queryByTestId("back-button-rtl")).toBeNull();
    expect(chevronBackName(false)).toBe("chevron-back");
  });

  it("flips the back chevron in RTL", async () => {
    mockedIsRTL.mockReturnValue(true);
    await render(<ProgressHeader step={2} onBack={() => undefined} />);
    expect(screen.getByTestId("back-button-rtl")).toBeTruthy();
    expect(screen.queryByTestId("back-button-ltr")).toBeNull();
    expect(chevronBackName(true)).toBe("chevron-forward");
    expect(chevronForwardName(true)).toBe("chevron-back");
  });

  it("fills the bar from the start edge, so the row direction mirrors it", async () => {
    mockedIsRTL.mockReturnValue(true);
    await render(<ProgressHeader step={2} onBack={() => undefined} />);
    const bar = screen.getByTestId("progress-bar");
    expect(StyleSheet.flatten(bar.props.style).flexDirection).toBe("row");
    expect(StyleSheet.flatten(screen.getByTestId("progress-fill").props.style).width).toBe(`${(2 / 6) * 100}%`);
  });

  it("shows the step as 'n of 6' and exposes progress to screen readers", async () => {
    mockedIsRTL.mockReturnValue(false);
    await render(<ProgressHeader step={3} onBack={() => undefined} />);
    expect(screen.getByText("3 of 6")).toBeTruthy();
    expect(screen.getByTestId("progress-bar").props.accessibilityValue).toEqual({ min: 0, max: 6, now: 3 });
  });

  it("uses Eastern Arabic digits in Arabic", async () => {
    await setupTestI18n("ar");
    mockedIsRTL.mockReturnValue(true);
    await render(<ProgressHeader step={2} onBack={() => undefined} />);
    expect(screen.getByText("٢ من ٦")).toBeTruthy();
  });
});
