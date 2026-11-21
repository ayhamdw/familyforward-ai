import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { REACTIONS, type Reaction } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { OptionCard } from "@/components/OptionCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton } from "@/components/buttons";
import { recordActivity } from "@/services/actions";
import { findPlan, isPlanComplete, usePlanStore } from "@/storage/planStore";
import { colors, spacing } from "@/theme/tokens";

const REACTION_KEYS: Record<Reaction, string> = {
  loved: "done.loved",
  fine: "done.fine",
  didnt_work: "done.didntWork",
};

export function DoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { planId, index } = useLocalSearchParams<{ planId?: string; index?: string }>();
  const plan = usePlanStore((s) => (planId ? findPlan(s.byChild, planId) : null));
  const position = Number(index);
  const reaction = plan?.days[position]?.reaction ?? null;

  const choose = (value: Reaction) => {
    if (planId) void recordActivity(planId, position, { done: true, reaction: value });
  };
  const goBack = () => router.replace(isPlanComplete(plan) ? "/week-complete" : "/plan");

  return (
    <ScreenContainer centered footer={<PrimaryButton label={t("done.back")} onPress={goBack} />}>
      <IconTile icon="checkmark" tone="amber" />
      <AppText variant="title" accessibilityRole="header" style={styles.center}>
        {t("done.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted} style={styles.center}>
        {t("done.body")}
      </AppText>
      <AppText variant="bodyLarge" weight="semibold" style={styles.center}>
        {t("done.question")}
      </AppText>
      <View style={styles.answers}>
        {REACTIONS.map((value) => (
          <OptionCard key={value} variant="segment" label={t(REACTION_KEYS[value])} selected={reaction === value} onPress={() => choose(value)} />
        ))}
      </View>
      <AppText variant="small" color={colors.muted} style={styles.center}>
        {t("done.hint")}
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  answers: { alignSelf: "stretch", gap: spacing.md },
});
