import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FOCUS_AREA_SHORT_LABELS } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { InfoChip } from "@/components/ChoiceChip";
import { DayCard } from "@/components/DayCard";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import { formatAgeBand, formatNumber } from "@/i18n/format";
import { useDevStore } from "@/storage/devStore";
import { usePlanStore } from "@/storage/planStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { currentLanguage } from "@/i18n/language";
import { activityById, activityText } from "./content";

const META_SEPARATOR = " · ";

export function PlanScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const plan = usePlanStore((s) => s.current);
  const offline = useDevStore((s) => s.forceOffline);
  const language = currentLanguage(i18n.language);

  if (plan === null) {
    return (
      <ScreenContainer hasTabBar centered>
        <AppText variant="title" accessibilityRole="header">
          {t("plan.title")}
        </AppText>
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("plan.empty")}
        </AppText>
        <PrimaryButton label={t("plan.makePlan")} disabled={offline} onPress={() => router.push("/survey/age")} />
      </ScreenContainer>
    );
  }

  const fallback = plan.source === "fallback";
  return (
    <ScreenContainer hasTabBar>
      <AppText variant="title" accessibilityRole="header">
        {t("plan.title")}
      </AppText>

      {offline ? (
        <NoticeBox variant="neutral" lead={t("plan.offlineLead")}>
          {t("plan.offlineBody")}
        </NoticeBox>
      ) : null}
      {fallback ? (
        <NoticeBox variant="warn" lead={t("plan.fallbackLead")}>
          {t("plan.fallbackBody")}
        </NoticeBox>
      ) : (
        <View style={styles.chips}>
          <InfoChip label={t("plan.ages", { range: formatAgeBand(plan.ageBand, language) })} />
          <InfoChip
            label={t("plan.minutesPerDay", { time: t(`survey.time.min${plan.minutes}`) })}
          />
          <InfoChip label={t(`survey.time.days${plan.days}`)} />
        </View>
      )}

      <View style={styles.list}>
        {plan.items.map((item) => {
          const activity = activityById(item.activityId);
          if (!activity) {
            return null;
          }
          const text = activityText(activity, language);
          const meta = [
            fallback ? null : t(`weekdays.${item.weekday}`),
            t(`survey.time.min${activity.minutes}`),
            FOCUS_AREA_SHORT_LABELS[activity.focus][language],
          ]
            .filter((part): part is string => part !== null)
            .join(META_SEPARATOR);
          return (
            <DayCard
              key={item.activityId}
              dayLabel={t("plan.dayLabel")}
              dayNumber={formatNumber(item.day, language)}
              meta={meta}
              title={text.title}
              done={item.done}
              showChevron={!fallback}
              onPress={() => router.push({ pathname: "/activity/[id]", params: { id: item.activityId } })}
            />
          );
        })}
      </View>

      {fallback ? (
        <SecondaryButton label={t("plan.retry")} disabled={offline} onPress={() => router.push("/generating")} />
      ) : null}
      {offline ? (
        <View style={styles.offlineNote}>
          <AppText variant="body" color={colors.muted}>
            {t("plan.offlineNote")}
          </AppText>
        </View>
      ) : null}

      <NoticeBox variant="warn" icon={null}>
        {t("plan.disclaimer")}
      </NoticeBox>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  list: { gap: spacing.md },
  offlineNote: {
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
});
