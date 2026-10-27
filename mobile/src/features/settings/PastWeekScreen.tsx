import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { InfoChip } from "@/components/ChoiceChip";
import { BackButton } from "@/components/BackButton";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { formatAgeBand } from "@/i18n/format";
import { currentLanguage } from "@/i18n/language";
import { usePlanStore } from "@/storage/planStore";
import { spacing } from "@/theme/tokens";
import { PlanDays } from "../plan/PlanDays";
import { formatWeekRange } from "../plan/formatWeek";

/** A saved plan from an earlier week. It can be read but not changed. */
export function PastWeekScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const week = usePlanStore((s) => s.pastWeeks.find((item) => item.id === id));
  const language = currentLanguage(i18n.language);

  if (!week) {
    return (
      <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
        <AppText variant="bodyLarge">{t("pastWeeks.notFound")}</AppText>
      </ScreenContainer>
    );
  }

  const { plan } = week;
  return (
    <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
      <AppText variant="title" accessibilityRole="header">
        {formatWeekRange(week.weekStart, language)}
      </AppText>
      <NoticeBox variant="neutral" icon="lock-closed-outline">
        {t("pastWeeks.readOnly")}
      </NoticeBox>
      {plan.source === "custom" ? (
        <View style={styles.chips}>
          <InfoChip label={t("plan.ages", { range: formatAgeBand(plan.ageBand, language) })} />
          <InfoChip label={t("plan.minutesPerDay", { time: t(`survey.time.min${plan.minutes}`) })} />
          <InfoChip label={t(`survey.time.days${plan.days}`)} />
        </View>
      ) : null}
      <PlanDays plan={plan} readOnly />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
