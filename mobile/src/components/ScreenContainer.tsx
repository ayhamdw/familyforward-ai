import type { ReactNode } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, sizes, spacing } from "@/theme/tokens";

type Props = {
  children: ReactNode;
  /** Pinned to the bottom, above the safe area (primary buttons). */
  footer?: ReactNode;
  /** Pinned to the top (back button, progress header). */
  header?: ReactNode;
  /** Center the content vertically (status screens). */
  centered?: boolean;
  /** Leave room for a tab bar below (it handles its own safe area). */
  hasTabBar?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
};

export function ScreenContainer({ children, footer, header, centered, hasTabBar, contentStyle }: Props) {
  return (
    <SafeAreaView style={styles.safe} edges={hasTabBar ? ["top"] : ["top", "bottom"]}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        {header ? <View style={styles.header}>{header}</View> : null}
        <ScrollView
          contentContainerStyle={[styles.content, centered && styles.centered, contentStyle]}
          keyboardShouldPersistTaps="handled"
        >
          {children}
        </ScrollView>
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  header: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  content: {
    flexGrow: 1,
    padding: sizes.screenPadding,
    gap: spacing.lg,
  },
  centered: { justifyContent: "center", alignItems: "center" },
  footer: {
    paddingHorizontal: sizes.screenPadding,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.sm,
  },
});
