import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AGE_BANDS } from "@familyforward/shared";
import { OptionCard } from "@/components/OptionCard";
import { formatAgeBand } from "@/i18n/format";
import { useSurveyStore } from "@/storage/surveyStore";
import { spacing } from "@/theme/tokens";
import { SurveyStep } from "./SurveyStep";

export function AgeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const ageBand = useSurveyStore((s) => s.ageBand);
  const setAgeBand = useSurveyStore((s) => s.setAgeBand);
  return (
    <SurveyStep
      step={1}
      title={t("survey.age.title")}
      helper={t("survey.age.helper")}
      continueLabel={t("survey.continue")}
      continueDisabled={ageBand === null}
      onContinue={() => router.push("/survey/focus")}
    >
      <View style={{ gap: spacing.md }}>
        {AGE_BANDS.map((band) => (
          <OptionCard
            key={band}
            label={t("survey.age.years", { range: formatAgeBand(band, i18n.language) })}
            selected={ageBand === band}
            onPress={() => setAgeBand(band)}
          />
        ))}
      </View>
    </SurveyStep>
  );
}
