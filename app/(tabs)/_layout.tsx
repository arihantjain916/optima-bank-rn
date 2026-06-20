import { AppHeader } from "@/components/app-header";
import { AppTabActions } from "@/components/app-tab-actions";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        header: () => <AppHeader />,
        tabBar: (props) => <AppTabActions {...props} />,
        tabBarStyle: {
          backgroundColor: "#0A0E1A",
          borderTopColor: "rgba(255,255,255,0.06)",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Home", tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="card"
        options={{ title: "Card", tabBarIcon: ({ color, size }) => <Ionicons name="card" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="send"
        options={{ title: "Send", tabBarIcon: ({ color, size }) => <Ionicons name="paper-plane" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="analytics"
        options={{ title: "Analytics", tabBarIcon: ({ color, size }) => <Ionicons name="bar-chart" color={color} size={size} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: "Profile", tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> }}
      />
      <Tabs.Screen name="transaction/[id]" options={{ href: null, headerShown: false }} />
    </Tabs>
  );
}
