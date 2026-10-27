import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius } from "@/theme/tokens";

type IconName = keyof typeof Ionicons.glyphMap;
type Tone = "dark" | "cream" | "amber";

type Props = { icon: IconName; tone?: Tone; size?: number };

const TONES: Record<Tone, { bg: string; fg: string }> = {
  dark: { bg: colors.primary, fg: colors.accent },
  cream: { bg: colors.noticeBg, fg: colors.noticeText },
  amber: { bg: colors.accent, fg: colors.text },
};

/** Decorative rounded tile with an icon. Hidden from screen readers. */
export function IconTile({ icon, tone = "dark", size = 72 }: Props) {
  const palette = TONES[tone];
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.tile, { width: size, height: size, backgroundColor: palette.bg, borderRadius: tone === "amber" ? size / 2 : radius.cardLarge + 6 }]}
    >
      <Ionicons name={icon} size={size * 0.5} color={palette.fg} />
    </View>
  );
}

const styles = StyleSheet.create({
  tile: { alignItems: "center", justifyContent: "center" },
});
