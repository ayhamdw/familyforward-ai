import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { FOCUS_AREA_LABELS, MATERIAL_LABELS } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { InfoChip } from "@/components/ChoiceChip";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionLabel } from "@/components/SectionLabel";
import { PrimaryButton, TextButton } from "@/components/buttons";
import { formatNumber } from "@/i18n/format";
import { currentLanguage } from "@/i18n/language";
import { recordActivity } from "@/services/actions";
import { findPlan, usePlanStore } from "@/storage/planStore";
import { colors, radius, spacing } from "@/theme/tokens";

export function ActivityScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id, planId, readonly } = useLocalSearchParams<{ id?: string; planId?: string; readonly?: string }>();
  const readOnly = readonly === "1";
  const plan = usePlanStore((s) => (planId ? findPlan(s.byChild, planId) : null));
  const language = currentLanguage(i18n.language);
  const index = Number(id);
  const day = plan && Number.isInteger(index) ? plan.days[index] : undefined;

  if (!plan || !day || !planId) {
    return (
      <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
        <AppText variant="bodyLarge">{t("activity.notFound")}</AppText>
      </ScreenContainer>
    );
  }

  const a = day.activity;
  const finish = () => {
    // Saved on the phone at once; it is sent now or queued if there is no connection.
    void recordActivity(planId, index, { done: true, reaction: day.reaction });
    router.replace({ pathname: "/done", params: { planId, index: String(index) } });
  };
  const materials = a.materials.map((m) => MATERIAL_LABELS[m][language]).join(", ");

  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={
        readOnly ? undefined : (
          <>
            <PrimaryButton label={t("activity.done")} onPress={finish} />
            <TextButton label={t("activity.notToday")} onPress={() => router.back()} />
          </>
        )
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {a.title}
      </AppText>
      <View style={styles.chips}>
        <InfoChip label={t(`survey.time.min${a.minutes}`)} />
        <InfoChip label={FOCUS_AREA_LABELS[a.focus][language]} />
      </View>

      <View style={styles.card}>
        <SectionLabel>{t("activity.needLabel")}</SectionLabel>
        <AppText variant="bodyLarge">{materials || t("activity.noMaterials")}</AppText>
      </View>

      <View style={styles.steps}>
        <SectionLabel>{t("activity.stepsLabel")}</SectionLabel>
        {a.steps.map((step, i) => (
          <View key={`${i}-${step}`} style={styles.step} accessible accessibilityLabel={`${t("activity.stepLabelPrefix")} ${formatNumber(i + 1, language)}. ${step}`}>
            <View style={styles.number}>
              <AppText variant="small" weight="bold" color={colors.onPrimary}>
                {formatNumber(i + 1, language)}
              </AppText>
            </View>
            <AppText variant="bodyLarge" style={styles.stepText}>
              {step}
            </AppText>
          </View>
        ))}
      </View>

      <NoticeBox variant="info" icon={null} heading={t("activity.whyLabel")}>
        {a.why}
      </NoticeBox>
      <NoticeBox variant="info" icon={null} heading={t("activity.easierLabel")}>
        {a.easier}
      </NoticeBox>
      <NoticeBox variant="info" icon={null} heading={t("activity.harderLabel")}>
        {a.harder}
      </NoticeBox>
      <NoticeBox variant="info" icon={null} heading={t("activity.noticeLabel")}>
        {a.noticeThis}
      </NoticeBox>
      <NoticeBox variant="warn" icon={null} heading={t("activity.safetyLabel")}>
        {a.safety}
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
