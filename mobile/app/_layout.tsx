import { useEffect, useState } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { SafeAreaProvider } from "react-native-safe-area-context";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
  Figtree_700Bold,
} from "@expo-google-fonts/figtree";
import {
  NotoSansArabic_400Regular,
  NotoSansArabic_500Medium,
  NotoSansArabic_600SemiBold,
  NotoSansArabic_700Bold,
} from "@expo-google-fonts/noto-sans-arabic";
import { initI18n } from "@/i18n";
import { useAuthStore } from "@/storage/authStore";
import { usePlanStore } from "@/storage/planStore";
import { useSurveyStore } from "@/storage/surveyStore";
import { colors } from "@/theme/tokens";

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [i18nReady, setI18nReady] = useState(false);
  const [fontsLoaded, fontError] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    Figtree_700Bold,
    NotoSansArabic_400Regular,
    NotoSansArabic_500Medium,
    NotoSansArabic_600SemiBold,
    NotoSansArabic_700Bold,
  });
  const authReady = useAuthStore((s) => s.hydrated);
  const surveyReady = useSurveyStore((s) => s.hydrated);
  const planReady = usePlanStore((s) => s.hydrated);
  const storesReady = authReady && surveyReady && planReady;

  useEffect(() => {
    void initI18n().finally(() => setI18nReady(true));
  }, []);

  const ready = i18nReady && storesReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </SafeAreaProvider>
  );
}
