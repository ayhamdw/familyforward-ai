import { Pressable, StyleSheet } from "react-native";
import { colors, radius, sizes, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

/** Pill for multi-choice answers. */
export function ChoiceChip({ label, selected, onPress, accessibilityLabel }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, checked: selected }}
      onPress={onPress}
      style={({ pressed }) => [styles.chip, selected && styles.selected, pressed && styles.pressed]}
    >
      <AppText variant="body" weight={selected ? "semibold" : "medium"}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Read-only summary pill (age, minutes, days). */
export function InfoChip({ label }: { label: string }) {
  return (
    <AppText variant="small" weight="semibold" color={colors.primary} style={styles.info}>
      {label}
    </AppText>
  );
}

const styles = StyleSheet.create({
  chip: {
    minHeight: sizes.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.chip + 4,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  info: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.chip,
    overflow: "hidden",
    backgroundColor: colors.primaryTint,
  },
  pressed: { opacity: 0.9 },
});
