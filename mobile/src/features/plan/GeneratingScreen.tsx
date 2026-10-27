import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { ScreenContainer } from "@/components/ScreenContainer";
import { TextButton } from "@/components/buttons";
import { api, ApiError, nextWeekStart } from "@/services/api";
import { usePlanStore, isPlanComplete } from "@/storage/planStore";
import { INITIAL_ANSWERS, isSurveyComplete, useSurveyStore } from "@/storage/surveyStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { buildMockPlan, mondayOf } from "./buildPlan";
import { currentLanguage } from "./content";
import type { Plan } from "./types";

type StepState = "done" | "active" | "pending";

const STEP_MS = 700;

function weekToPlan(previous: Plan | null): string {
  return previous && isPlanComplete(previous) ? nextWeekStart(previous.weekStart) : mondayOf(new Date());
}

export function GeneratingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) {
      return undefined;
    }
    started.current = true;
    let cancelled = false;

    const run = async () => {
      const answers = useSurveyStore.getState();
      const complete = isSurveyComplete(answers)
        ? answers
        : { ...INITIAL_ANSWERS, ageBand: "2-3" as const, focus: ["talking" as const] };
      const previous = usePlanStore.getState().current;
      const weekStart = weekToPlan(previous);

      const plan = api
        .buildPlan({ answers: complete, language: currentLanguage(i18n.language), weekStart })
        .catch((error: unknown) => {
          // Offline with an existing plan: keep it. Otherwise fall back to a ready-made plan.
          if (error instanceof ApiError && error.kind === "offline" && previous) {
            return previous;
          }
          return buildMockPlan(complete, { weekStart, source: "fallback" });
        });

      for (const next of [1, 2]) {
        await new Promise<void>((resolve) => setTimeout(resolve, STEP_MS));
        if (cancelled) {
          return;
        }
        setStep(next);
      }
      const result = await plan;
      if (cancelled) {
        return;
      }
      if (result !== previous) {
        usePlanStore.getState().setPlan(result);
      }
      setStep(3);
      setReady(true);
      setTimeout(() => {
        if (!cancelled) {
          router.replace("/plan");
        }
      }, 500);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, router]);

  const rows: { key: string; label: string }[] = [
    { key: "step1", label: t("generating.step1") },
    { key: "step2", label: t("generating.step2", { language: t(`languages.${currentLanguage(i18n.language)}`) }) },
    { key: "step3", label: t("generating.step3") },
  ];
  const stateOf = (index: number): StepState => (index < step ? "done" : index === step ? "active" : "pending");

  return (
    <ScreenContainer
      centered
      footer={<TextButton label={t("generating.continue")} disabled={!ready} onPress={() => router.replace("/plan")} />}
    >
      <IconTile icon="arrow-forward" />
      <AppText variant="title" accessibilityRole="header">
        {t("generating.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted}>
        {t("generating.subtitle")}
      </AppText>
      <View style={styles.rows} accessibilityLiveRegion="polite">
        {rows.map((row, index) => {
          const state = stateOf(index);
          return (
            <View key={row.key} style={[styles.row, state === "active" && styles.rowActive]}>
              {state === "done" ? (
                <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
              ) : state === "active" ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <View style={styles.pending} />
              )}
              <AppText variant="bodyLarge" weight={state === "pending" ? "regular" : "semibold"} color={state === "pending" ? colors.muted : colors.text}>
                {row.label}
              </AppText>
            </View>
          );
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  rows: { alignSelf: "stretch", gap: spacing.md, marginTop: spacing.md },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  rowActive: { borderColor: colors.primary, backgroundColor: colors.primaryTint },
  pending: { width: 26, height: 26, borderRadius: 13, borderWidth: 2, borderColor: colors.border },
});
