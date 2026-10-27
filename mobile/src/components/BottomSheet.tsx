import type { ReactNode } from "react";
import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useTranslation } from "react-i18next";
import { colors, radius, sizes, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type Props = {
  visible: boolean;
  onClose: () => void;
  title: string;
  body?: string;
  /** Buttons or options. */
  children: ReactNode;
};

/** Modal sheet from the bottom edge, used for confirmations and the language picker. */
export function BottomSheet({ visible, onClose, title, body, children }: Props) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={styles.root}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t("common.close")}
          onPress={onClose}
          style={styles.scrim}
        />
        <View style={styles.sheet} accessibilityViewIsModal>
          <View style={styles.handle} />
          <AppText variant="heading" accessibilityRole="header">
            {title}
          </AppText>
          {body ? (
            <AppText variant="body" color={colors.muted}>
              {body}
            </AppText>
          ) : null}
          <View style={styles.actions}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { ...StyleSheet.absoluteFill, backgroundColor: colors.scrim },
  sheet: {
    gap: spacing.md,
    padding: sizes.screenPadding,
    paddingBottom: spacing.xxxl,
    borderTopStartRadius: radius.sheet,
    borderTopEndRadius: radius.sheet,
    backgroundColor: colors.card,
  },
  handle: {
    alignSelf: "center",
    width: 44,
    height: 5,
    borderRadius: 3,
    marginBottom: spacing.sm,
    backgroundColor: colors.border,
  },
  actions: { gap: spacing.sm, marginTop: spacing.sm },
});
