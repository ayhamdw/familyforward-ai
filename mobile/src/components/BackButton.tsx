import { Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { chevronBackName, isRTL } from "@/i18n/direction";
import { colors, sizes } from "@/theme/tokens";

type Props = { onPress: () => void };

/** Back chevron. It points toward the start edge, so it flips in RTL. */
export function BackButton({ onPress }: Props) {
  const { t } = useTranslation();
  const rtl = isRTL();
  return (
    <Pressable
      testID={rtl ? "back-button-rtl" : "back-button-ltr"}
      accessibilityRole="button"
      accessibilityLabel={t("common.back")}
      onPress={onPress}
      hitSlop={8}
      style={styles.button}
    >
      <Ionicons name={chevronBackName(rtl)} size={26} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: sizes.minTouchTarget,
    height: sizes.minTouchTarget,
    alignItems: "center",
    justifyContent: "center",
    marginStart: -10,
  },
});
