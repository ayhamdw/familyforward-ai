import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { Redirect, Stack, usePathname } from "expo-router";
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
import { OfflineBanner } from "@/components/OfflineBanner";
import { initI18n } from "@/i18n";
import { refreshAll } from "@/services/actions";
import { useAuthStore } from "@/storage/authStore";
import { useChildrenStore } from "@/storage/childrenStore";
import { useDraftStore } from "@/storage/draftStore";
import { usePlanStore } from "@/storage/planStore";
import { useQueueStore } from "@/storage/queueStore";
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
  const childrenReady = useChildrenStore((s) => s.hydrated);
  const planReady = usePlanStore((s) => s.hydrated);
  const queueReady = useQueueStore((s) => s.hydrated);
  const draftReady = useDraftStore((s) => s.hydrated);
  const storesReady = authReady && childrenReady && planReady && queueReady && draftReady;

  useEffect(() => {
    void initI18n().finally(() => setI18nReady(true));
  }, []);

  const ready = i18nReady && storesReady && (fontsLoaded || fontError !== null);

  useEffect(() => {
    if (ready) {
      void SplashScreen.hideAsync();
    }
  }, [ready]);

  const signedIn = useAuthStore((s) => s.signedIn);

  // Send saved writes and refresh from the server on start and whenever the app comes back to the front.
  useEffect(() => {
    if (!ready || !signedIn) return undefined;
    void refreshAll();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void refreshAll();
    });
    return () => sub.remove();
  }, [ready, signedIn]);

  if (!ready) {
    return null;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <SessionGuard />
      <OfflineBanner />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }} />
    </SafeAreaProvider>
  );
}

/** Any 401 sets sessionExpired; this sends the parent to the "please sign in again" screen from anywhere. */
function SessionGuard() {
  const expired = useAuthStore((s) => s.sessionExpired);
  const pathname = usePathname();
  const onAuthScreen = ["/session-expired", "/sign-in", "/code", "/consent"].includes(pathname);
  return expired && !onAuthScreen ? <Redirect href="/session-expired" /> : null;
}
