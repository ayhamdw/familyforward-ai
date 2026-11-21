import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { CodeInput } from "@/components/CodeInput";
import { IconTile } from "@/components/IconTile";
import { NoticeBox } from "@/components/NoticeBox";
import { ScreenContainer } from "@/components/ScreenContainer";
import { PrimaryButton, TextButton } from "@/components/buttons";
import { formatNumber } from "@/i18n/format";
import { api } from "@/services/api";
import { refreshAll, signInWithCode } from "@/services/actions";
import { startSurvey } from "@/features/survey/startSurvey";
import { useChildrenStore } from "@/storage/childrenStore";
import { colors, spacing } from "@/theme/tokens";

const RESEND_SECONDS = 30;
/** The server allows 5 tries per code. The count shown here follows it. */
const MAX_CODE_TRIES = 5;
const CODE_LENGTH = 6;

type Status = "idle" | "wrong" | "locked";

function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
}

export function CodeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { email = "", demo } = useLocalSearchParams<{ email?: string; demo?: string }>();
  const [networkError, setNetworkError] = useState(false);

  // The dev menu can open this screen already in the wrong-code or locked state.
  const [status, setStatus] = useState<Status>(demo === "wrong" ? "wrong" : demo === "locked" ? "locked" : "idle");
  const [triesLeft, setTriesLeft] = useState(demo === "wrong" ? 3 : MAX_CODE_TRIES);
  const [code, setCode] = useState(demo === "wrong" ? "481902" : "");
  const [verifying, setVerifying] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (secondsLeft <= 0) {
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  const resend = async () => {
    setNetworkError(false);
    try {
      await api.requestCode(email);
    } catch {
      setNetworkError(true);
      return;
    }
    setStatus("idle");
    setTriesLeft(MAX_CODE_TRIES);
    setCode("");
    setSecondsLeft(RESEND_SECONDS);
  };

  const verify = async () => {
    if (status === "wrong" && code.length < CODE_LENGTH) {
      setStatus("idle");
      return;
    }
    setVerifying(true);
    setNetworkError(false);
    try {
      const result = await signInWithCode(email, code);
      if (result.status === "ok") {
        // Load this parent's children and plans (a returning parent skips the survey), then go on.
        await refreshAll();
        const store = useChildrenStore.getState();
        if (store.children.length === 0) startSurvey(router);
        else router.replace("/plan");
      } else if (result.status === "wrong") {
        const left = triesLeft - 1;
        if (left <= 0) {
          setStatus("locked");
        } else {
          setStatus("wrong");
          setTriesLeft(left);
        }
        setCode("");
      } else {
        setStatus("locked");
      }
    } catch {
      setNetworkError(true);
    } finally {
      setVerifying(false);
    }
  };

  if (status === "locked") {
    return (
      <ScreenContainer
        centered
        footer={
          <>
            <PrimaryButton label={t("code.sendNew")} onPress={() => void resend()} />
            <TextButton label={t("code.differentEmail")} onPress={() => router.replace("/sign-in")} />
          </>
        }
      >
        <IconTile icon="timer-outline" tone="cream" />
        <AppText variant="title" accessibilityRole="header" style={styles.center}>
          {t("code.lockedTitle")}
        </AppText>
        <AppText variant="bodyLarge" color={colors.muted} style={styles.center}>
          {t("code.lockedBody")}
        </AppText>
      </ScreenContainer>
    );
  }

  const wrong = status === "wrong";
  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={
        <PrimaryButton
          label={wrong ? t("code.tryAgain") : t("code.verify")}
          loading={verifying}
          disabled={!wrong && code.length < CODE_LENGTH}
          onPress={() => void verify()}
        />
      }
    >
      <AppText variant="title" accessibilityRole="header">
        {t("code.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted}>
        {t(wrong ? "code.subtitleShort" : "code.subtitle", { email })}
      </AppText>
      <View style={styles.field}>
        <AppText variant="small" weight="bold">
          {t("code.label")}
        </AppText>
        <CodeInput value={code} onChange={setCode} error={wrong} label={t("code.label")} />
      </View>
      {networkError ? <NoticeBox variant="error">{t("errors.network")}</NoticeBox> : null}
      {wrong ? (
        <>
          <NoticeBox variant="error">{t("code.wrong", { tries: formatNumber(triesLeft, i18n.language) })}</NoticeBox>
          <View style={styles.resendRow}>
            <AppText variant="body" color={colors.muted}>
              {t("code.needNew")}
            </AppText>
            <TextButton label={t("code.sendAgain")} onPress={() => void resend()} />
          </View>
        </>
      ) : (
        <View style={styles.resendRow}>
          <AppText variant="body" color={colors.muted}>
            {t("code.resendPrompt")}
          </AppText>
          {secondsLeft > 0 ? (
            <AppText variant="body" weight="bold" color={colors.primary} accessibilityLiveRegion="polite">
              {t("code.resendIn", { time: formatNumber(formatCountdown(secondsLeft), i18n.language) })}
            </AppText>
          ) : (
            <TextButton label={t("code.sendAgain")} onPress={() => void resend()} />
          )}
        </View>
      )}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  center: { textAlign: "center" },
  field: { gap: spacing.sm },
  resendRow: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", justifyContent: "center", gap: spacing.xs },
});
