import { Ionicons } from "@expo/vector-icons";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Status = "error" | "success";

type GlobalStatusScreenProps = {
  status: Status;
  title: string;
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
};

export function GlobalStatusScreen({
  status,
  title,
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
}: GlobalStatusScreenProps) {
  const success = status === "success";
  const icon = success ? "checkmark" : "!";

  return (
    <View style={styles.screen}>
      <View style={styles.glow} />
      <View style={styles.card}>
        <View style={[styles.iconOuter, success ? styles.successOuter : styles.errorOuter]}>
          <View style={[styles.iconInner, success ? styles.successInner : styles.errorInner]}>
            {success ? (
              <Ionicons name="checkmark" size={31} color="#075B4F" />
            ) : (
              <Text style={styles.errorMark}>{icon}</Text>
            )}
          </View>
        </View>

        <Text style={styles.title}>{title}</Text>
        <Text style={styles.message}>{message}</Text>

        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
          onPress={onPrimary}
        >
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>

        {secondaryLabel && onSecondary ? (
          <Pressable
            accessibilityRole="button"
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.pressed]}
            onPress={onSecondary}
          >
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#07162E",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  glow: {
    position: "absolute",
    top: "18%",
    width: 310,
    height: 210,
    borderRadius: 24,
    backgroundColor: "#0B3D8B",
    opacity: 0.35,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 14,
    backgroundColor: "#243A56",
    paddingHorizontal: 22,
    paddingTop: 18,
    paddingBottom: 12,
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  iconOuter: {
    width: 58,
    height: 58,
    borderRadius: 29,
    padding: 5,
    alignItems: "center",
    justifyContent: "center",
  },
  errorOuter: { backgroundColor: "#796E80" },
  successOuter: { backgroundColor: "#167B69" },
  iconInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  errorInner: { backgroundColor: "#FFD6D6" },
  successInner: { backgroundColor: "#67EDC1" },
  errorMark: { color: "#BF323C", fontSize: 30, fontWeight: "900", lineHeight: 33 },
  title: { color: "#FFFFFF", fontSize: 17, fontWeight: "800", marginTop: 14 },
  message: {
    color: "#E2E8F0",
    fontSize: 12,
    lineHeight: 18,
    textAlign: "center",
    marginTop: 7,
    marginBottom: 18,
  },
  primaryButton: {
    width: "100%",
    minHeight: 44,
    borderRadius: 8,
    backgroundColor: "#075DE8",
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" },
  secondaryButton: {
    width: "100%",
    minHeight: 36,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#94A9C4",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  secondaryText: { color: "#FFFFFF", fontSize: 12, fontWeight: "700" },
  pressed: { opacity: 0.78 },
});
