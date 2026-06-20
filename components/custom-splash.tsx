import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

type Props = {
  /** Flip true when boot work is done; the overlay then fades away. */
  ready: boolean;
  /** Called after the fade-out finishes so the parent can unmount us. */
  onDone: () => void;
};

export function CustomSplash({ ready, onDone }: Props) {
  const opacity = useRef(new Animated.Value(1)).current;

  // Our overlay has painted → hide the native splash underneath it so the
  // handoff has no blank frame between the two.
  const onLayout = () => SplashScreen.hideAsync();

  useEffect(() => {
    if (!ready) return;
    Animated.timing(opacity, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(onDone); // unmount once fully faded
  }, [ready, opacity, onDone]);

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, { opacity }]}
      onLayout={onLayout}
      pointerEvents="none"
    >
      <StatusBar style="light" />
      <LinearGradient
        colors={["#0A1322", "#13294E", "#0A1322"] as const}
        locations={[0, 0.5, 1] as const}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.fill}
      >
        {/* Center brand block */}
        <View style={styles.center}>
          <View style={styles.tile}>
            <FontAwesome name="university" size={34} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>Optima Bank</Text>
          <Text style={styles.subtitle}>SECURE INSTITUTIONAL BANKING</Text>
        </View>

        {/* Bottom: dot loader + encrypted-session pill */}
        <View style={styles.bottom}>
          <DotsLoader />
          <View style={styles.pill}>
            <Ionicons name="shield-checkmark" size={13} color="#60A5FA" />
            <Text style={styles.pillText}>End-to-End Encrypted Session</Text>
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

/** Three dots that pulse in sequence. */
function DotsLoader() {
  const dots = [useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current, useRef(new Animated.Value(0.3)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.sequence([
        Animated.delay(i * 200),
        Animated.loop(
          Animated.sequence([
            Animated.timing(dot, { toValue: 1, duration: 400, easing: Easing.ease, useNativeDriver: true }),
            Animated.timing(dot, { toValue: 0.3, duration: 400, easing: Easing.ease, useNativeDriver: true }),
          ])
        ),
      ])
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, [dots]);

  return (
    <View style={styles.dots}>
      {dots.map((opacity, i) => (
        <Animated.View key={i} style={[styles.dot, { opacity }]} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, alignItems: "center", justifyContent: "center" },
  center: { alignItems: "center" },
  tile: {
    width: 84,
    height: 84,
    borderRadius: 22,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 22,
    // soft brand glow
    shadowColor: "#2563EB",
    shadowOpacity: 0.5,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  title: { color: "#FFFFFF", fontSize: 22, fontWeight: "700", marginBottom: 8 },
  subtitle: {
    color: "#64748B",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 2,
  },
  bottom: {
    position: "absolute",
    bottom: 56,
    alignItems: "center",
    gap: 18,
  },
  dots: { flexDirection: "row", gap: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#3B82F6" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  pillText: { color: "#94A3B8", fontSize: 12, fontWeight: "500" },
});
