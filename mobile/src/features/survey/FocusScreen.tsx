import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FOCUS_AREAS, FOCUS_AREA_LABELS, MAX_FOCUS_AREAS } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { OptionCard } from "@/components/OptionCard";
import { formatNumber } from "@/i18n/format";
import { currentLanguage } from "@/i18n/language";
import { useSurveyStore } from "@/storage/surveyStore";
import { colors, spacing } from "@/theme/tokens";
import { SurveyStep } from "./SurveyStep";

export function FocusScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const focus = useSurveyStore((s) => s.focus);
  const toggleFocus = useSurveyStore((s) => s.toggleFocus);
  const language = currentLanguage(i18n.language);
  const full = focus.length >= MAX_FOCUS_AREAS;
  return (
    <SurveyStep
      step={2}
      title={t("survey.focus.title")}
      continueLabel={t("survey.continue")}
      continueDisabled={focus.length === 0}
      onContinue={() => router.push("/survey/time")}
    >
      <View style={styles.counterRow}>
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("survey.focus.helper")}
        </AppText>
        <AppText variant="bodyLarge" weight="bold" color={colors.primary} accessibilityLiveRegion="polite">
          {t("survey.focus.counter", { n: formatNumber(focus.length, i18n.language) })}
        </AppText>
      </View>
      <View style={styles.grid}>
        {FOCUS_AREAS.map((area) => {
          const selected = focus.includes(area);
          return (
            <View key={area} style={styles.cell}>
              <OptionCard
                variant="tile"
                label={FOCUS_AREA_LABELS[area][language]}
                selected={selected}
                disabled={full && !selected}
                onPress={() => toggleFocus(area)}
              />
            </View>
          );
        })}
      </View>
    </SurveyStep>
  );
}

const styles = StyleSheet.create({
  counterRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.md },
  cell: { width: "47.5%", flexGrow: 1 },
});
