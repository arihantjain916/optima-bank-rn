import { Ionicons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function AppHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.header,
        { height: 64 + insets.top, paddingTop: insets.top },
      ]}
    >
      <View style={styles.left}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={18} color="#60A5FA" />
        </View>
        <Text style={styles.brand}>Optima Bank</Text>
      </View>
      <Ionicons name="notifications-outline" size={22} color="#F8FAFC" />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    backgroundColor: "#0A0E1A",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(96,165,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#60A5FA", fontSize: 18, fontWeight: "800" },
});
