import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { InfoChip } from "@/components/ChoiceChip";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionLabel } from "@/components/SectionLabel";
import { PrimaryButton, TextButton } from "@/components/buttons";
import { formatAgeBand, formatNumber } from "@/i18n/format";
import { usePlanStore } from "@/storage/planStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { activityById, activityText, currentLanguage } from "./content";

export function ActivityScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const markDone = usePlanStore((s) => s.markDone);
  const language = currentLanguage(i18n.language);
  const activity = activityById(id);

  if (!activity || !id) {
    return (
      <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
        <AppText variant="bodyLarge">{t("activity.notFound")}</AppText>
      </ScreenContainer>
    );
  }

  const text = activityText(activity, language);
  const finish = () => {
    markDone(id);
    router.replace({ pathname: "/done", params: { id } });
  };

  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={
        <>
          <PrimaryButton label={t("activity.done")} onPress={finish} />
          <TextButton label={t("activity.notToday")} onPress={() => router.back()} />
        </>
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {text.title}
      </AppText>
      <View style={styles.chips}>
        <InfoChip label={t(`survey.time.min${activity.minutes}`)} />
        <InfoChip label={t("plan.ages", { range: formatAgeBand(activity.ageBand, language) })} />
        <InfoChip label={t(`survey.focus.${activity.focus}`)} />
      </View>

      <View style={styles.card}>
        <SectionLabel>{t("activity.needLabel")}</SectionLabel>
        <AppText variant="bodyLarge">{text.materials}</AppText>
      </View>

      <View style={styles.steps}>
        <SectionLabel>{t("activity.stepsLabel")}</SectionLabel>
        {text.steps.map((step, index) => (
          <View key={step} style={styles.step}>
            <View style={styles.number}>
              <AppText variant="small" weight="bold" color={colors.onPrimary}>
                {formatNumber(index + 1, language)}
              </AppText>
            </View>
            <AppText variant="bodyLarge" style={styles.stepText}>
              {step}
            </AppText>
          </View>
        ))}
      </View>

      <NoticeBox variant="info" icon={null} heading={t("activity.whyLabel")}>
        {text.why}
      </NoticeBox>
      <NoticeBox variant="warn" icon={null} heading={t("activity.safetyLabel")}>
        {text.safety}
      </NoticeBox>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  steps: { gap: spacing.md },
  step: { flexDirection: "row", alignItems: "flex-start", gap: spacing.md },
  number: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primary,
  },
  stepText: { flex: 1 },
});
