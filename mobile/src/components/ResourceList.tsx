import { Linking, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { findResource, type Language, type Resource } from "@familyforward/shared";
import { currentLanguage } from "@/i18n/language";
import { colors, radius, sizes, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

/** Opens only https links. Anything else is ignored. */
export function openWebsite(url: string): void {
  if (url.startsWith("https://")) {
    void Linking.openURL(url);
  }
}

/** Opens the phone dialer with digits only. */
export function dial(phone: string): void {
  const digits = phone.replace(/[^0-9+]/g, "");
  if (digits.length >= 3) {
    void Linking.openURL(`tel:${digits}`);
  }
}

type RowProps = { resource: Resource; language: Language };

export function ResourceRow({ resource, language }: RowProps) {
  const { t } = useTranslation();
  const offers = resource.offers[language];
  return (
    <View style={styles.card}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${resource.name}. ${offers}. ${t("resource.open")}`}
        onPress={() => openWebsite(resource.url)}
        style={({ pressed }) => [styles.main, pressed && styles.pressed]}
      >
        <AppText variant="bodyLarge" weight="bold">
          {resource.name}
        </AppText>
        <AppText variant="body" color={colors.muted}>
          {offers}
        </AppText>
        <View style={styles.tags}>
          <AppText variant="small" weight="bold" color={colors.primary}>
            {t(resource.cost === "free" ? "resource.free" : "resource.low")}
          </AppText>
          <AppText variant="small" color={colors.muted}>
            {t(resource.area === "chicago" ? "resource.chicago" : "resource.national")}
          </AppText>
        </View>
      </Pressable>
      {resource.phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${resource.name}. ${t("resource.call", { phone: resource.phone })}`}
          onPress={() => dial(resource.phone as string)}
          style={({ pressed }) => [styles.call, pressed && styles.pressed]}
        >
          <AppText variant="body" weight="bold" color={colors.primary}>
            {t("resource.call", { phone: resource.phone })}
          </AppText>
        </Pressable>
      ) : null}
    </View>
  );
}

/** A list of resources by id (unknown ids are skipped). Works offline: the directory ships with the app. */
export function ResourceList({ ids, resources }: { ids?: readonly string[]; resources?: readonly Resource[] }) {
  const { i18n } = useTranslation();
  const language = currentLanguage(i18n.language);
  const list = resources ?? (ids ?? []).map(findResource).filter((r): r is Resource => r !== undefined);
  return (
    <View style={styles.list}>
      {list.map((resource) => (
        <ResourceRow key={resource.id} resource={resource} language={language} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacing.md },
  card: {
    borderRadius: radius.cardLarge,
    borderWidth: 1,
    borderColor: colors.borderSoft,
    backgroundColor: colors.card,
    overflow: "hidden",
  },
  main: { minHeight: sizes.minTouchTarget, gap: spacing.xs, padding: spacing.lg },
  tags: { flexDirection: "row", gap: spacing.md, flexWrap: "wrap" },
  call: {
    minHeight: sizes.minTouchTarget,
    justifyContent: "center",
    paddingHorizontal: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
  },
  pressed: { opacity: 0.85 },
});
