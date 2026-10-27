import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { chevronForwardName, isRTL } from "@/i18n/direction";
import { colors, radius, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = {
  /** Small label above the number, like "DAY". */
  dayLabel: string;
  dayNumber: string;
  /** Line under the title, like "Monday · 10 min · Counting". */
  meta: string;
  title: string;
  done?: boolean;
  showChevron?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

export function DayCard({ dayLabel, dayNumber, meta, title, done, showChevron = true, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? `${dayLabel} ${dayNumber}, ${title}, ${meta}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={[styles.badge, done && styles.badgeDone]}>
        <AppText variant="label" color={colors.onPrimary} style={styles.badgeLabel}>
          {dayLabel}
        </AppText>
        <AppText variant="heading" color={colors.onPrimary}>
          {dayNumber}
        </AppText>
      </View>
      <View style={styles.body}>
        <AppText variant="small" weight="medium" color={colors.muted}>
          {meta}
        </AppText>
        <AppText variant="bodyLarge" weight="bold">
          {title}
        </AppText>
      </View>
      {done ? <Ionicons name="checkmark-circle" size={24} color={colors.primary} /> : null}
      {showChevron ? <Ionicons name={chevronForwardName(isRTL())} size={22} color={colors.muted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  badge: {
    width: 56,
    height: 56,
    borderRadius: radius.button,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeDone: { backgroundColor: colors.muted },
  badgeLabel: { fontSize: 11, lineHeight: 14, letterSpacing: 0.6 },
  body: { flex: 1, gap: 2 },
  pressed: { opacity: 0.9 },
});
