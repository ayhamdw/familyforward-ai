import { useState } from "react";
import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { colors, fontFamilies, radius, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = Omit<TextInputProps, "style"> & {
  label: string;
  helper?: string;
  error?: string;
  /** Right-aligned text under the field, like "0 / 140". */
  counter?: string;
  multiline?: boolean;
};

export function TextField({ label, helper, error, counter, multiline, onFocus, onBlur, ...rest }: Props) {
  const { i18n } = useTranslation();
  const [focused, setFocused] = useState(false);
  const arabic = i18n.language === "ar";
  const borderColor = error ? colors.danger : focused ? colors.primary : colors.border;
  return (
    <View style={styles.wrap}>
      <AppText variant="small" weight="bold">
        {label}
      </AppText>
      <TextInput
        {...rest}
        multiline={multiline}
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          { borderColor, fontFamily: fontFamilies[arabic ? "arabic" : "latin"].regular },
        ]}
        textAlignVertical={multiline ? "top" : "center"}
      />
      {error ? (
        <View style={styles.errorRow} accessibilityRole="alert">
          <Ionicons name="alert-circle" size={18} color={colors.danger} />
          <AppText variant="small" color={colors.danger} style={styles.flex}>
            {error}
          </AppText>
        </View>
      ) : (
        <View style={styles.helperRow}>
          {helper ? (
            <AppText variant="small" color={colors.muted} style={styles.flex}>
              {helper}
            </AppText>
          ) : (
            <View style={styles.flex} />
          )}
          {counter ? (
            <AppText variant="small" weight="semibold" color={colors.muted}>
              {counter}
            </AppText>
          ) : null}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm },
  input: {
    minHeight: 54,
    paddingHorizontal: spacing.lg,
    borderWidth: 2,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    color: colors.text,
    fontSize: 17,
  },
  multiline: {
    minHeight: 120,
    paddingTop: spacing.md,
  },
  flex: { flex: 1 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  helperRow: { flexDirection: "row", alignItems: "center", gap: spacing.md },
});
