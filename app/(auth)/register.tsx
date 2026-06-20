import { api } from "@/lib/api";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE = "#2563EB";
const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";

// Tiny password-strength heuristic → drives the meter under the field.
function getStrength(pw: string): {
  label: string;
  color: string;
  ratio: number;
} {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  if (!pw) return { label: "", color: "#334155", ratio: 0 };
  if (score <= 1) return { label: "WEAK", color: "#EF4444", ratio: 0.33 };
  if (score <= 3) return { label: "MEDIUM", color: "#F59E0B", ratio: 0.66 };
  return { label: "STRONG", color: "#22C55E", ratio: 1 };
}

export default function Register() {
  const insets = useSafeAreaInsets();
  const [firstName, setFullName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  const strength = useMemo(() => getStrength(password), [password]);

  async function onCreate() {
    if (password !== confirm) {
      alert("Passwords do not match");
      return;
    }

    try {
      const payload = {
        email,
        password,
        name: `${firstName} ${lastName}`.trim(),
      };
      const res = await api("/auth/register", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push({ pathname: "/login" });
    } catch (e: any) {
      console.error("e", e);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Top bar: back + centered brand */}
      <View style={[styles.topbar, { paddingTop: insets.top + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.back}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </Pressable>
        <Text style={styles.topbarTitle}>Optima Bank</Text>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>
            Join the gold standard in institutional finance.
          </Text>

          <TextField
            label="FULL NAME"
            value={firstName}
            onChangeText={setFullName}
            placeholder="Johnathan"
            autoCapitalize="words"
          />

          <TextField
            label="LAST NAME"
            value={lastName}
            onChangeText={setLastName}
            placeholder="Doe"
            autoCapitalize="words"
          />

          <TextField
            label="EMAIL ADDRESS"
            value={email}
            onChangeText={setEmail}
            placeholder="j.doe@institutional.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          {/* Password + strength meter */}
          <Text style={styles.label}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={MUTED}
            secureTextEntry
            autoCapitalize="none"
          />
          {!!password && (
            <View style={styles.meterRow}>
              <View style={styles.meterTrack}>
                <View
                  style={[
                    styles.meterFill,
                    {
                      width: `${strength.ratio * 100}%`,
                      backgroundColor: strength.color,
                    },
                  ]}
                />
              </View>
              <Text style={[styles.meterLabel, { color: strength.color }]}>
                {strength.label}
              </Text>
            </View>
          )}

          <TextField
            label="CONFIRM PASSWORD"
            value={confirm}
            onChangeText={setConfirm}
            placeholder="••••••••"
            secureTextEntry
            autoCapitalize="none"
          />

          <Pressable
            style={({ pressed }) => [
              styles.primaryBtn,
              pressed && styles.pressed,
            ]}
            onPress={onCreate}
          >
            <Text style={styles.primaryText}>Create Account</Text>
          </Pressable>

          <View style={styles.switchRow}>
            <Text style={styles.switchMuted}>Already have an account? </Text>
            <Pressable onPress={() => router.replace("/login")}>
              <Text style={styles.switchLink}>Log in</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Local helper so the four fields don't repeat the same markup.
function TextField({
  label,
  ...inputProps
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        placeholderTextColor={MUTED}
        {...inputProps}
      />
    </>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },
  topbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { position: "absolute", left: 16, bottom: 10 },
  topbarTitle: { color: "#60A5FA", fontSize: 17, fontWeight: "700" },

  scroll: { paddingHorizontal: 24, paddingTop: 8 },
  card: {
    borderRadius: 18,
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  title: { color: TEXT, fontSize: 24, fontWeight: "800" },
  subtitle: { color: MUTED, fontSize: 14, marginTop: 6, marginBottom: 8 },

  label: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
    marginTop: 18,
  },
  input: {
    height: 52,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    color: "#0A0E1A",
    fontSize: 15,
    paddingHorizontal: 14,
    marginTop: 8,
  },

  meterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 10,
  },
  meterTrack: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1E293B",
    overflow: "hidden",
  },
  meterFill: { height: "100%", borderRadius: 2 },
  meterLabel: { fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },

  primaryBtn: {
    height: 54,
    borderRadius: 12,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  pressed: { opacity: 0.85 },

  switchRow: { flexDirection: "row", justifyContent: "center", marginTop: 18 },
  switchMuted: { color: MUTED, fontSize: 13 },
  switchLink: { color: "#60A5FA", fontSize: 13, fontWeight: "700" },
});
