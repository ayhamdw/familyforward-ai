import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { formatNumber } from "@/i18n/format";
import { colors, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";
import { BackButton } from "./BackButton";

type Props = {
  step: number;
  total?: number;
  onBack: () => void;
};

/** Back chevron, progress bar and "n of 6". The row direction flips in RTL, so the bar fills from the start edge. */
export function ProgressHeader({ step, total = 6, onBack }: Props) {
  const { t, i18n } = useTranslation();
  const percent = Math.max(0, Math.min(1, step / total)) * 100;
  return (
    <View style={styles.row}>
      <BackButton onPress={onBack} />
      <View
        accessibilityRole="progressbar"
        accessibilityValue={{ min: 0, max: total, now: step }}
        style={styles.track}
      >
        <View testID="progress-fill" style={[styles.fill, { width: `${percent}%` }]} />
      </View>
      <AppText variant="small" weight="semibold" color={colors.muted}>
        {t("survey.progress", { current: formatNumber(step, i18n.language), total: formatNumber(total, i18n.language) })}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
  },
  track: {
    flex: 1,
    height: 8,
    flexDirection: "row",
    borderRadius: 4,
    overflow: "hidden",
    backgroundColor: colors.borderSoft,
  },
  fill: {
    height: "100%",
    borderRadius: 4,
    backgroundColor: colors.primary,
  },
});
