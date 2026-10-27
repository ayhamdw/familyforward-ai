import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { INTERESTS } from "@familyforward/shared";
import { ChoiceChip } from "@/components/ChoiceChip";
import { useSurveyStore } from "@/storage/surveyStore";
import { spacing } from "@/theme/tokens";
import { SurveyStep } from "./SurveyStep";

export function InterestsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const interests = useSurveyStore((s) => s.interests);
  const toggleInterest = useSurveyStore((s) => s.toggleInterest);
  return (
    <SurveyStep
      step={4}
      title={t("survey.interests.title")}
      helper={t("survey.interests.helper")}
      continueLabel={t("survey.continue")}
      onContinue={() => router.push("/survey/materials")}
    >
      <View style={styles.wrap}>
        {INTERESTS.map((interest) => (
          <ChoiceChip
            key={interest}
            label={t(`survey.interests.${interest}`)}
            selected={interests.includes(interest)}
            onPress={() => toggleInterest(interest)}
          />
        ))}
      </View>
    </SurveyStep>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
});
