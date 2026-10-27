import { useRef, type ComponentRef } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/i18n/format";
import { colors, radius, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  error?: boolean;
  disabled?: boolean;
  label: string;
};

/** Six visible boxes over one hidden numeric input. The digits always read left to right. */
export function CodeInput({ value, onChange, length = 6, error, disabled, label }: Props) {
  const { i18n } = useTranslation();
  const inputRef = useRef<ComponentRef<typeof TextInput>>(null);
  const digits = value.split("");
  return (
    <Pressable accessibilityRole="none" onPress={() => inputRef.current?.focus()} style={styles.row}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => onChange(text.replace(/\D/g, "").slice(0, length))}
        keyboardType="number-pad"
        maxLength={length}
        editable={!disabled}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        accessibilityLabel={label}
        style={styles.hidden}
      />
      <View style={styles.boxes} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {Array.from({ length }, (_, index) => {
          const digit = digits[index];
          return (
            <View
              key={index}
              style={[
                styles.box,
                digit !== undefined && styles.filled,
                error && styles.error,
              ]}
            >
              <AppText variant="heading">{digit === undefined ? "" : formatNumber(digit, i18n.language)}</AppText>
            </View>
          );
        })}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { minHeight: 64 },
  hidden: { position: "absolute", opacity: 0, width: 1, height: 1 },
  // The code is entered left to right in every language, so the boxes do not mirror.
  boxes: { flexDirection: "row", direction: "ltr", gap: spacing.sm },
  box: {
    flex: 1,
    height: 60,
    borderRadius: radius.button,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: "center",
    justifyContent: "center",
  },
  filled: { borderColor: colors.primary },
  error: { borderColor: colors.danger },
});
