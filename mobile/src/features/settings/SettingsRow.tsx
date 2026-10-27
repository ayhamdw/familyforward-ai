import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { AppText } from "@/components/AppText";
import { chevronForwardName, isRTL } from "@/i18n/direction";
import { colors, sizes, spacing } from "@/theme/tokens";

type Props = {
  label: string;
  value?: string;
  onPress?: () => void;
  chevron?: boolean;
  destructive?: boolean;
  disabled?: boolean;
  last?: boolean;
};

export function SettingsRow({ label, value, onPress, chevron, destructive, disabled, last }: Props) {
  const content = (
    <>
      <AppText variant="bodyLarge" weight="semibold" color={destructive ? colors.danger : colors.text} style={styles.label}>
        {label}
      </AppText>
      {value ? (
        <AppText variant="body" color={colors.muted} style={styles.value}>
          {value}
        </AppText>
      ) : null}
      {chevron ? <Ionicons name={chevronForwardName(isRTL())} size={20} color={colors.muted} /> : null}
    </>
  );
  const rowStyle = [styles.row, !last && styles.divider, disabled && styles.disabled];
  if (!onPress) {
    return <View style={rowStyle}>{content}</View>;
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      accessibilityState={{ disabled: Boolean(disabled) }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: sizes.minTouchTarget + 12,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
  label: { flexShrink: 1 },
  value: { flex: 1, textAlign: "auto" },
  disabled: { opacity: 0.5 },
  pressed: { opacity: 0.85 },
});
