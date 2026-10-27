import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton } from "@/components/buttons";
import { colors, spacing } from "@/theme/tokens";

const BULLETS = [
  { heading: "about.keepHeading", items: ["about.keep1", "about.keep2"] },
  { heading: "about.neverHeading", items: ["about.never1", "about.never2", "about.never3"] },
] as const;

export function PrivacyScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={<PrimaryButton label={t("about.done")} onPress={() => router.back()} />}
    >
      <AppText variant="title" accessibilityRole="header">
        {t("about.title")}
      </AppText>

      <View style={styles.section}>
        <AppText variant="heading" accessibilityRole="header">
          {t("about.whatIsHeading")}
        </AppText>
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("about.whatIsBody")}
        </AppText>
      </View>

      <View style={styles.section}>
        <AppText variant="heading" accessibilityRole="header">
          {t("about.whatNotHeading")}
        </AppText>
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("about.whatNotBody")}
        </AppText>
      </View>

      {BULLETS.map((group) => (
        <View key={group.heading} style={styles.section}>
          <AppText variant="heading" accessibilityRole="header">
            {t(group.heading)}
          </AppText>
          {group.items.map((item) => (
            <View key={item} style={styles.bullet}>
              <AppText variant="bodyLarge" color={colors.muted}>
                •
              </AppText>
              <AppText variant="bodyLarge" color={colors.muted} style={styles.bulletText}>
                {t(item)}
              </AppText>
            </View>
          ))}
        </View>
      ))}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  section: { gap: spacing.sm },
  bullet: { flexDirection: "row", gap: spacing.sm },
  bulletText: { flex: 1 },
});
