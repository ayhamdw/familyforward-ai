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
import { deleteMyData, signOutAll } from "@/services/actions";
import { startSurvey } from "@/features/survey/startSurvey";
import { useAuthStore } from "@/storage/authStore";
import { useDevStore } from "@/storage/devStore";
import { colors, radius } from "@/theme/tokens";
import { currentLanguage } from "@/i18n/language";
import { SettingsRow } from "./SettingsRow";

type Sheet = "language" | "signOut" | "delete" | null;

export function SettingsScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [sheet, setSheet] = useState<Sheet>(null);
  const [deleteError, setDeleteError] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const email = useAuthStore((s) => s.email);
  const offline = useDevStore((s) => s.forceOffline);
  const language = currentLanguage(i18n.language);

  const close = () => {
    setSheet(null);
    setDeleteError(false);
  };

  const signOut = async () => {
    close();
    await signOutAll();
    router.replace("/");
  };

  const deleteData = async () => {
    setDeleting(true);
    setDeleteError(false);
    try {
      // Deletes on the server first; the phone is cleared only if that worked.
      await deleteMyData();
      close();
      router.replace("/");
    } catch {
      setDeleteError(true);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <ScreenContainer hasTabBar>
      <AppText variant="title" accessibilityRole="header">
        {t("settings.title")}
      </AppText>

      <View style={styles.list}>
        <SettingsRow label={t("settings.language")} value={LANGUAGE_NAMES[language]} onPress={() => setSheet("language")} />
        <SettingsRow label={t("settings.email")} value={email ?? undefined} />
        <SettingsRow label={t("settings.children")} chevron onPress={() => router.push("/children")} />
        <SettingsRow label={t("settings.pastWeeks")} chevron onPress={() => router.push("/past-weeks")} />
        <SettingsRow
          label={t("settings.newPlan")}
          chevron
          disabled={offline}
          last
          onPress={() => startSurvey(router, { fresh: true })}
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
        <PrimaryButton label={t("settings.signOutSheet.confirm")} onPress={() => void signOut()} />
        <SecondaryButton label={t("settings.signOutSheet.cancel")} onPress={close} />
      </BottomSheet>

      <BottomSheet
        visible={sheet === "delete"}
        onClose={close}
        title={t("settings.deleteSheet.title")}
        body={t("settings.deleteSheet.body")}
      >
        {deleteError ? <NoticeBox variant="error">{t("settings.deleteError")}</NoticeBox> : null}
        <PrimaryButton tone="danger" label={t("settings.deleteSheet.confirm")} loading={deleting} onPress={() => void deleteData()} />
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
