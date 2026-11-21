import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { ChoiceChip } from "@/components/ChoiceChip";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import { startSurvey } from "@/features/survey/startSurvey";
import { refreshPlans } from "@/services/actions";
import { activeChild, useChildrenStore } from "@/storage/childrenStore";
import { useDevStore } from "@/storage/devStore";
import { selectChildPlans, usePlanStore } from "@/storage/planStore";
import { colors, spacing } from "@/theme/tokens";
import { PlanContent } from "./PlanContent";

export function PlanScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { noteIgnored } = useLocalSearchParams<{ noteIgnored?: string }>();
  const children = useChildrenStore((s) => s.children);
  const child = useChildrenStore((s) => activeChild(s));
  const setActive = useChildrenStore((s) => s.setActive);
  const plan = usePlanStore((s) => selectChildPlans(s.byChild, child?.id ?? null).current);
  const offline = useDevStore((s) => s.forceOffline);

  useEffect(() => {
    // Refresh quietly. Offline is fine: the saved plan stays on screen.
    if (child) void refreshPlans(child.id).catch(() => undefined);
  }, [child?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const switcher =
    children.length > 1 ? (
      <View style={styles.chips} accessibilityLabel={t("children.switchLabel")}>
        {children.map((c) => (
          <ChoiceChip key={c.id} label={c.nickname} selected={c.id === child?.id} onPress={() => setActive(c.id)} />
        ))}
      </View>
    ) : null;

  if (plan === null) {
    return (
      <ScreenContainer hasTabBar centered>
        <AppText variant="title" accessibilityRole="header">
          {t("plan.title")}
        </AppText>
        {switcher}
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("plan.empty")}
        </AppText>
        <PrimaryButton label={t("plan.makePlan")} disabled={offline} onPress={() => startSurvey(router)} />
      </ScreenContainer>
    );
  }

  const fallback = plan.source === "fallback";
  return (
    <ScreenContainer hasTabBar>
      <AppText variant="title" accessibilityRole="header">
        {t("plan.title")}
      </AppText>
      {switcher}
      {child ? (
        <AppText variant="body" color={colors.muted}>
          {t("children.forChild", { nickname: child.nickname })}
        </AppText>
      ) : null}

      {noteIgnored === "1" ? <NoticeBox variant="neutral" icon={null}>{t("plan.noteIgnored")}</NoticeBox> : null}
      {fallback ? (
        <NoticeBox variant="warn" lead={t("plan.fallbackLead")}>
          {t("plan.fallbackBody")}
        </NoticeBox>
      ) : null}

      <PlanContent plan={plan} />

      <PrimaryButton label={t("plan.checkIn")} onPress={() => router.push("/check-in")} />
      {fallback ? (
        <SecondaryButton label={t("plan.retry")} disabled={offline} onPress={() => router.push({ pathname: "/generating", params: { regenerate: "1" } })} />
      ) : null}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
