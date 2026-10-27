import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { LANGUAGES, type Language } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { IconTile } from "@/components/IconTile";
import { NoticeBox } from "@/components/NoticeBox";
import { OptionCard } from "@/components/OptionCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionLabel } from "@/components/SectionLabel";
import { TextButton } from "@/components/buttons";
import { changeLanguage, LANGUAGE_NAMES } from "@/i18n";
import { useAuthStore } from "@/storage/authStore";
import { usePlanStore } from "@/storage/planStore";
import { colors, spacing } from "@/theme/tokens";

export function WelcomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const signedIn = useAuthStore((s) => s.signedIn);
  const sessionExpired = useAuthStore((s) => s.sessionExpired);
  const hasPlan = usePlanStore((s) => s.current !== null);
  const [reloadNeeded, setReloadNeeded] = useState(false);

  if (sessionExpired) {
    return <Redirect href="/session-expired" />;
  }
  if (signedIn) {
    return <Redirect href={hasPlan ? "/plan" : "/survey/age"} />;
  }

  const choose = async (language: Language) => {
    const needsReload = await changeLanguage(language);
    // A direction change needs an app reload, so ask for it and only move on once none is pending.
    setReloadNeeded(needsReload);
    if (!needsReload) {
      router.push("/consent");
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.hero}>
        <IconTile icon="arrow-forward" />
        {/* Long press opens the dev menu in development builds only. */}
        <AppText
          variant="title"
          accessibilityRole="header"
          onLongPress={__DEV__ ? () => router.push("/dev") : undefined}
        >
          {t("welcome.title")}
        </AppText>
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("welcome.tagline")}
        </AppText>
      </View>

      <View style={styles.languages}>
        <SectionLabel>{t("welcome.chooseLanguage")}</SectionLabel>
        {LANGUAGES.map((language) => (
          <OptionCard
            key={language}
            label={LANGUAGE_NAMES[language]}
            trailingText={language.toUpperCase()}
            selected={i18n.language === language}
            hideIndicator
            onPress={() => void choose(language)}
          />
        ))}
      </View>

      {reloadNeeded ? (
        <View accessibilityLiveRegion="polite">
          <NoticeBox variant="info">{t("welcome.reloadNotice")}</NoticeBox>
        </View>
      ) : null}

      <View style={styles.account}>
        <AppText variant="body" color={colors.muted}>
          {t("welcome.haveAccount")}
        </AppText>
        <TextButton label={t("welcome.signIn")} onPress={() => router.push("/sign-in")} />
      </View>

      <View style={styles.footerNote}>
        <View style={styles.dot} />
        <AppText variant="small" color={colors.muted} style={styles.footerText}>
          {t("welcome.footerNote")}
        </AppText>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  hero: { gap: spacing.md, marginTop: spacing.xl },
  languages: { gap: spacing.md },
  account: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: spacing.xs },
  footerNote: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm },
  footerText: { flexShrink: 1 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
});
