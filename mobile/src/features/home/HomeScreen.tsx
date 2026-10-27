import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type Language } from "@familyforward/shared";
import { LanguageButton } from "@/components/LanguageButton";
import { changeLanguage, LANGUAGE_NAMES } from "@/i18n";
import { isLanguage } from "@/storage/language";
import { colors, spacing } from "@/theme";

export function HomeScreen() {
  const { t, i18n } = useTranslation();
  const current: Language = isLanguage(i18n.language) ? i18n.language : "en";

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{t("appName")}</Text>
      <Text style={styles.body}>{t("welcome")}</Text>

      <View style={styles.row}>
        <Ionicons name="language" size={24} color={colors.primary} style={styles.rowIcon} />
        <Text style={styles.rowLabel}>{t("chooseLanguage")}</Text>
      </View>

      <View style={styles.languages}>
        {LANGUAGES.map((language) => (
          <LanguageButton
            key={language}
            label={LANGUAGE_NAMES[language]}
            selected={language === current}
            onPress={() => void changeLanguage(language)}
          />
        ))}
      </View>

      <Pressable accessibilityRole="button" style={styles.continue}>
        <Text style={styles.continueLabel}>{t("continue")}</Text>
      </Pressable>

      <Text style={styles.privacy}>{t("privacyNote")}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: spacing.lg,
    paddingTop: spacing.xl * 2,
    gap: spacing.md,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
    textAlign: "auto",
  },
  body: {
    fontSize: 18,
    lineHeight: 26,
    color: colors.text,
    textAlign: "auto",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    paddingStart: spacing.sm,
  },
  rowIcon: {
    marginEnd: spacing.sm,
  },
  rowLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.text,
    textAlign: "auto",
  },
  languages: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.sm,
  },
  continue: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: 8,
    alignItems: "center",
    backgroundColor: colors.primary,
  },
  continueLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: colors.onPrimary,
  },
  privacy: {
    fontSize: 14,
    color: colors.mutedText,
    textAlign: "auto",
  },
});
