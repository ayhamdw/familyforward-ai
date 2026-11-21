import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { currentLanguage } from "@/i18n/language";
import { PlanContent } from "@/features/plan/PlanContent";
import { formatWeekRange } from "@/features/plan/formatWeek";
import { findPlan, usePlanStore } from "@/storage/planStore";

/** A saved plan from an earlier week. It can be read but not changed. */
export function PastWeekScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const plan = usePlanStore((s) => (id ? findPlan(s.byChild, id) : null));
  const language = currentLanguage(i18n.language);

  if (!plan) {
    return (
      <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
        <AppText variant="bodyLarge">{t("pastWeeks.notFound")}</AppText>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
      <AppText variant="title" accessibilityRole="header">
        {formatWeekRange(plan.weekStart, language)}
      </AppText>
      <NoticeBox variant="neutral" icon="lock-closed-outline">
        {t("pastWeeks.readOnly")}
      </NoticeBox>
      <PlanContent plan={plan} readOnly />
    </ScreenContainer>
  );
}
