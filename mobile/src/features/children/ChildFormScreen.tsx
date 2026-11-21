import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  AGE_BANDS,
  HOME_LANGUAGES,
  MAX_CHILDREN,
  NICKNAME_MAX_LENGTH,
  type AgeBand,
  type HomeLanguage,
} from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { BottomSheet } from "@/components/BottomSheet";
import { ChoiceChip } from "@/components/ChoiceChip";
import { NoticeBox } from "@/components/NoticeBox";
import { OptionCard } from "@/components/OptionCard";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SectionLabel } from "@/components/SectionLabel";
import { TextField } from "@/components/TextField";
import { PrimaryButton, SecondaryButton, TextButton } from "@/components/buttons";
import { formatAgeBand } from "@/i18n/format";
import { removeChild, saveChild } from "@/services/actions";
import { ApiError } from "@/services/http";
import { useChildrenStore } from "@/storage/childrenStore";
import { toggleInList } from "@/storage/surveyStore";
import { spacing } from "@/theme/tokens";
import { startSurvey } from "@/features/survey/startSurvey";

/** Add or edit a child: a nickname, an age band and home languages. Nothing else is asked. */
export function ChildFormScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useChildrenStore((s) => s.children.find((c) => c.id === id));
  const childCount = useChildrenStore((s) => s.children.length);
  const editing = existing !== undefined;

  const [nickname, setNickname] = useState(existing?.nickname ?? "");
  const [ageBand, setAgeBand] = useState<AgeBand | null>(existing?.ageBand ?? null);
  const [languages, setLanguages] = useState<HomeLanguage[]>(existing?.homeLanguages ?? []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmRemove, setConfirmRemove] = useState(false);

  const valid = nickname.trim().length >= 1 && ageBand !== null && languages.length >= 1;
  const atLimit = !editing && childCount >= MAX_CHILDREN;

  const fail = (e: unknown) => {
    setError(e instanceof ApiError && e.code === "child_limit" ? t("children.limit") : t("children.saveError"));
  };

  const save = async () => {
    if (!valid || ageBand === null) return;
    setSaving(true);
    setError(null);
    try {
      await saveChild({ nickname: nickname.trim(), ageBand, homeLanguages: languages }, existing?.id);
      if (editing) {
        router.back();
      } else {
        startSurvey(router);
      }
    } catch (e) {
      fail(e);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!existing) return;
    setConfirmRemove(false);
    try {
      await removeChild(existing.id);
      router.back();
    } catch (e) {
      fail(e);
    }
  };

  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={
        <>
          <PrimaryButton
            label={editing ? t("children.save") : t("children.next")}
            loading={saving}
            disabled={!valid || atLimit}
            onPress={() => void save()}
          />
          {editing ? <TextButton label={t("children.remove")} onPress={() => setConfirmRemove(true)} /> : null}
        </>
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {t(editing ? "children.editTitle" : "children.newTitle")}
      </AppText>

      <TextField
        label={t("children.nicknameLabel")}
        helper={t("children.nicknameHelper")}
        value={nickname}
        onChangeText={setNickname}
        placeholder={t("children.nicknamePlaceholder")}
        maxLength={NICKNAME_MAX_LENGTH}
        autoCorrect={false}
        autoComplete="off"
        returnKeyType="done"
      />

      <View style={styles.group}>
        <SectionLabel>{t("children.ageLabel")}</SectionLabel>
        {AGE_BANDS.map((band) => (
          <OptionCard
            key={band}
            label={t("survey.age.years", { range: formatAgeBand(band, i18n.language) })}
            selected={ageBand === band}
            onPress={() => setAgeBand(band)}
          />
        ))}
      </View>

      <View style={styles.group}>
        <SectionLabel>{t("children.languagesLabel")}</SectionLabel>
        <AppText variant="body">{t("children.languagesHelper")}</AppText>
        <View style={styles.chips}>
          {HOME_LANGUAGES.map((language) => (
            <ChoiceChip
              key={language}
              label={t(`children.language.${language}`)}
              selected={languages.includes(language)}
              onPress={() => setLanguages((list) => toggleInList(list, language))}
            />
          ))}
        </View>
      </View>

      {atLimit ? <NoticeBox variant="warn">{t("children.limit")}</NoticeBox> : null}
      {error ? <NoticeBox variant="error">{error}</NoticeBox> : null}

      <BottomSheet
        visible={confirmRemove}
        onClose={() => setConfirmRemove(false)}
        title={t("children.removeSheet.title")}
        body={t("children.removeSheet.body")}
      >
        <PrimaryButton tone="danger" label={t("children.removeSheet.confirm")} onPress={() => void remove()} />
        <SecondaryButton label={t("children.removeSheet.cancel")} onPress={() => setConfirmRemove(false)} />
      </BottomSheet>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  group: { gap: spacing.md },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
