import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { validatePassword } from "@/lib/validation";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type UpdateResponse = { message?: string; password_updated_at?: string };

function PasswordField({
  label,
  value,
  onChangeText,
  placeholder,
}: {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.inputShell}>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#71839C"
          secureTextEntry={!visible}
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          style={styles.input}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={visible ? "Hide password" : "Show password"}
          hitSlop={10}
          onPress={() => setVisible((current) => !current)}
        >
          <Ionicons
            name={visible ? "eye-outline" : "eye-off-outline"}
            color="#7D90A8"
            size={18}
          />
        </Pressable>
      </View>
    </View>
  );
}

export default function ChangePassword() {
  const { email, refreshUserInfo, signOut, userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const strength = useMemo(() => {
    if (!newPassword) return { label: "Empty", value: 0, color: "#3B4B61" };
    const score = [
      newPassword.length >= 8,
      /[A-Z]/.test(newPassword),
      /\d/.test(newPassword),
      /[^A-Za-z0-9]/.test(newPassword),
    ].filter(Boolean).length;
    if (score <= 1) return { label: "Weak", value: 1, color: "#F87171" };
    if (score <= 3) return { label: "Medium", value: 2, color: "#F8A234" };
    return { label: "Strong", value: 3, color: "#48D8A0" };
  }, [newPassword]);

  async function updatePassword() {
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError("Complete all password fields to continue.");
      return;
    }
    const passwordValidationError = validatePassword(newPassword);
    if (passwordValidationError) {
      setError(passwordValidationError);
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    if (!email) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const user = userInfo ?? (await refreshUserInfo());
      if (!user) {
        setError("We couldn't load your account. Please try again.");
        return;
      }

      const result = await api<UpdateResponse>("/dashboard/me", {
        method: "PATCH",
        body: JSON.stringify({ old: oldPassword, new: newPassword }),
      });
      await signOut();

      router.replace({
        pathname: "/success",
        params: {
          title: "Password Updated",
          message:
            result.message || "Your password has been updated. Sign in with your new password.",
          continueTo: "/(auth)/login",
          primaryLabel: "Sign In",
        },
      });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Unable to update your password. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      keyboardShouldPersistTaps="handled"
    >
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="chevron-back" size={20} color="#97B5F7" />
        <Text style={styles.backText}>Settings</Text>
      </Pressable>

      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Ionicons name="lock-closed-outline" size={27} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Change Password</Text>
        <Text style={styles.subtitle}>
          Ensure your account stays protected with a secure, unique password.
        </Text>
      </View>

      <View style={styles.formCard}>
        <PasswordField
          label="CURRENT PASSWORD"
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="Enter current password"
        />
        <PasswordField
          label="NEW PASSWORD"
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="Enter new password"
        />
        <View style={styles.strengthRow}>
          <View style={styles.strengthBars}>
            {[1, 2, 3].map((bar) => (
              <View
                key={bar}
                style={[
                  styles.strengthBar,
                  bar <= strength.value && { backgroundColor: strength.color },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.strengthText, { color: strength.color }]}>
            STRENGTH: {strength.label.toUpperCase()}
          </Text>
        </View>
        <PasswordField
          label="CONFIRM NEW PASSWORD"
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Repeat new password"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={submitting}
          style={({ pressed }) => [
            styles.submit,
            (pressed || submitting) && styles.submitPressed,
          ]}
          onPress={() => void updatePassword()}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={16} color="#FFFFFF" />
              <Text style={styles.submitText}>Update Password</Text>
            </>
          )}
        </Pressable>
      </View>

      <View style={styles.notice}>
        <Ionicons name="information-circle-outline" size={17} color="#67E8D5" />
        <Text style={styles.noticeText}>
          Changing your password will sign you out of all other active sessions
          on your mobile and desktop devices.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#071A30" },
  content: { paddingHorizontal: 16, paddingBottom: 32 },
  back: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    minHeight: 32,
  },
  backText: { color: "#97B5F7", fontSize: 13, fontWeight: "600" },
  hero: { alignItems: "center", marginTop: 16, paddingHorizontal: 24 },
  heroIcon: {
    width: 54,
    height: 54,
    borderRadius: 13,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2563EB",
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 5,
  },
  title: { color: "#FFFFFF", fontSize: 21, fontWeight: "800", marginTop: 12 },
  subtitle: {
    color: "#7F95AE",
    fontSize: 11,
    lineHeight: 16,
    textAlign: "center",
    marginTop: 7,
  },
  formCard: {
    backgroundColor: "#102A47",
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#244664",
    padding: 14,
    marginTop: 16,
  },
  fieldGroup: { marginTop: 10 },
  fieldLabel: {
    color: "#D4E2F1",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.35,
    marginBottom: 6,
  },
  inputShell: {
    height: 42,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0A1F38",
    borderWidth: 1,
    borderColor: "#254764",
    borderRadius: 6,
    paddingLeft: 11,
    paddingRight: 10,
  },
  input: { color: "#FFFFFF", fontSize: 12, flex: 1, height: "100%" },
  strengthRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 10,
  },
  strengthBars: { flex: 1, flexDirection: "row", gap: 4, marginRight: 12 },
  strengthBar: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#29435E",
  },
  strengthText: { fontSize: 8, fontWeight: "800", letterSpacing: 0.3 },
  error: {
    color: "#FCA5A5",
    fontSize: 11,
    lineHeight: 15,
    textAlign: "center",
    marginTop: 12,
  },
  submit: {
    height: 44,
    borderRadius: 7,
    marginTop: 16,
    backgroundColor: "#075DE8",
    flexDirection: "row",
    gap: 7,
    alignItems: "center",
    justifyContent: "center",
  },
  submitPressed: { opacity: 0.72 },
  submitText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  notice: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#0A3A4A",
    borderWidth: 1,
    borderColor: "#116275",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  noticeText: { color: "#D5FAF3", fontSize: 10, lineHeight: 13, flex: 1 },
});
