import { useState } from "react";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { hasHealthWords, NOTE_MAX_LENGTH } from "@familyforward/shared";
import { NoticeBox } from "@/components/NoticeBox";
import { TextField } from "@/components/TextField";
import { TextButton } from "@/components/buttons";
import { formatNumber } from "@/i18n/format";
import { holdNote } from "@/features/plan/noteHolder";
import { SurveyStep } from "./SurveyStep";

/**
 * The note lives in this screen's state and, for one request, in memory (noteHolder). It is never
 * saved or logged. The health-word check only decides whether to show the notice; the server then
 * leaves the note out and adds one fixed card.
 */
export function NoteScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [note, setNote] = useState("");
  const healthConcern = hasHealthWords(note);
  const build = () => {
    // Kept in memory for this one request. It is never saved, logged or put in the route.
    holdNote(note);
    router.push("/generating");
  };

  return (
    <SurveyStep
      step={5}
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
