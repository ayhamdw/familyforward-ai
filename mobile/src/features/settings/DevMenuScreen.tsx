import { Redirect, useRouter } from "expo-router";
import { Switch, View } from "react-native";
import { AppText } from "@/components/AppText";
import { BackButton } from "@/components/BackButton";
import { ScreenContainer } from "@/components/ScreenContainer";
import { SecondaryButton } from "@/components/buttons";
import { useAuthStore } from "@/storage/authStore";
import { useDevStore } from "@/storage/devStore";
import { usePlanStore } from "@/storage/planStore";
import { INITIAL_ANSWERS, isSurveyComplete, useSurveyStore } from "@/storage/surveyStore";
import { spacing } from "@/theme/tokens";
import { addDays, buildMockPlan, mondayOf } from "../plan/buildPlan";

/** Development-only menu for jumping to states that are hard to reach by hand. Not translated on purpose. */
export function DevMenuScreen() {
  const router = useRouter();
  const forceOffline = useDevStore((s) => s.forceOffline);
  const forcePlanFailure = useDevStore((s) => s.forcePlanFailure);

  if (!__DEV__) {
    return <Redirect href="/" />;
  }

  const answers = () => {
    const saved = useSurveyStore.getState();
    return isSurveyComplete(saved) ? saved : { ...INITIAL_ANSWERS, ageBand: "2-3" as const, focus: ["counting" as const, "talking" as const] };
  };

  const showPlan = (source: "custom" | "fallback") => {
    usePlanStore.getState().setPlan(buildMockPlan(answers(), { weekStart: mondayOf(new Date()), source }));
    router.push("/plan");
  };

  const seedPastWeeks = () => {
    const monday = mondayOf(new Date());
    usePlanStore.getState().addPastWeeks(
      [1, 2, 3].map((weeksAgo) => ({
        id: `sample-${weeksAgo}`,
        weekStart: addDays(monday, -7 * weeksAgo),
        activityCount: 3,
        focus: ["talking" as const, "counting" as const],
      })),
    );
    router.push("/past-weeks");
  };

  return (
    <ScreenContainer header={<BackButton onPress={() => router.back()} />}>
      <AppText variant="title">Dev menu</AppText>
      <View style={{ gap: spacing.sm }}>
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
        <SecondaryButton label="Plan: normal" onPress={() => showPlan("custom")} />
        <SecondaryButton label="Plan: fallback" onPress={() => showPlan("fallback")} />
        <SecondaryButton label="Past weeks: add 3 samples" onPress={seedPastWeeks} />
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
