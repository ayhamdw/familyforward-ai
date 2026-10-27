import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { OptionCard } from "@/components/OptionCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton } from "@/components/buttons";
import { isPlanComplete, usePlanStore } from "@/storage/planStore";
import { colors, spacing } from "@/theme/tokens";

export function DoneScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const plan = usePlanStore((s) => s.current);
  const setFit = usePlanStore((s) => s.setFit);
  const fit = plan?.items.find((item) => item.activityId === id)?.fit ?? null;

  const goBack = () => router.replace(isPlanComplete(plan) ? "/week-complete" : "/plan");

  return (
    <ScreenContainer
      centered
      footer={<PrimaryButton label={t("done.back")} onPress={goBack} />}
    >
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
        <OptionCard variant="segment" label={t("done.yes")} selected={fit === true} onPress={() => id && setFit(id, true)} />
        <OptionCard variant="segment" label={t("done.no")} selected={fit === false} onPress={() => id && setFit(id, false)} />
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  answers: { flexDirection: "row", alignSelf: "stretch", gap: spacing.md },
});
