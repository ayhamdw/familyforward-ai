import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { LANGUAGES } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { BottomSheet } from "@/components/BottomSheet";
import { NoticeBox } from "@/components/NoticeBox";
import { OptionCard } from "@/components/OptionCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import { changeLanguage, LANGUAGE_NAMES } from "@/i18n";
import { useAuthStore } from "@/storage/authStore";
import { useDevStore } from "@/storage/devStore";
import { usePlanStore } from "@/storage/planStore";
import { useSurveyStore } from "@/storage/surveyStore";
import { colors, radius } from "@/theme/tokens";
import { currentLanguage } from "../plan/content";
import { SettingsRow } from "./SettingsRow";

type Sheet = "language" | "signOut" | "delete" | null;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const email = useAuthStore((s) => s.email);
  const offline = useDevStore((s) => s.forceOffline);
  const language = currentLanguage(i18n.language);

  const close = () => setSheet(null);

  const signOut = () => {
    close();
    useAuthStore.getState().signOut();
    router.replace("/");
  };

  const deleteData = () => {
    close();
    useSurveyStore.getState().reset();
    usePlanStore.getState().clear();
    useAuthStore.getState().signOut();
    router.replace("/");
  };

  return (
    <ScreenContainer hasTabBar>
      <AppText variant="title" accessibilityRole="header">
        {t("settings.title")}
      </AppText>

      <View style={styles.list}>
        <SettingsRow label={t("settings.language")} value={LANGUAGE_NAMES[language]} onPress={() => setSheet("language")} />
        <SettingsRow label={t("settings.email")} value={email ?? undefined} />
        <SettingsRow label={t("settings.pastWeeks")} chevron onPress={() => router.push("/past-weeks")} />
        <SettingsRow
          label={t("settings.newPlan")}
          chevron
          disabled={offline}
          last
          onPress={() => router.push("/survey/age")}
        />
      </View>

      <NoticeBox variant="info" icon={null} heading={t("settings.privacyLabel")}>
        {t("settings.privacyBody")}
      </NoticeBox>

      <View style={styles.list}>
        <SettingsRow label={t("settings.about")} chevron onPress={() => router.push("/privacy")} />
        <SettingsRow label={t("settings.signOut")} onPress={() => setSheet("signOut")} />
        {__DEV__ ? <SettingsRow label="Dev menu" chevron onPress={() => router.push("/dev")} /> : null}
        <SettingsRow label={t("settings.deleteData")} destructive last onPress={() => setSheet("delete")} />
      </View>

      <BottomSheet visible={sheet === "language"} onClose={close} title={t("settings.languageSheet")}>
        {LANGUAGES.map((code) => (
          <OptionCard
            key={code}
            label={LANGUAGE_NAMES[code]}
            selected={code === language}
            onPress={() => {
              close();
              void changeLanguage(code);
            }}
          />
        ))}
      </BottomSheet>

      <BottomSheet
        visible={sheet === "signOut"}
        onClose={close}
        title={t("settings.signOutSheet.title")}
        body={t("settings.signOutSheet.body")}
      >
        <PrimaryButton label={t("settings.signOutSheet.confirm")} onPress={signOut} />
        <SecondaryButton label={t("settings.signOutSheet.cancel")} onPress={close} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === "delete"}
        onClose={close}
        title={t("settings.deleteSheet.title")}
        body={t("settings.deleteSheet.body")}
      >
        <PrimaryButton tone="danger" label={t("settings.deleteSheet.confirm")} onPress={deleteData} />
        <SecondaryButton label={t("settings.deleteSheet.cancel")} onPress={close} />
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  list: {
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
});
