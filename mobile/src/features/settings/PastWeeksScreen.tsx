import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FOCUS_AREA_SHORT_LABELS } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { chevronForwardName, isRTL } from "@/i18n/direction";
import { formatNumber } from "@/i18n/format";
import { usePlanStore } from "@/storage/planStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { currentLanguage } from "@/i18n/language";
import { formatWeekRange } from "../plan/formatWeek";
import type { PastWeek } from "../plan/types";

export function PastWeeksScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const weeks = usePlanStore((s) => s.pastWeeks);
  const language = currentLanguage(i18n.language);

  const summary = (week: PastWeek): string => {
    const count = t("pastWeeks.activities", { count: week.activityCount, n: formatNumber(week.activityCount, language) });
    const [first, second] = week.focus.map((area) => FOCUS_AREA_SHORT_LABELS[area][language]);
    const focus = second ? t("pastWeeks.and", { first, second }) : first;
    return focus ? `${count} · ${focus}` : count;
  };

  return (
    <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
      <AppText variant="title" accessibilityRole="header">
        {t("pastWeeks.title")}
      </AppText>
      {weeks.length === 0 ? (
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("pastWeeks.empty")}
        </AppText>
      ) : (
        <View style={styles.list}>
          {weeks.map((week) => (
            <Pressable
              key={week.id}
              accessibilityRole="button"
              accessibilityLabel={`${formatWeekRange(week.weekStart, language)}, ${summary(week)}`}
              onPress={() => router.push({ pathname: "/past-week/[id]", params: { id: week.id } })}
              style={({ pressed }) => [styles.row, pressed && styles.pressed]}
            >
              <View style={styles.text}>
                <AppText variant="bodyLarge" weight="bold">
                  {formatWeekRange(week.weekStart, language)}
                </AppText>
                <AppText variant="small" color={colors.muted}>
                  {summary(week)}
                </AppText>
              </View>
              <Ionicons name={chevronForwardName(isRTL())} size={20} color={colors.muted} />
            </Pressable>
          ))}
        </View>
      )}
      <View style={styles.note}>
        <AppText variant="body" color={colors.muted}>
          {t("pastWeeks.note")}
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  text: { flex: 1, gap: 2 },
  pressed: { opacity: 0.9 },
  note: {
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderStyle: "dashed",
    borderColor: colors.border,
  },
});
