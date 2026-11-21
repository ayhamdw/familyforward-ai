import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FOCUS_AREA_SHORT_LABELS, type PlanDto } from "@familyforward/shared";
import { DayCard } from "@/components/DayCard";
import { formatNumber } from "@/i18n/format";
import { currentLanguage } from "@/i18n/language";
import { spacing } from "@/theme/tokens";

const META_SEPARATOR = " · ";
const WEEKDAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

type Props = {
  plan: PlanDto;
  /** Opens activities without the "We did it" buttons (used for past weeks). */
  readOnly?: boolean;
};

/** One card per planned day. The activity text comes from the plan itself, so it works offline. */
export function PlanDays({ plan, readOnly }: Props) {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const language = currentLanguage(i18n.language);

  return (
    <View style={styles.list}>
      {plan.days.map((day, index) => {
        const weekday = WEEKDAYS[Math.min(Math.max(day.day, 1), 5) - 1];
        const meta = [t(`weekdays.${weekday}`), t(`survey.time.min${day.activity.minutes}`), FOCUS_AREA_SHORT_LABELS[day.activity.focus][language]].join(META_SEPARATOR);
        return (
          <DayCard
            key={`${day.day}-${day.activity.id}`}
            dayLabel={t("plan.dayLabel")}
            dayNumber={formatNumber(index + 1, language)}
            meta={meta}
            title={day.activity.title}
            done={day.done}
            onPress={() =>
              router.push({
                pathname: "/activity/[id]",
                params: readOnly ? { id: String(index), planId: plan.id, readonly: "1" } : { id: String(index), planId: plan.id },
              })
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.md } });
