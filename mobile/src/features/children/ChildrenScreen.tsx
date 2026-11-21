import { StyleSheet, View } from "react-native";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { MAX_CHILDREN } from "@familyforward/shared";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, SecondaryButton } from "@/components/buttons";
import { formatAgeBand } from "@/i18n/format";
import { useChildrenStore } from "@/storage/childrenStore";
import { colors, spacing } from "@/theme/tokens";

export function ChildrenScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const children = useChildrenStore((s) => s.children);
  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={
        <PrimaryButton
          label={t("children.add")}
          disabled={children.length >= MAX_CHILDREN}
          onPress={() => router.push("/children/new")}
        />
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {t("children.title")}
      </AppText>
      {children.length === 0 ? (
        <AppText variant="bodyLarge" color={colors.muted}>
          {t("children.empty")}
        </AppText>
      ) : (
        <View style={styles.list}>
          {children.map((child) => (
            <SecondaryButton
              key={child.id}
              label={`${child.nickname} · ${t("survey.age.years", { range: formatAgeBand(child.ageBand, i18n.language) })}`}
              accessibilityLabel={`${t("children.edit")}: ${child.nickname}`}
              onPress={() => router.push({ pathname: "/children/[id]", params: { id: child.id } })}
            />
          ))}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({ list: { gap: spacing.md } });
