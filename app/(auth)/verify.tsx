import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const BLUE = "#2563EB";
const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const RED = "#EF4444";

const CODE_LENGTH = 4;
const CELLS = Array.from({ length: CODE_LENGTH });

export default function Verify() {
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { email, preAuthToken } = useLocalSearchParams<{
    email: string;
    preAuthToken: string;
  }>();

  // Send the OTP. The MFA route is protected, so we authorize it with the
  // provisional token from login (it isn't in secure-store yet).
  useEffect(() => {
    console.log("email", email, "preAuthToken", preAuthToken);
    if (!email || !preAuthToken) return;
    (async () => {
      try {
        await api(`/mfa/${encodeURIComponent(email)}`, {
          method: "GET",
          headers: { Authorization: `Bearer ${preAuthToken}` },
        });
      } catch (e) {
        console.error("mfa init", e);
      }
    })();
  }, [email, preAuthToken]);

  async function onVerify(value: string) {
    setVerifying(true);
    setError(null);
    try {
      // The pre-auth `token` authorizes this call; the response carries the
      // real session token, which is what we commit.
      const res = await api<{ token: string }>(
        `/mfa/${encodeURIComponent(email)}`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${preAuthToken}` },
          body: JSON.stringify({ otp: value }),
        },
      );

      await signIn(res.token); // commit the session token -> guard -> dashboard
    } catch {
      setError("That code didn't match. Try again.");
      setCode("");
      setVerifying(false);
    }
  }

  // Auto-submit the moment all 6 digits are entered.
  useEffect(() => {
    if (code.length === CODE_LENGTH) onVerify(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [code]);

  return (
    <KeyboardAvoidingView
      style={[styles.fill, { paddingTop: insets.top + 8 }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color={TEXT} />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.tile}>
          <Ionicons name="shield-checkmark" size={28} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Verify it&apos;s you</Text>
        <Text style={styles.subtitle}>
          Enter the 4-digit code we sent to your registered device.
        </Text>

        {/* One real input, six visual cells derived from its value. */}
        <Pressable
          style={styles.codeWrap}
          onPress={() => inputRef.current?.focus()}
        >
          <View style={styles.cells}>
            {CELLS.map((_, i) => {
              const filled = i < code.length;
              const active = i === code.length && !verifying;
              return (
                <View
                  key={i}
                  style={[
                    styles.cell,
                    filled && styles.cellFilled,
                    active && styles.cellActive,
                    error && styles.cellError,
                  ]}
                >
                  <Text style={styles.cellText}>{code[i] ?? ""}</Text>
                </View>
              );
            })}
          </View>
          <TextInput
            ref={inputRef}
            value={code}
            onChangeText={(t) =>
              setCode(t.replace(/[^0-9]/g, "").slice(0, CODE_LENGTH))
            }
            keyboardType="number-pad"
            maxLength={CODE_LENGTH}
            autoFocus
            editable={!verifying}
            caretHidden
            // invisible but on top, so taps anywhere on the cells focus it
            style={[StyleSheet.absoluteFill, { opacity: 0 }]}
          />
        </Pressable>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <View style={styles.status}>
          {verifying ? (
            <ActivityIndicator color={BLUE} />
          ) : (
            <Pressable
              onPress={() => {
                /* TODO: resend code endpoint */
              }}
              hitSlop={8}
            >
              <Text style={styles.resend}>
                Didn&apos;t get a code?{" "}
                <Text style={styles.resendLink}>Resend</Text>
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A", paddingHorizontal: 24 },
  back: { paddingVertical: 8 },
  body: { flex: 1, alignItems: "center", paddingTop: 40 },

  tile: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  title: { color: TEXT, fontSize: 22, fontWeight: "800" },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },

  codeWrap: { marginTop: 32, width: "100%" },
  cells: { flexDirection: "row", justifyContent: "space-between" },
  cell: {
    width: 48,
    height: 58,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cellFilled: { borderColor: "rgba(255,255,255,0.25)" },
  cellActive: { borderColor: BLUE },
  cellError: { borderColor: RED },
  cellText: { color: TEXT, fontSize: 24, fontWeight: "700" },

  errorText: { color: RED, fontSize: 13, marginTop: 14 },
  status: { marginTop: 28, height: 24, justifyContent: "center" },
  resend: { color: MUTED, fontSize: 14 },
  resendLink: { color: "#60A5FA", fontWeight: "700" },
});
