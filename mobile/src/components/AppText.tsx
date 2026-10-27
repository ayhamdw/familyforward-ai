import { StyleSheet, Text, type TextProps } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, fontFamilies, fontSizes, type FontWeight } from "@/theme/tokens";

type Variant = "title" | "heading" | "bodyLarge" | "body" | "small" | "label";

type Props = TextProps & {
  variant?: Variant;
  weight?: FontWeight;
  color?: string;
};

const SIZES: Record<Variant, number> = {
  title: fontSizes.title,
  heading: fontSizes.heading,
  bodyLarge: fontSizes.bodyLarge,
  body: fontSizes.body,
  small: fontSizes.small,
  label: fontSizes.label,
};

const DEFAULT_WEIGHTS: Record<Variant, FontWeight> = {
  title: "bold",
  heading: "bold",
  bodyLarge: "regular",
  body: "regular",
  small: "regular",
  label: "bold",
};

export function AppText({ variant = "body", weight, color = colors.text, style, ...rest }: Props) {
  const { i18n } = useTranslation();
  const arabic = i18n.language === "ar";
  const size = SIZES[variant];
  const resolved: object[] = [
    {
      color,
      fontSize: size,
      lineHeight: Math.round(size * (arabic ? 1.65 : 1.4)),
      fontFamily: fontFamilies[arabic ? "arabic" : "latin"][weight ?? DEFAULT_WEIGHTS[variant]],
    },
    styles.base,
  ];
  return <Text {...rest} style={[resolved, style]} />;
}

const styles = StyleSheet.create({
  base: {
    textAlign: "auto",
  },
});
