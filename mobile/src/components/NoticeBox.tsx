import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";
import { SectionLabel } from "./SectionLabel";

export type NoticeVariant = "info" | "warn" | "error" | "neutral";
type IconName = keyof typeof Ionicons.glyphMap;

type Props = {
  variant: NoticeVariant;
  /** Small uppercase heading above the text. */
  heading?: string;
  /** Bold lead-in sentence. */
  lead?: string;
  children?: ReactNode;
  /** Override the default icon, or pass null for none. */
  icon?: IconName | null;
};

const PALETTE: Record<NoticeVariant, { bg: string; fg: string; border: string; icon: IconName }> = {
  info: { bg: colors.primaryTint, fg: colors.text, border: colors.primaryTint, icon: "information-circle" },
  warn: { bg: colors.noticeBg, fg: colors.noticeText, border: colors.noticeBg, icon: "information-circle" },
  error: { bg: colors.dangerBg, fg: colors.danger, border: colors.dangerBg, icon: "alert-circle" },
  neutral: { bg: colors.card, fg: colors.muted, border: colors.border, icon: "cloud-offline-outline" },
};

export function NoticeBox({ variant, heading, lead, children, icon }: Props) {
  const palette = PALETTE[variant];
  const iconName = icon === undefined ? palette.icon : icon;
  return (
    <View
      accessibilityRole={variant === "error" ? "alert" : undefined}
      style={[styles.box, { backgroundColor: palette.bg, borderColor: palette.border }]}
    >
      {iconName ? <Ionicons name={iconName} size={22} color={palette.fg} style={styles.icon} /> : null}
      <View style={styles.text}>
        {heading ? <SectionLabel color={palette.fg}>{heading}</SectionLabel> : null}
        <AppText variant="body" color={palette.fg}>
          {lead ? (
            <AppText variant="body" weight="bold" color={palette.fg}>
              {lead}
              {" "}
            </AppText>
          ) : null}
          {children}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
  },
  icon: { marginTop: 1 },
  text: { flex: 1, gap: spacing.xs },
});
