export const colors = {
  primary: "#0F5257",
  primaryTint: "#E3F1EF",
  accent: "#F2B134",
  bg: "#F4F8F7",
  card: "#FFFFFF",
  border: "#C9DAD8",
  borderSoft: "#D5E3E1",
  text: "#12292B",
  muted: "#3F5A5C",
  noticeBg: "#FDF3DC",
  noticeText: "#5A4210",
  danger: "#A3261C",
  dangerBg: "#FCE9E6",
  onPrimary: "#FFFFFF",
  scrim: "rgba(18, 41, 43, 0.5)",
} as const;

export const radius = {
  button: 14,
  card: 16,
  cardLarge: 18,
  chip: 20,
  sheet: 24,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const sizes = {
  minTouchTarget: 44,
  buttonHeight: 54,
  screenPadding: 20,
} as const;

export const fontSizes = {
  small: 14,
  label: 13,
  body: 17,
  bodyLarge: 18,
  heading: 20,
  title: 30,
  titleLarge: 32,
} as const;

export type FontWeight = "regular" | "medium" | "semibold" | "bold";
export type FontFamilyKind = "latin" | "arabic";

export const fontFamilies: Record<FontFamilyKind, Record<FontWeight, string>> = {
  latin: {
    regular: "Figtree_400Regular",
    medium: "Figtree_500Medium",
    semibold: "Figtree_600SemiBold",
    bold: "Figtree_700Bold",
  },
  arabic: {
    regular: "NotoSansArabic_400Regular",
    medium: "NotoSansArabic_500Medium",
    semibold: "NotoSansArabic_600SemiBold",
    bold: "NotoSansArabic_700Bold",
  },
};
