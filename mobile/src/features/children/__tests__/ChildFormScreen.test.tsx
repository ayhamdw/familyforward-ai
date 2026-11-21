import { fireEvent, render, screen, waitFor } from "@testing-library/react-native";
import { setupTestI18n } from "@/test/i18nTestSetup";
import { ChildFormScreen } from "../ChildFormScreen";

const mockPush = jest.fn();
const mockBack = jest.fn();
const mockSaveChild = jest.fn();

jest.mock("expo-router", () => ({
  useRouter: () => ({ push: mockPush, back: mockBack, replace: jest.fn() }),
  useLocalSearchParams: () => ({}),
}));
jest.mock("@/services/actions", () => ({
  saveChild: (...args: unknown[]) => mockSaveChild(...args),
  removeChild: jest.fn(),
}));
jest.mock("@/features/survey/startSurvey", () => ({ startSurvey: jest.fn() }));

beforeEach(async () => {
  jest.clearAllMocks();
  mockSaveChild.mockResolvedValue({ id: "c1" });
  await setupTestI18n("en");
});

describe("add a child", () => {
  it("asks only for a nickname, an age band and home languages", async () => {
    await render(<ChildFormScreen />);
    expect(screen.getByLabelText("Nickname")).toBeTruthy();
    expect(screen.getByText("2–3 years")).toBeTruthy();
    expect(screen.getByText("4–5 years")).toBeTruthy();
    for (const language of ["English", "Spanish", "Arabic", "Another language"]) expect(screen.getByText(language)).toBeTruthy();
    expect(screen.queryByText(/birth|school|last name/i)).toBeNull();
  });

  it("limits the nickname to 20 characters and tells parents to avoid a full name", async () => {
    await render(<ChildFormScreen />);
    expect(screen.getByLabelText("Nickname").props.maxLength).toBe(20);
    expect(screen.getByText("Use a nickname, not your child's full name.")).toBeTruthy();
  });

  it("keeps Continue off until a nickname, an age and a language are chosen, then saves exactly those", async () => {
    await render(<ChildFormScreen />);
    const next = () => screen.getByRole("button", { name: "Continue" });
    expect(next().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByLabelText("Nickname"), "  Sunny ");
    await fireEvent.press(screen.getByRole("radio", { name: "2–3 years" }));
    expect(next().props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByRole("checkbox", { name: "Spanish" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "English" }));
    expect(next().props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(next());
    await waitFor(() => expect(mockSaveChild).toHaveBeenCalledTimes(1));
    expect(mockSaveChild).toHaveBeenCalledWith({ nickname: "Sunny", ageBand: "2-3", homeLanguages: ["es", "en"] }, undefined);
  });

  it("shows a gentle error when saving fails", async () => {
    mockSaveChild.mockRejectedValue(new Error("offline"));
    await render(<ChildFormScreen />);
    await fireEvent.changeText(screen.getByLabelText("Nickname"), "Sol");
    await fireEvent.press(screen.getByRole("radio", { name: "4–5 years" }));
    await fireEvent.press(screen.getByRole("checkbox", { name: "English" }));
    await fireEvent.press(screen.getByRole("button", { name: "Continue" }));
    await waitFor(() => expect(screen.getByText(/couldn't save this/)).toBeTruthy());
  });
});
