import { StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton } from "@/components/buttons";
import { colors, radius, spacing } from "@/theme/tokens";

const POINTS = ["consent.point1", "consent.point2", "consent.point3"] as const;

export function ConsentScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={<PrimaryButton label={t("consent.cta")} onPress={() => router.push("/sign-in")} />}
    >
      <AppText variant="title" accessibilityRole="header">
        {t("consent.title")}
      </AppText>
      <View style={styles.points}>
        {POINTS.map((key) => (
          <View key={key} style={styles.card}>
            <View style={styles.check}>
              <Ionicons name="checkmark" size={20} color={colors.primary} />
            </View>
            <AppText variant="bodyLarge" style={styles.text}>
              {t(key)}
            </AppText>
          </View>
        ))}
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  points: { gap: spacing.md },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  check: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryTint,
  },
  text: { flex: 1 },
});
