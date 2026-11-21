import { StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDevStore } from "@/storage/devStore";
import { useNetStore } from "@/storage/netStore";
import { colors, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

/** Shown at the top of every screen while the last request could not reach the server. */
export function OfflineBanner() {
  const { t } = useTranslation();
  const online = useNetStore((s) => s.online);
  const forced = useDevStore((s) => s.forceOffline);
  if (online && !forced) {
    return null;
  }
  return (
    <SafeAreaView edges={["top"]} style={styles.safe}>
      <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
        <AppText variant="small" weight="semibold" color={colors.noticeText} style={styles.text}>
          {t("offline.banner")}
        </AppText>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { backgroundColor: colors.noticeBg },
  bar: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, backgroundColor: colors.noticeBg },
  text: { textAlign: "center" },
});
