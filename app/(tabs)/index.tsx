import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const MUTED = "#94A3B8";

export default function Dashboard() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{ padding: 20, paddingTop: insets.top + 16 }}
    >
      <Text style={styles.hello}>Welcome back</Text>
      <Text style={styles.name}>Alexander Vaughn</Text>

      <LinearGradient
        colors={["#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.balanceCard}
      >
        <Text style={styles.balanceLabel}>TOTAL BALANCE</Text>
        <Text style={styles.balance}>$2,000.00</Text>
        <Text style={styles.account}>•••• •••• 8824</Text>
      </LinearGradient>

      <Text style={styles.section}>Quick actions</Text>
      <View style={styles.actions}>
        {(["paper-plane", "card", "bar-chart", "add-circle"] as const).map((icon) => (
          <View key={icon} style={styles.action}>
            <Ionicons name={icon} size={22} color="#2563EB" />
          </View>
        ))}
      </View>

      <Text style={styles.section}>Recent activity</Text>
      <Text style={styles.empty}>No transactions yet.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },
  hello: { color: MUTED, fontSize: 14 },
  name: { color: "#F8FAFC", fontSize: 24, fontWeight: "800", marginTop: 2 },

  balanceCard: { borderRadius: 20, padding: 22, marginTop: 20, gap: 8 },
  balanceLabel: { color: "rgba(255,255,255,0.8)", fontSize: 11, fontWeight: "700", letterSpacing: 1.5 },
  balance: { color: "#FFFFFF", fontSize: 34, fontWeight: "800" },
  account: { color: "rgba(255,255,255,0.85)", fontSize: 15, letterSpacing: 1, marginTop: 4 },

  section: { color: "#F8FAFC", fontSize: 16, fontWeight: "700", marginTop: 28, marginBottom: 12 },
  actions: { flexDirection: "row", gap: 12 },
  action: {
    flex: 1,
    height: 60,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  empty: { color: MUTED, fontSize: 14 },
});
