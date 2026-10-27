import { View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MATERIALS } from "@familyforward/shared";
import { CheckRow } from "@/components/CheckRow";
import { useSurveyStore } from "@/storage/surveyStore";
import { spacing } from "@/theme/tokens";
import { SurveyStep } from "./SurveyStep";

export function MaterialsScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const materials = useSurveyStore((s) => s.materials);
  const toggleMaterial = useSurveyStore((s) => s.toggleMaterial);
  return (
    <SurveyStep
      step={5}
      title={t("survey.materials.title")}
      helper={t("survey.materials.helper")}
      continueLabel={t("survey.continue")}
      onContinue={() => router.push("/survey/note")}
    >
      <View style={{ gap: spacing.sm }}>
        {MATERIALS.map((material) => (
          <CheckRow
            key={material}
            label={t(`survey.materials.${material}`)}
            checked={materials.includes(material)}
            onPress={() => toggleMaterial(material)}
          />
        ))}
      </View>
    </SurveyStep>
  );
}
