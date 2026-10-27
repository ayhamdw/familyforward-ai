import { Pressable, StyleSheet, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors, sizes, spacing } from "@/theme/tokens";
import { AppText } from "./AppText";

type IconPair = { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap };

const ICONS: Record<string, IconPair> = {
  plan: { active: "calendar", inactive: "calendar-outline" },
  help: { active: "heart", inactive: "heart-outline" },
  settings: { active: "settings", inactive: "settings-outline" },
};

/** Bottom tab bar. The row mirrors in RTL, so the first tab sits at the start edge. */
export function TabBar({ state, descriptors, navigateToTab }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key]?.options;
        const label = typeof options?.title === "string" ? options.title : route.name;
        const icons = ICONS[route.name] ?? ICONS.plan;
        const color = focused ? colors.primary : colors.muted;
        return (
          <Pressable
            key={route.key}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: focused }}
            onPress={() => navigateToTab(route.key)}
            style={styles.tab}
          >
            <Ionicons name={focused ? icons.active : icons.inactive} size={24} color={color} />
            <AppText variant="small" weight={focused ? "bold" : "medium"} color={color}>
              {label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.borderSoft,
    backgroundColor: colors.card,
  },
  tab: {
    flex: 1,
    minHeight: sizes.minTouchTarget + 8,
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
});
