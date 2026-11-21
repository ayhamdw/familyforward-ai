import fs from "node:fs";
import path from "node:path";
import { StyleSheet } from "react-native";
import { act, render, screen } from "@testing-library/react-native";
import { findResource } from "@familyforward/shared";
import { setupTestI18n } from "@/test/i18nTestSetup";
import { sizes } from "@/theme/tokens";
import { ChoiceChip } from "../ChoiceChip";
import { DayCard } from "../DayCard";
import { OfflineBanner } from "../OfflineBanner";
import { OptionCard } from "../OptionCard";
import { ResourceRow } from "../ResourceList";
import { PrimaryButton, SecondaryButton, TextButton } from "../buttons";
import { useNetStore } from "@/storage/netStore";

const noop = () => undefined;

function minHeightOf(style: unknown): number {
  const flat = StyleSheet.flatten((typeof style === "function" ? (style as (s: { pressed: boolean }) => unknown)({ pressed: false }) : style) as never) as { minHeight?: number } | undefined;
  return flat?.minHeight ?? 0;
}

describe("touch targets and labels", () => {
  beforeEach(async () => {
    await setupTestI18n("en");
  });

  it("makes the minimum touch target 48dp", () => {
    expect(sizes.minTouchTarget).toBeGreaterThanOrEqual(48);
    expect(sizes.buttonHeight).toBeGreaterThanOrEqual(48);
  });

  it("gives every button, chip, card and link an accessibility label and a 48dp height", async () => {
    await render(
      <>
        <PrimaryButton label="Primary" onPress={noop} />
        <SecondaryButton label="Secondary" onPress={noop} />
        <TextButton label="Text" onPress={noop} />
        <ChoiceChip label="Chip" selected={false} onPress={noop} />
        <OptionCard label="Option" selected={false} onPress={noop} />
        <OptionCard label="Reaction" variant="segment" selected={false} onPress={noop} />
        <DayCard dayLabel="Day" dayNumber="1" meta="Mon" title="Title" onPress={noop} />
        <ResourceRow resource={findResource("cps-child-find")!} language="en" />
      </>,
    );
    const controls = (["button", "link", "radio", "checkbox"] as const).flatMap((role) => screen.queryAllByRole(role));
    expect(controls.length).toBeGreaterThanOrEqual(9);
    for (const control of controls) {
      expect(String(control.props.accessibilityLabel ?? "").length).toBeGreaterThan(0);
      expect({ label: control.props.accessibilityLabel, ok: minHeightOf(control.props.style) >= 48 }).toEqual({ label: control.props.accessibilityLabel, ok: true });
    }
  });

  it("keeps the reaction answers large", async () => {
    await render(<OptionCard label="It was fine" variant="segment" selected onPress={noop} />);
    expect(minHeightOf(screen.getByRole("radio").props.style)).toBeGreaterThanOrEqual(48);
  });
});

describe("text scales with the system font size", () => {
  it("never turns off font scaling anywhere in the app code", () => {
    const root = path.join(__dirname, "..", "..");
    const offenders: string[] = [];
    const walk = (dir: string) => {
      for (const name of fs.readdirSync(dir)) {
        const full = path.join(dir, name);
        if (fs.statSync(full).isDirectory()) {
          if (name !== "__tests__") walk(full);
        } else if (/\.(ts|tsx)$/.test(name) && /allowFontScaling=\{?false|maxFontSizeMultiplier=\{?1\b/.test(fs.readFileSync(full, "utf8"))) {
          offenders.push(full);
        }
      }
    };
    walk(root);
    expect(offenders).toEqual([]);
  });
});

describe("offline banner", () => {
  afterEach(async () => {
    await act(async () => useNetStore.getState().setOnline(true));
  });

  it.each([
    ["en", "You're offline."],
    ["es", "No tiene conexión."],
    ["ar", "أنت غير متصل بالإنترنت."],
  ] as const)("appears when the connection is lost, in %s", async (language, text) => {
    await setupTestI18n(language);
    useNetStore.getState().setOnline(false);
    await render(<OfflineBanner />);
    expect(screen.getByText(new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")))).toBeTruthy();
  });

  it("is hidden while online", async () => {
    await setupTestI18n("en");
    useNetStore.getState().setOnline(true);
    await render(<OfflineBanner />);
    expect(screen.queryByText(/offline/i)).toBeNull();
  });
});
