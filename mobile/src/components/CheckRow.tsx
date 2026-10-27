import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors, radius, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = {
  label: string;
  checked: boolean;
  onPress: () => void;
};

/** Full-width checkbox row for multi-choice answers. */
export function CheckRow({ label, checked, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ selected: checked, checked }}
      onPress={onPress}
      style={({ pressed }) => [styles.row, checked && styles.checked, pressed && styles.pressed]}
    >
      <View style={[styles.box, checked && styles.boxChecked]}>
        {checked ? <Ionicons name="checkmark" size={16} color={colors.onPrimary} /> : null}
      </View>
      <AppText variant="bodyLarge" weight="medium" style={styles.label}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  checked: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryTint,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: "center",
    justifyContent: "center",
  },
  boxChecked: {
    borderColor: colors.primary,
    backgroundColor: colors.primary,
  },
  label: { flex: 1 },
  pressed: { opacity: 0.9 },
});
