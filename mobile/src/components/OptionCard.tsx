import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, sizes, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** "row" is a full-width card with a radio on the end; "tile" is a compact grid card with a check badge. */
  variant?: "row" | "tile";
  /** Small text on the end of a row, like a language code. */
  trailingText?: string;
  /** Hide the radio so the card reads as a plain action (used by the language list). */
  hideIndicator?: boolean;
  disabled?: boolean;
  accessibilityLabel?: string;
};

export function OptionCard({
  label,
  selected,
  onPress,
  variant = "row",
  trailingText,
  hideIndicator,
  disabled,
  accessibilityLabel,
}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, checked: selected, disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        variant === "tile" && styles.tile,
        selected && styles.selected,
        pressed && styles.pressed,
      ]}
    >
      <AppText variant="bodyLarge" weight="semibold" style={styles.label}>
        {label}
      </AppText>
      {trailingText ? (
        <AppText variant="small" weight="bold" color={colors.muted}>
          {trailingText}
        </AppText>
      ) : null}
      {hideIndicator || variant === "tile" ? null : (
        <View style={[styles.radio, selected && styles.radioSelected]}>
          {selected ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
        </View>
      )}
      {variant === "tile" && selected ? (
        <View style={styles.badge}>
          <Ionicons name="checkmark" size={14} color={colors.onPrimary} />
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 64,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
    borderRadius: radius.cardLarge,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  tile: {
    minHeight: 92,
    flex: 1,
    alignItems: "flex-start",
    paddingEnd: spacing.xxl,
  },
  selected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  label: { flex: 1 },
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
    minWidth: sizes.minTouchTarget / 2,
  },
  radioSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  badge: {
    position: "absolute",
    end: spacing.sm,
    bottom: spacing.sm,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.9 },
});
