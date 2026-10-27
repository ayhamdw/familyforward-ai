import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { hasHealthWords, NOTE_MAX_LENGTH } from "@familyforward/shared";
import { NoticeBox } from "@/components/NoticeBox";
import { TextField } from "@/components/TextField";
import { TextButton } from "@/components/buttons";
import { formatNumber } from "@/i18n/format";
import { SurveyStep } from "./SurveyStep";

/**
 * The note lives only in this screen's state. It is never saved, logged or sent: the mock plan does
 * not use it, and the health-word check only decides whether to show the notice.
 */
export function NoteScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [note, setNote] = useState("");
  const healthConcern = hasHealthWords(note);
  const build = () => router.push("/generating");

  return (
    <SurveyStep
      step={6}
      title={t("survey.note.title")}
      helper={t("survey.note.helper")}
      continueLabel={t("survey.note.cta")}
      onContinue={build}
      footerExtra={
        healthConcern ? (
          <TextButton label={t("survey.note.seeHelp")} onPress={() => router.push("/help")} />
        ) : (
          <TextButton label={t("survey.note.skip")} onPress={build} />
        )
      }
    >
      <TextField
        label={t("survey.note.label")}
        value={note}
        onChangeText={setNote}
        placeholder={t("survey.note.placeholder")}
        multiline
        maxLength={NOTE_MAX_LENGTH}
        counter={
          healthConcern
            ? undefined
            : t("survey.note.counter", {
                current: formatNumber(note.length, i18n.language),
                max: formatNumber(NOTE_MAX_LENGTH, i18n.language),
              })
        }
      />
      {healthConcern ? (
        <NoticeBox variant="info" lead={t("survey.note.healthLead")}>
          {t("survey.note.healthBody")}
        </NoticeBox>
      ) : null}
    </SurveyStep>
  );
}
