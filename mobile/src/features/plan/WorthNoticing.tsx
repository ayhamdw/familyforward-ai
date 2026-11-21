import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import type { WorthNoticing as Card } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { ResourceList } from "@/components/ResourceList";
import { colors, radius, spacing } from "@/theme/tokens";

/** Up to three gentle notes. They never label or compare: the text comes from fixed rules or the checked plan. */
export function WorthNoticing({ cards }: { cards: readonly Card[] }) {
  const { t } = useTranslation();
  const shown = cards.slice(0, 3);
  if (shown.length === 0) {
    return null;
  }
  return (
    <View style={styles.wrap}>
      <AppText variant="bodyLarge" weight="bold" accessibilityRole="header">
        {t("plan.noticingHeading")}
      </AppText>
      {shown.map((card, index) => (
        <View key={`${index}-${card.observation}`} style={styles.card} testID="worth-noticing-card">
          <AppText variant="bodyLarge">{card.observation}</AppText>
          <AppText variant="body" color={colors.muted}>
            {`${t("plan.sayThis")} ${card.tryThis}`}
          </AppText>
          {card.mentionTo === "teacher" ? (
            <AppText variant="body" weight="bold" color={colors.primary}>
              {t("plan.mentionTeacher")}
            </AppText>
          ) : card.mentionTo === "pediatrician" ? (
            <AppText variant="body" weight="bold" color={colors.primary}>
              {t("plan.mentionPediatrician")}
            </AppText>
          ) : null}
          {card.resourceIds.length > 0 ? <ResourceList ids={card.resourceIds} /> : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  card: {
    gap: spacing.sm,
    padding: spacing.lg,
    borderRadius: radius.cardLarge,
    backgroundColor: colors.primaryTint,
  },
});
