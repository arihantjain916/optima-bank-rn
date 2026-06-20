import { api } from "@/lib/api";
import { FontAwesome, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE = "#2563EB";
const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const RED = "#EF4444";

export default function Login() {
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function onSignIn() {
    try {
      const res = await api<{ token: string }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      console.log("res", res);
      router.push({
        pathname: "/verify",
        params: { email, preAuthToken: res.token },
      });
    } catch (e: any) {
      console.error(e);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brandTile}>
          <FontAwesome name="university" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.brand}>Optima Bank</Text>
        <Text style={styles.tagline}>
          Enter your credentials to access your vault.
        </Text>

        {/* Card */}
        <View style={styles.card}>
          {/* Email */}
          <Text style={styles.label}>EMAIL ADDRESS</Text>
          <View style={styles.inputRow}>
            <Ionicons name="mail-outline" size={18} color={MUTED} />
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="alex.vanguard@optimabank.com"
              placeholderTextColor={MUTED}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          {/* Password */}
          <View style={styles.labelRow}>
            <Text style={styles.label}>PASSWORD</Text>
            <Pressable
              onPress={() => {
                /* TODO: forgot-password flow */
              }}
            >
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>
          </View>
          <View style={[styles.inputRow, error && styles.inputRowError]}>
            <Ionicons
              name="lock-closed-outline"
              size={18}
              color={error ? RED : MUTED}
            />
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={(t) => {
                setPassword(t);
                if (error) setError(null); // clear error as the user retypes
              }}
              placeholder="••••••••"
              placeholderTextColor={MUTED}
              secureTextEntry={!showPw}
              autoCapitalize="none"
            />
            <Pressable onPress={() => setShowPw((s) => !s)} hitSlop={8}>
              <Ionicons
                name={showPw ? "eye-off-outline" : "eye-outline"}
                size={18}
                color={MUTED}
              />
            </Pressable>
          </View>
          {error && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={14} color={RED} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {/* Remember me */}
          <View style={styles.rememberRow}>
            <Switch
              value={remember}
              onValueChange={setRemember}
              trackColor={{ false: "#334155", true: BLUE }}
              thumbColor="#FFFFFF"
            />
            <Text style={styles.rememberText}>Remember me</Text>
          </View>

          {/* Sign in + biometric */}
          <View style={styles.actionRow}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                pressed && styles.pressed,
              ]}
              onPress={onSignIn}
            >
              <Text style={styles.primaryText}>Sign In</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.bioBtn,
                pressed && styles.pressed,
              ]}
              onPress={() => {
                /* TODO: expo-local-authentication */
              }}
            >
              <Ionicons name="finger-print" size={22} color={TEXT} />
            </Pressable>
          </View>

          {/* Switch to register */}
          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>Don&apos;t have an account? </Text>
            <Pressable onPress={() => router.push("/register")}>
              <Text style={styles.switchLink}>Open Account</Text>
            </Pressable>
          </View>
        </View>

        {/* Trust badges */}
        <View style={styles.badges}>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark-outline" size={13} color={MUTED} />
            <Text style={styles.badgeText}>256-bit AES</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="globe-outline" size={13} color={MUTED} />
            <Text style={styles.badgeText}>FDIC Insured</Text>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },
  scroll: { paddingHorizontal: 24, alignItems: "center" },

  brandTile: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  brand: { color: "#60A5FA", fontSize: 22, fontWeight: "800" },
  tagline: {
    color: MUTED,
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24,
    textAlign: "center",
  },

  card: {
    width: "100%",
    borderRadius: 18,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 6,
  },
  label: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 10,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  forgot: { color: "#60A5FA", fontSize: 12, fontWeight: "600", marginTop: 10 },

  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginTop: 6,
  },
  inputRowError: { borderColor: RED },
  input: { flex: 1, color: TEXT, fontSize: 15, height: "100%" },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  errorText: { color: RED, fontSize: 12 },

  rememberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  rememberText: { color: MUTED, fontSize: 14 },

  actionRow: { flexDirection: "row", gap: 12, marginTop: 18 },
  primaryBtn: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  bioBtn: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  pressed: { opacity: 0.85 },

  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 22 },
  switchMuted: { color: MUTED, fontSize: 13 },
  switchLink: { color: "#60A5FA", fontSize: 13, fontWeight: "700" },

  badges: { flexDirection: "row", gap: 24, marginTop: 28 },
  badge: { flexDirection: "row", alignItems: "center", gap: 6 },
  badgeText: { color: MUTED, fontSize: 12 },
});
