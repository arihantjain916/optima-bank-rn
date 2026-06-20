import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

// Temporary stand-in for tabs we haven't designed yet.
export function ScreenPlaceholder({
  icon,
  title,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
}) {
  return (
    <View style={styles.fill}>
      <Ionicons name={icon} size={40} color="#2563EB" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.sub}>Coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A", alignItems: "center", justifyContent: "center", gap: 8 },
  title: { color: "#F8FAFC", fontSize: 20, fontWeight: "700", marginTop: 8 },
  sub: { color: "#64748B", fontSize: 14 },
});
