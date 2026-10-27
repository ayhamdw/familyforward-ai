import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { colors, radius, spacing } from "@/theme/tokens";

const CARDS = [
  { titleKey: "help.libraryTitle", bodyKey: "help.libraryBody" },
  { titleKey: "help.programsTitle", bodyKey: "help.programsBody" },
] as const;

export function HelpScreen() {
  const { t } = useTranslation();
  return (
    <ScreenContainer hasTabBar>
      <AppText variant="title" accessibilityRole="header">
        {t("help.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted}>
        {t("help.subtitle")}
      </AppText>
      <View style={styles.list}>
        {CARDS.map((card) => (
          <View key={card.titleKey} style={styles.card}>
            <AppText variant="bodyLarge" weight="bold">
              {t(card.titleKey)}
            </AppText>
            <AppText variant="body" color={colors.muted}>
              {t(card.bodyKey)}
            </AppText>
          </View>
        ))}
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={t("help.callTitle")}
          onPress={() => void Linking.openURL("tel:211")}
          style={styles.card}
        >
          <AppText variant="bodyLarge" weight="bold">
            {t("help.callTitle")}
          </AppText>
          <AppText variant="body" color={colors.muted}>
            {t("help.callBody")}
          </AppText>
        </Pressable>
      </View>
      <NoticeBox variant="warn">{t("help.notice")}</NoticeBox>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    gap: spacing.xs,
    padding: spacing.lg,
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
});
