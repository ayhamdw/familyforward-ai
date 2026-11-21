import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { ScreenContainer } from "@/components/ScreenContainer";
import { TextButton } from "@/components/buttons";
import { generatePlan } from "@/services/actions";
import { activeChild, useChildrenStore } from "@/storage/childrenStore";
import { useSurveyStore } from "@/storage/surveyStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { currentLanguage } from "@/i18n/language";
import { takeNote } from "./noteHolder";

type StepState = "done" | "active" | "pending";

const STEP_MS = 700;

export function GeneratingScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { regenerate } = useLocalSearchParams<{ regenerate?: string }>();
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const started = useRef(false);
  const noteIgnored = useRef(false);

  useEffect(() => {
    if (started.current) {
      return undefined;
    }
    started.current = true;
    let cancelled = false;

    const run = async () => {
      const child = activeChild(useChildrenStore.getState());
      if (!child) {
        router.replace("/children/new");
        return;
      }
      const survey = useSurveyStore.getState();
      const answers = { focus: survey.focus.length > 0 ? survey.focus : (["talking"] as const).slice(), minutes: survey.minutes, days: survey.days, interests: survey.interests, materials: survey.materials };
      // Taken from memory once and used for this request only. It is never saved.
      const note = takeNote();
      const request = generatePlan({
        child,
        answers,
        language: currentLanguage(i18n.language),
        note,
        regenerate: regenerate === "1",
      }).catch(() => null);

      for (const next of [1, 2]) {
        await new Promise<void>((resolve) => setTimeout(resolve, STEP_MS));
        if (cancelled) {
          return;
        }
        setStep(next);
      }
      const result = await request;
      if (cancelled) {
        return;
      }
      noteIgnored.current = result?.noteIgnored ?? false;
      if (result) useSurveyStore.getState().finish();
      setStep(3);
      setReady(true);
      setTimeout(() => {
        if (!cancelled) {
          router.replace({ pathname: "/plan", params: noteIgnored.current ? { noteIgnored: "1" } : {} });
        }
      }, 500);
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [i18n.language, regenerate, router]);

  const rows: { key: string; label: string }[] = [
    { key: "step1", label: t("generating.step1") },
    { key: "step2", label: t("generating.step2", { language: t(`languages.${currentLanguage(i18n.language)}`) }) },
    { key: "step3", label: t("generating.step3") },
  ];
  const stateOf = (index: number): StepState => (index < step ? "done" : index === step ? "active" : "pending");

  return (
    <ScreenContainer
      centered
      footer={<TextButton label={t("generating.continue")} disabled={!ready} onPress={() => router.replace({ pathname: "/plan", params: noteIgnored.current ? { noteIgnored: "1" } : {} })} />}
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
