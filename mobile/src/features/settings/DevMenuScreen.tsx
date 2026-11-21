import { Switch, View } from "react-native";
import { Redirect, useRouter } from "expo-router";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SecondaryButton } from "@/components/buttons";
import { api } from "@/services/api";
import { setToken } from "@/services/session";
import { useAuthStore } from "@/storage/authStore";
import { useChildrenStore } from "@/storage/childrenStore";
import { useDevStore } from "@/storage/devStore";
import { usePlanStore } from "@/storage/planStore";
import { spacing } from "@/theme/tokens";

/** Development-only menu for jumping to states that are hard to reach by hand. Not translated on purpose. */
export function DevMenuScreen() {
  const router = useRouter();
  const demo = useDevStore((s) => s.demo);
  const forceOffline = useDevStore((s) => s.forceOffline);
  const forcePlanFailure = useDevStore((s) => s.forcePlanFailure);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  /**
   * A synthetic profile (invented nickname and answers) kept in memory, so screenshots never
   * contain real data. It does not call the server.
   */
  const loadDemo = async () => {
    useDevStore.getState().setDemo(true);
    await setToken("demo-token");
    useAuthStore.getState().signIn("demo@example.com");
    const child = await api.createChild({ nickname: "Demo", ageBand: "2-3", homeLanguages: ["en", "es"] });
    useChildrenStore.getState().setChildren([child]);
    const plan = await api.createPlan({
      childId: child.id,
      language: "en",
      answers: { focus: ["talking", "feelings"], minutes: 10, days: 3, interests: ["songs"], materials: ["paper", "kitchen"] },
    });
    usePlanStore.getState().setCurrent(child.id, plan);
    router.replace("/plan");
  };

  return (
    <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
      <AppText variant="title">Dev menu</AppText>
      <View style={{ gap: spacing.sm }}>
        <SecondaryButton label="Load demo profile (synthetic, no server)" onPress={() => void loadDemo()} />
        <SecondaryButton label="Sign in: invalid email" onPress={() => router.push({ pathname: "/sign-in", params: { demo: "invalid" } })} />
        <SecondaryButton label="Code: wrong code (3 tries left)" onPress={() => router.push({ pathname: "/code", params: { email: "you@example.com", demo: "wrong" } })} />
        <SecondaryButton label="Code: expired or too many tries" onPress={() => router.push({ pathname: "/code", params: { email: "you@example.com", demo: "locked" } })} />
        <SecondaryButton
          label="Session expired"
          onPress={() => {
            useAuthStore.getState().expireSession();
            router.replace("/");
          }}
        />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText variant="bodyLarge">Demo profile in use</AppText>
        <Switch value={demo} onValueChange={useDevStore.getState().setDemo} accessibilityLabel="Demo profile in use" />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText variant="bodyLarge">Offline</AppText>
        <Switch value={forceOffline} onValueChange={useDevStore.getState().setForceOffline} accessibilityLabel="Offline" />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <AppText variant="bodyLarge">Next plan request fails</AppText>
        <Switch value={forcePlanFailure} onValueChange={useDevStore.getState().setForcePlanFailure} accessibilityLabel="Next plan request fails" />
      </View>
    </ScreenContainer>
  );
}
