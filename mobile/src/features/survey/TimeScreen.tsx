import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { DAYS_OPTIONS, MINUTES_OPTIONS } from "@familyforward/shared";
import { OptionCard } from "@/components/OptionCard";
import { SectionLabel } from "@/components/SectionLabel";
import { useSurveyStore } from "@/storage/surveyStore";
import { spacing } from "@/theme/tokens";
import { SurveyStep } from "./SurveyStep";

export function TimeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const minutes = useSurveyStore((s) => s.minutes);
  const days = useSurveyStore((s) => s.days);
  const setMinutes = useSurveyStore((s) => s.setMinutes);
  const setDays = useSurveyStore((s) => s.setDays);
  return (
    <SurveyStep
      step={3}
      title={t("survey.time.title")}
      helper={t("survey.time.helper")}
      continueLabel={t("survey.continue")}
      onContinue={() => router.push("/survey/interests")}
    >
      <View style={styles.group}>
        <SectionLabel>{t("survey.time.timeLabel")}</SectionLabel>
        <View style={styles.row}>
          {MINUTES_OPTIONS.map((option) => (
            <OptionCard
              key={option}
              variant="segment"
              label={t(`survey.time.min${option}`)}
              selected={minutes === option}
              onPress={() => setMinutes(option)}
            />
          ))}
        </View>
      </View>
      <View style={styles.group}>
        <SectionLabel>{t("survey.time.daysLabel")}</SectionLabel>
        <View style={styles.row}>
          {DAYS_OPTIONS.map((option) => (
            <OptionCard
              key={option}
              variant="segment"
              label={t(`survey.time.days${option}`)}
              selected={days === option}
              onPress={() => setDays(option)}
            />
          ))}
        </View>
      </View>
    </SurveyStep>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  row: { flexDirection: "row", gap: spacing.sm },
});
