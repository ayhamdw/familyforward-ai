import { StyleSheet } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton } from "@/components/buttons";
import { colors } from "@/theme/tokens";

export function SessionExpiredScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  return (
    <ScreenContainer centered footer={<PrimaryButton label={t("sessionExpired.cta")} onPress={() => router.replace("/sign-in")} />}>
      <IconTile icon="lock-closed" />
      <AppText variant="title" accessibilityRole="header" style={styles.center}>
        {t("sessionExpired.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted} style={styles.center}>
        {t("sessionExpired.body")}
      </AppText>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
});
