import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { CHECKIN_ANSWERS, type CheckInAnswer } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { OptionCard } from "@/components/OptionCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, TextButton } from "@/components/buttons";
import { recordCheckIn } from "@/services/actions";
import { activeChild, useChildrenStore } from "@/storage/childrenStore";
import { selectChildPlans, usePlanStore } from "@/storage/planStore";
import { colors, spacing } from "@/theme/tokens";

/** Yes / somewhat / no questions for the week, then the next week's plan is built from the answers. */
export function CheckInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const child = useChildrenStore((s) => activeChild(s));
  const plan = usePlanStore((s) => selectChildPlans(s.byChild, child?.id ?? null).current);
  const [answers, setAnswers] = useState<(CheckInAnswer | null)[]>(() => plan?.checkIn.map((_, i) => plan.checkInAnswers[i] ?? null) ?? []);

  if (!plan) {
    return (
      <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
        <AppText variant="bodyLarge">{t("plan.empty")}</AppText>
      </ScreenContainer>
    );
  }

  const complete = answers.length > 0 && answers.every((a) => a !== null);
  const submit = () => {
    if (!complete) return;
    void recordCheckIn(plan.id, answers as CheckInAnswer[]);
    // The next plan reads this week's counts on the server (previousPlanId), so go build it.
    router.replace({ pathname: "/generating", params: { regenerate: "1" } });
  };

  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={
        <>
          <PrimaryButton label={t("checkIn.submit")} disabled={!complete} onPress={submit} />
          <TextButton label={t("checkIn.skip")} onPress={() => router.replace("/plan")} />
        </>
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {t("checkIn.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted}>
        {t("checkIn.subtitle")}
      </AppText>
      {plan.checkIn.map((question, qi) => (
        <View key={`${qi}-${question}`} style={styles.question}>
          <AppText variant="bodyLarge" weight="semibold">
            {question}
          </AppText>
          <View style={styles.answers}>
            {CHECKIN_ANSWERS.map((value) => (
              <OptionCard
                key={value}
                variant="segment"
                label={t(`checkIn.${value}`)}
                selected={answers[qi] === value}
                onPress={() => setAnswers((list) => list.map((a, i) => (i === qi ? value : a)))}
              />
            ))}
          </View>
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  question: { gap: spacing.md },
  answers: { flexDirection: "row", gap: spacing.sm },
});
