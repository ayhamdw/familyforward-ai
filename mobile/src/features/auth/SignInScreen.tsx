import { useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { TextField } from "@/components/TextField";
import { PrimaryButton } from "@/components/buttons";
import { api } from "@/services/api";
import { colors } from "@/theme/tokens";
import { isValidEmail } from "./validateEmail";

export function SignInScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  // The dev menu can open this screen already showing the invalid-email state.
  const { demo } = useLocalSearchParams<{ demo?: string }>();
  const [email, setEmail] = useState(demo === "invalid" ? "maria@example" : "");
  const [showError, setShowError] = useState(demo === "invalid");
  const [sending, setSending] = useState(false);

  const submit = async () => {
    if (!isValidEmail(email)) {
      setShowError(true);
      return;
    }
    setSending(true);
    try {
      const trimmed = email.trim();
      await api.requestCode(trimmed);
      router.push({ pathname: "/code", params: { email: trimmed } });
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenContainer
      header={<BackButton onPress={() => router.back()} />}
      footer={<PrimaryButton label={t("signIn.cta")} loading={sending} onPress={() => void submit()} />}
    >
      <AppText variant="title" accessibilityRole="header">
        {t("signIn.title")}
      </AppText>
      <AppText variant="bodyLarge" color={colors.muted}>
        {t("signIn.subtitle")}
      </AppText>
      <TextField
        label={t("signIn.emailLabel")}
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setShowError(false);
        }}
        placeholder={t("signIn.emailPlaceholder")}
        helper={t("signIn.emailHelper")}
        error={showError ? t("signIn.emailError") : undefined}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="email"
        textContentType="emailAddress"
        returnKeyType="send"
        onSubmitEditing={() => void submit()}
      />
    </ScreenContainer>
  );
}
