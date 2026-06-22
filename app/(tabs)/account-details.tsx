import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

function stringValue(value: unknown, fallback = "Not provided") {
  return typeof value === "string" && value.trim() ? value : fallback;
}

function DetailField({
  label,
  icon,
  value,
  multiline = false,
  isDisabled = false,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
  value: string;
  multiline?: boolean;
  isDisabled?: boolean;
}) {
  return (
    <View style={[styles.fieldGroup, isDisabled && styles.fieldDisabled]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.field, multiline && styles.multilineField]}>
        <Ionicons name={icon} size={16} color="#8DA9C7" />
        <Text style={styles.fieldValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function AccountDetails() {
  const { email, userInfo } = useAuth();

  const insets = useSafeAreaInsets();
  const name = stringValue(
    userInfo?.name,
    email?.split("@")[0] || "Account holder",
  );
  const accountType = stringValue(
    userInfo?.accountType ?? userInfo?.account_type,
  );
  const kycStatus = stringValue(
    userInfo?.kycStatus ?? userInfo?.kyc_status,
    "Verified",
  );

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
    >
      <Pressable style={styles.back} onPress={() => router.back()} hitSlop={10}>
        <Ionicons name="chevron-back" size={20} color="#97B5F7" />
        <Text style={styles.backText}>Settings</Text>
      </Pressable>

      <View style={styles.profileHero}>
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={36} color="#C2DAFF" />
          </View>
        </View>
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark" size={13} color="#FFFFFF" />
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.membership}>
          {accountType === "Not provided" ? "Optima member" : accountType}
        </Text>
      </View>

      <DetailField
        label="ACCOUNT NUMBER"
        icon="card-outline"
        value={userInfo?.account_no || "Not provided"}
      />
      <DetailField label="FULL NAME" icon="person-outline" value={name} />
      <DetailField
        label="EMAIL ADDRESS"
        icon="mail-outline"
        value={stringValue(userInfo?.email, email || "Not provided")}
      />
      <DetailField
        label="PHONE NUMBER"
        icon="phone-portrait-outline"
        value={stringValue(userInfo?.phone ?? userInfo?.phoneNumber)}
      />
      <DetailField
        label="RESIDENTIAL ADDRESS"
        icon="location-outline"
        value={stringValue(userInfo?.address ?? userInfo?.residentialAddress)}
        multiline
      />

      <View style={styles.statusRow}>
        <View style={[styles.statusCard, styles.kycCard]}>
          <Text style={styles.statusLabel}>KYC Status</Text>
          <View style={styles.statusValueRow}>
            <Ionicons name="checkmark-circle" size={14} color="#4DE1B7" />
            <Text style={styles.kycValue}>{kycStatus}</Text>
          </View>
        </View>
        <View style={[styles.statusCard, styles.accountTypeCard]}>
          <Text style={styles.statusLabel}>Account Type</Text>
          <View style={styles.statusValueRow}>
            <Ionicons name="star" size={13} color="#A9C7FF" />
            <Text style={styles.accountTypeValue}>{accountType}</Text>
          </View>
        </View>
      </View>

      <View style={styles.noteRow}>
        <Ionicons name="information-circle-outline" size={14} color="#8FA5C0" />
        <Text style={styles.noteText}>
          For update details please visit{" "}
          <Text
            style={styles.noteLink}
            onPress={() => Linking.openURL("https://optima-bank.arihantjain.cv")}
          >
            optima-bank.arihantjain.cv
          </Text>
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
    minHeight: 32,
    gap: 2,
  },
  fieldDisabled: { opacity: 0.5 },
  backText: { color: "#97B5F7", fontSize: 13, fontWeight: "600" },
  profileHero: { alignItems: "center", marginTop: 12, marginBottom: 20 },
  avatarRing: {
    width: 58,
    height: 58,
    borderRadius: 29,
    borderWidth: 1,
    borderColor: "#2F7BE5",
    padding: 3,
  },
  avatar: {
    flex: 1,
    borderRadius: 26,
    backgroundColor: "#173556",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1266EA",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -18,
    marginLeft: 43,
    borderWidth: 2,
    borderColor: "#071A30",
  },
  name: { color: "#F8FAFC", fontSize: 17, fontWeight: "800", marginTop: 8 },
  membership: { color: "#8FA5C0", fontSize: 11, marginTop: 3 },
  fieldGroup: { marginTop: 12 },
  fieldLabel: {
    color: "#B8C9DC",
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 0.45,
    marginBottom: 6,
  },

  field: {
    minHeight: 42,
    borderRadius: 7,
    backgroundColor: "#182F4A",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
  },
  multilineField: { minHeight: 65, alignItems: "flex-start", paddingTop: 12 },
  fieldValue: { color: "#F2F7FE", fontSize: 12, lineHeight: 17, flex: 1 },
  statusRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  statusCard: { flex: 1, minHeight: 61, borderRadius: 7, padding: 10 },
  kycCard: {
    backgroundColor: "#0A3A43",
    borderWidth: 1,
    borderColor: "#116772",
  },
  accountTypeCard: {
    backgroundColor: "#102F61",
    borderWidth: 1,
    borderColor: "#2868B3",
  },
  statusLabel: { color: "#A9BDCF", fontSize: 9, fontWeight: "700" },
  statusValueRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
    marginTop: 7,
  },
  kycValue: { color: "#4DE1B7", fontSize: 11, fontWeight: "800" },
  accountTypeValue: {
    color: "#D5E3FF",
    fontSize: 11,
    fontWeight: "800",
    flex: 1,
  },
  noteRow: { flexDirection: "row", gap: 6, marginTop: 18, alignItems: "flex-start" },
  noteText: { color: "#8FA5C0", fontSize: 11, lineHeight: 16, flex: 1 },
  noteLink: { color: "#97B5F7", fontWeight: "700" },
});
