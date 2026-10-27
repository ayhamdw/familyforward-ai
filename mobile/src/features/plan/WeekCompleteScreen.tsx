import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import { formatNumber } from "@/i18n/format";
import { usePlanStore } from "@/storage/planStore";
import { colors, radius, spacing } from "@/theme/tokens";
import { currentLanguage } from "@/i18n/language";
import { activityById, activityText } from "./content";

export function WeekCompleteScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const plan = usePlanStore((s) => s.current);
  const language = currentLanguage(i18n.language);
  const doneItems = plan?.items.filter((item) => item.done) ?? [];

  return (
    <ScreenContainer
      footer={
        <>
          <PrimaryButton label={t("weekComplete.next")} onPress={() => router.replace("/generating")} />
          {/* The saved answers are already in the survey store, so the survey opens prefilled. */}
          <SecondaryButton label={t("weekComplete.change")} onPress={() => router.push("/survey/age")} />
        </>
      }
    >
      <View style={styles.hero}>
        <IconTile icon="arrow-forward" />
        <AppText variant="title" accessibilityRole="header">
          {t("weekComplete.title")}
        </AppText>
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("weekComplete.body", { count: doneItems.length, n: formatNumber(doneItems.length, language) })}
        </AppText>
      </View>
      <View style={styles.list}>
        {doneItems.map((item) => {
          const activity = activityById(item.activityId);
          return activity ? (
            <View key={item.activityId} style={styles.row}>
              <Ionicons name="checkmark-circle" size={26} color={colors.primary} />
              <AppText variant="bodyLarge" weight="semibold" style={styles.title}>
                {activityText(activity, language).title}
              </AppText>
            </View>
          ) : null;
        })}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, marginTop: spacing.lg },
  list: { gap: spacing.sm },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  title: { flex: 1 },
});
