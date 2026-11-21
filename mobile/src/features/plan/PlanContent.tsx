import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { PlanDto } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { NoticeBox } from "@/components/NoticeBox";
import { ResourceList } from "@/components/ResourceList";
import { colors, spacing } from "@/theme/tokens";
import { PlanDays } from "./PlanDays";
import { WorthNoticing } from "./WorthNoticing";

/**
 * Everything in a plan, read from the plan itself: summary, days, worth-noticing cards (at most
 * three), free resources and the fixed closing line. Used for the current week and past weeks.
 */
export function PlanContent({ plan, readOnly }: { plan: PlanDto; readOnly?: boolean }) {
  const { t } = useTranslation();
  return (
    <View style={styles.wrap}>
      <AppText variant="bodyLarge">{plan.summary}</AppText>
      <PlanDays plan={plan} readOnly={readOnly} />
      <WorthNoticing cards={plan.worthNoticing} />
      <View style={styles.section}>
        <AppText variant="bodyLarge" weight="bold" accessibilityRole="header">
          {t("plan.resourcesHeading")}
        </AppText>
        <ResourceList ids={plan.resourceIds} />
      </View>
      <AppText variant="body" color={colors.muted}>
        {plan.closing}
      </AppText>
      <NoticeBox variant="warn" icon={null}>
        {t("plan.disclaimer")}
      </NoticeBox>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.lg },
  section: { gap: spacing.md },
});
