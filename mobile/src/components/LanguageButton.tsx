import { Pressable, StyleSheet, Text } from "react-native";
import { colors, spacing } from "@/theme";

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

export function LanguageButton({ label, selected, onPress }: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.button, selected && styles.selected]}
    >
      <Text style={[styles.label, selected && styles.selectedLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  selected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  label: {
    fontSize: 16,
    color: colors.text,
  },
  selectedLabel: {
    color: colors.onPrimary,
  },
});
