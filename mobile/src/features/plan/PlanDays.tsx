import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FOCUS_AREA_SHORT_LABELS } from "@familyforward/shared";
import { DayCard } from "@/components/DayCard";
import { formatNumber } from "@/i18n/format";
import { currentLanguage } from "@/i18n/language";
import { spacing } from "@/theme/tokens";
import { activityById, activityText } from "./content";
import type { Plan } from "./types";

const META_SEPARATOR = " · ";

type Props = {
  plan: Plan;
  /** Opens activities without the "We did it" buttons (used for past weeks). */
  readOnly?: boolean;
};

/** One card per planned day. Ready-made (fallback) plans have no weekday names. */
export function PlanDays({ plan, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const language = currentLanguage(i18n.language);
  const fallback = plan.source === "fallback";

  return (
    <View style={styles.list}>
      {plan.items.map((item) => {
        const activity = activityById(item.activityId);
        if (!activity) {
          return null;
        }
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
            title={activityText(activity, language).title}
            done={item.done}
            onPress={() =>
              router.push({
                pathname: "/activity/[id]",
                params: readOnly ? { id: item.activityId, readonly: "1" } : { id: item.activityId },
              })
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
});
