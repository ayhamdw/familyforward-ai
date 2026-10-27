import { colors } from "../tokens";

function channel(value: number): number {
  const scaled = value / 255;
  return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
}

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((index) => channel(parseInt(hex.slice(index, index + 2), 16)));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  return (light + 0.05) / (dark + 0.05);
}

describe("color contrast (WCAG AA, 4.5:1 for text)", () => {
  it.each([
    ["text on bg", colors.text, colors.bg],
    ["text on card", colors.text, colors.card],
    ["text on primaryTint", colors.text, colors.primaryTint],
    ["muted on bg", colors.muted, colors.bg],
    ["muted on card", colors.muted, colors.card],
    ["muted on primaryTint", colors.muted, colors.primaryTint],
    ["primary on bg (links)", colors.primary, colors.bg],
    ["primary on card", colors.primary, colors.card],
    ["primary on primaryTint", colors.primary, colors.primaryTint],
    ["onPrimary on primary (buttons)", colors.onPrimary, colors.primary],
    ["onPrimary on danger (delete button)", colors.onPrimary, colors.danger],
    ["noticeText on noticeBg", colors.noticeText, colors.noticeBg],
    ["danger on dangerBg", colors.danger, colors.dangerBg],
    ["danger on card", colors.danger, colors.card],
    ["danger on bg", colors.danger, colors.bg],
    ["text on accent", colors.text, colors.accent],
  ])("%s", (_name, foreground, background) => {
    expect(contrast(foreground, background)).toBeGreaterThanOrEqual(4.5);
  });
});
