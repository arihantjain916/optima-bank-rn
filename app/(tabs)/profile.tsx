import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { getUserPreference, setUserPreference } from "@/lib/storage";
import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
} from "expo-local-authentication";
import { router } from "expo-router";

const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  subtitle: string;
  toggle?: boolean;
  value?: boolean;
  onValueChange?: (value: boolean) => void;
  disabled?: boolean;
  onPress?: () => void;
};

function SettingRow({
  icon,
  title,
  subtitle,
  toggle,
  value,
  onValueChange,
  disabled,
  onPress,
}: RowProps) {
  return (
    <Pressable
      style={({ pressed }) => [
        styles.row,
        pressed && onPress && styles.rowPressed,
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.rowIcon}>
        <Ionicons name={icon} size={19} color="#93C5FD" />
      </View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowSub}>{subtitle}</Text>
      </View>
      {toggle ? (
        <Switch
          value={value}
          onValueChange={onValueChange}
          disabled={disabled}
          trackColor={{ false: "#334155", true: "#2563EB" }}
          thumbColor="#F8FAFC"
        />
      ) : (
        <Ionicons name="chevron-forward" size={18} color="#64748B" />
      )}
    </Pressable>
  );
}

export default function Profile() {
  const { email, signOut, userInfo } = useAuth();
  const [biometrics, setBiometrics] = useState(
    Boolean(getUserPreference("biometrics")),
  );
  const [notifications, setNotifications] = useState(
    Boolean(getUserPreference("notifications")),
  );
  const [darkMode, setDarkMode] = useState(
    Boolean(getUserPreference("darkMode")),
  );
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [preferenceError, setPreferenceError] = useState<string | null>(null);
  const name = email?.split("@")[0].replace(/[._-]/g, " ") || "John Doe";
  const displayName = name.replace(/\b\w/g, (letter) => letter.toUpperCase());

  useEffect(() => {
    async function loadPreferences() {
      const [biometrics, notifications, darkMode] = await Promise.all([
        getUserPreference("biometrics"),
        getUserPreference("notifications"),
        getUserPreference("darkMode"),
      ]);

      setBiometrics(biometrics === "true");
      setNotifications(notifications !== "false");
      setDarkMode(darkMode !== "light");
    }

    void loadPreferences();
  }, []);

  async function savePreferences(next: {
    biometrics: boolean;
    notifications: boolean;
    darkMode: boolean;
  }) {
    setSavingPreferences(true);
    setPreferenceError(null);
    try {
      await api("/preferences", {
        method: "PATCH",
        body: JSON.stringify({
          pushNotifications: next.notifications,
          biometricsEnabled: next.biometrics,
          theme: next.darkMode ? "dark" : "light",
        }),
      });

      setUserPreference("biometrics", next.biometrics.toString());
      setUserPreference("notifications", next.notifications.toString());
      setUserPreference("darkMode", next.darkMode.toString());
    } catch {
      setBiometrics(biometrics);
      setNotifications(notifications);
      setDarkMode(darkMode);
      setPreferenceError("Couldn't save your preferences. Please try again.");
    } finally {
      setSavingPreferences(false);
    }
  }

  async function changeBiometrics(nextValue: boolean) {
    if (nextValue) {
      const available = (await hasHardwareAsync()) && (await isEnrolledAsync());
      if (!available) {
        setPreferenceError(
          "Set up Face ID or Fingerprint on this device first.",
        );
        return;
      }

      const result = await authenticateAsync();
      if (!result.success) {
        setPreferenceError("Biometric verification was not completed.");
        return;
      }
    }

    setBiometrics(nextValue);
    void savePreferences({
      biometrics: nextValue,
      notifications,
      darkMode,
    });
  }

  function changeNotifications(nextValue: boolean) {
    setNotifications(nextValue);
    void savePreferences({
      biometrics,
      notifications: nextValue,
      darkMode,
    });
  }

  function changeTheme(nextValue: boolean) {
    setDarkMode(nextValue);
    void savePreferences({
      biometrics,
      notifications,
      darkMode: nextValue,
    });
  }

  function formatDate(date?: string) {
    if (!date) return "not yet changed";
    const parsed = new Date(date);
    if (Number.isNaN(parsed.getTime())) return "not yet changed";

    const minutes = Math.max(0, Math.floor((Date.now() - parsed.getTime()) / 60000));
    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes} min ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} ${days === 1 ? "day" : "days"} ago`;

    const months = Math.floor(days / 30);
    if (months < 12) return `${months} ${months === 1 ? "month" : "months"} ago`;

    const years = Math.floor(months / 12);
    return `${years} ${years === 1 ? "year" : "years"} ago`;
  }

  return (
    <ScrollView style={styles.fill} contentContainerStyle={styles.content}>
      <View style={styles.profileHero}>
        <View style={styles.avatar}>
          <Ionicons name="person" size={43} color="#93C5FD" />
        </View>
        <View style={styles.editBadge}>
          <Ionicons name="pencil" size={14} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.email}>{email ?? "john.doe@optimabank.com"}</Text>
      </View>

      <Text style={styles.section}>PERSONAL INFO</Text>
      <View style={styles.group}>
        <SettingRow
          icon="person-outline"
          title="Account Details"
          subtitle="Edit your personal information"
          onPress={() => router.push("/account-details")}
        />
      </View>

      <Text style={styles.section}>SECURITY</Text>
      <View style={styles.group}>
        <SettingRow
          icon="lock-closed-outline"
          title="Change Password"
          subtitle={`Last changed ${formatDate(userInfo?.password_updated_at)}`}
          onPress={() => router.push("/change-password")}
        />
        <SettingRow
          icon="finger-print-outline"
          title="Biometrics"
          subtitle="Use Face ID or Fingerprint"
          toggle
          value={biometrics}
          onValueChange={changeBiometrics}
          disabled={savingPreferences}
        />
        <SettingRow
          icon="keypad-outline"
          title="Set PIN"
          subtitle="Configure quick access code"
        />
      </View>

      <Text style={styles.section}>PREFERENCES</Text>
      <View style={styles.group}>
        <SettingRow
          icon="notifications-outline"
          title="Push Notifications"
          subtitle="Alerts for transactions & news"
          toggle
          value={notifications}
          onValueChange={changeNotifications}
          disabled={savingPreferences}
        />
        <SettingRow
          icon="moon-outline"
          title="Dark Mode"
          subtitle="Toggle theme preference"
          toggle
          value={darkMode}
          onValueChange={changeTheme}
          disabled={savingPreferences}
        />
      </View>

      {preferenceError ? (
        <Text style={styles.preferenceError}>{preferenceError}</Text>
      ) : null}

      <Text style={styles.section}>SUPPORT</Text>
      <View style={styles.group}>
        <SettingRow
          icon="help-circle-outline"
          title="Help & Support"
          subtitle="FAQs and customer service"
        />
      </View>

      <Pressable style={styles.logout} onPress={signOut}>
        <Ionicons name="log-out-outline" size={18} color="#F87171" />
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },
  content: { padding: 16, paddingTop: 18, paddingBottom: 32 },
  profileHero: { alignItems: "center", marginBottom: 20 },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#132640",
    borderWidth: 2,
    borderColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  editBadge: {
    width: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: "#0758D9",
    borderWidth: 2,
    borderColor: "#0A0E1A",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -24,
    marginLeft: 58,
  },
  name: { color: TEXT, fontSize: 18, fontWeight: "800", marginTop: 7 },
  email: { color: "#60A5FA", fontSize: 12, marginTop: 4 },
  section: {
    color: "#93C5FD",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
    marginTop: 15,
    marginBottom: 6,
  },
  group: { borderRadius: 9, overflow: "hidden", backgroundColor: "#15263D" },
  row: {
    minHeight: 62,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(148,163,184,0.08)",
  },
  rowPressed: { opacity: 0.72 },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 6,
    backgroundColor: "#12305A",
    alignItems: "center",
    justifyContent: "center",
  },
  rowCopy: { flex: 1 },
  rowTitle: { color: TEXT, fontSize: 13, fontWeight: "800" },
  rowSub: { color: MUTED, fontSize: 10, marginTop: 2 },
  preferenceError: {
    color: "#F87171",
    fontSize: 11,
    marginTop: 9,
    textAlign: "center",
  },
  logout: {
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(239,68,68,0.12)",
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 28,
  },
  logoutText: { color: "#F87171", fontSize: 12, fontWeight: "800" },
});
