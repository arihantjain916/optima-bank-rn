import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AppTabActions({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const options = descriptors[route.key].options;
        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : options.title ?? route.name;
        const icon = options.tabBarIcon?.({
          focused,
          color: focused ? "#2563EB" : "#64748B",
          size: 22,
        });

        return (
          <Pressable
            key={route.key}
            style={styles.action}
            onPress={() => {
              const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) navigation.navigate(route.name);
            }}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
          >
            {icon}
            <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    paddingTop: 9,
    backgroundColor: "#0A0E1A",
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  action: { flex: 1, alignItems: "center", justifyContent: "center", gap: 3, minHeight: 42 },
  label: { color: "#64748B", fontSize: 11, fontWeight: "600" },
  labelActive: { color: "#2563EB" },
});
