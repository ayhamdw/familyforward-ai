import { useTranslation } from "react-i18next";
import { colors } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = { children: string; color?: string };

/** Small uppercase label. Arabic has no uppercase, so the transform only applies to Latin scripts. */
export function SectionLabel({ children, color = colors.muted }: Props) {
  const { i18n } = useTranslation();
  const arabic = i18n.language === "ar";
  return (
    <AppText
      variant="label"
      color={color}
      accessibilityRole="header"
      style={{ textTransform: arabic ? "none" : "uppercase", letterSpacing: arabic ? 0 : 0.8 }}
    >
      {children}
    </AppText>
  );
}
