import { Tabs } from "expo-router/js-tabs";
import { useTranslation } from "react-i18next";
import { TabBar } from "@/components/TabBar";

export default function TabsLayout() {
  const { t } = useTranslation();
  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="plan" options={{ title: t("tabs.plan") }} />
      <Tabs.Screen name="help" options={{ title: t("tabs.help") }} />
      <Tabs.Screen name="settings" options={{ title: t("tabs.settings") }} />
    </Tabs>
  );
}
