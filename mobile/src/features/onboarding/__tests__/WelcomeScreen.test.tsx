import { fireEvent, render, screen } from "@testing-library/react-native";
import { changeLanguage } from "@/i18n";
import { setupTestI18n } from "@/test/i18nTestSetup";
import { WelcomeScreen } from "../WelcomeScreen";

const mockPush = jest.fn();

jest.mock("expo-router", () => ({
  Redirect: () => null,
  useRouter: () => ({ push: mockPush }),
}));

jest.mock("@/i18n", () => ({
  changeLanguage: jest.fn(),
  LANGUAGE_NAMES: { en: "English", es: "Español", ar: "العربية" },
}));

const mockedChangeLanguage = changeLanguage as jest.MockedFunction<typeof changeLanguage>;

beforeEach(async () => {
  mockPush.mockClear();
  mockedChangeLanguage.mockReset();
  await setupTestI18n("en");
});

describe("WelcomeScreen language choice", () => {
  it("shows a reload message and stays put when the layout direction changes", async () => {
    mockedChangeLanguage.mockResolvedValue(true);
    await render(<WelcomeScreen />);
    expect(screen.queryByText("Please reload the app to finish changing the language.")).toBeNull();

    await fireEvent.press(screen.getByLabelText("العربية"));

    expect(mockedChangeLanguage).toHaveBeenCalledWith("ar");
    expect(await screen.findByText("Please reload the app to finish changing the language.")).toBeTruthy();
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("goes to the consent screen when no reload is needed", async () => {
    mockedChangeLanguage.mockResolvedValue(false);
    await render(<WelcomeScreen />);

    await fireEvent.press(screen.getByLabelText("Español"));

    await screen.findByText("Choose your language");
    expect(mockPush).toHaveBeenCalledWith("/consent");
    expect(screen.queryByText("Please reload the app to finish changing the language.")).toBeNull();
  });
});
