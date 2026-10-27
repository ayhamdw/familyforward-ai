import { ActivityIndicator, Pressable, StyleSheet, type StyleProp, type ViewStyle } from "react-native";
import { colors, radius, sizes, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
};

type PrimaryProps = ButtonProps & { tone?: "primary" | "danger" };

export function PrimaryButton({ label, onPress, disabled, loading, tone = "primary", accessibilityLabel, style }: PrimaryProps) {
  const inactive = Boolean(disabled || loading);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: inactive, busy: Boolean(loading) }}
      disabled={inactive}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: tone === "danger" ? colors.danger : colors.primary },
        inactive && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.onPrimary} />
      ) : (
        <AppText variant="bodyLarge" weight="bold" color={colors.onPrimary}>
          {label}
        </AppText>
      )}
    </Pressable>
  );
}

export function SecondaryButton({ label, onPress, disabled, accessibilityLabel, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [styles.base, styles.secondary, disabled && styles.disabled, pressed && styles.pressed, style]}
    >
      <AppText variant="bodyLarge" weight="bold" color={colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

/** Teal bold text with no fill, for low-emphasis actions. */
export function TextButton({ label, onPress, disabled, accessibilityLabel, style }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [styles.text, disabled && styles.disabled, pressed && styles.pressed, style]}
    >
      <AppText variant="body" weight="bold" color={colors.primary}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: sizes.buttonHeight,
    borderRadius: radius.button,
    paddingHorizontal: spacing.xl,
    alignItems: "center",
    justifyContent: "center",
  },
  secondary: {
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  text: {
    minHeight: sizes.minTouchTarget,
    paddingHorizontal: spacing.md,
    alignItems: "center",
    justifyContent: "center",
  },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
