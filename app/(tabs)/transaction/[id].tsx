import { Ionicons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Share, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";

function money(value: string) {
  return `₹${Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function TransactionDetails() {
  const insets = useSafeAreaInsets();
  const { id, amount, type, account, date, method } = useLocalSearchParams<{
    id: string; amount: string; type: string; account: string; date: string; method: string;
  }>();
  const credit = method?.toUpperCase() === "CREDIT";
  const formattedDate = date ? new Date(date).toLocaleString() : "—";

  async function shareReceipt() {
    await Share.share({ message: `Optima Bank receipt\n${type} transfer\n${credit ? "+" : "−"}${money(amount)}\nReference: ${id}` });
  }

  return (
    <View style={styles.fill}>
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 8 }]}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} hitSlop={12}><Ionicons name="arrow-back" size={23} color="#BFDBFE" /></Pressable>
          <Text style={styles.headerTitle}>Transaction Details</Text>
          <Pressable onPress={shareReceipt} hitSlop={12}><Ionicons name="share-social-outline" size={20} color="#BFDBFE" /></Pressable>
        </View>

        <View style={styles.hero}>
          <View style={[styles.heroIcon, credit ? styles.credit : styles.debit]}><Ionicons name={credit ? "arrow-down" : "arrow-up"} size={26} color={credit ? "#34D399" : "#F87171"} /></View>
          <Text style={[styles.amount, credit ? styles.creditText : styles.debitText]}>{credit ? "+" : "−"}{money(amount)}</Text>
          <View style={[styles.status, credit ? styles.statusCredit : styles.statusDebit]}><Ionicons name="checkmark-circle-outline" size={13} color={credit ? "#34D399" : "#F87171"} /><Text style={[styles.statusText, credit ? styles.creditText : styles.debitText]}>Completed</Text></View>
        </View>

        <View style={styles.counterparty}>
          <View style={styles.party}><Text style={styles.label}>TRANSFER</Text><Text style={styles.partyValue}>{credit ? "Received from" : "Sent to"}</Text></View>
          <Ionicons name="arrow-forward" size={19} color={MUTED} />
          <View style={[styles.accountBadge, credit ? styles.credit : styles.debit]}><Text style={styles.accountBadgeText}>••{account?.slice(-2) || ""}</Text></View>
        </View>

        <View style={styles.details}>
          <Detail label="Transfer Type" value={type || "—"} />
          <Detail label="Account" value={`•••• ${account?.slice(-4) || "—"}`} />
          <Detail label="Date/Time" value={formattedDate} />
          <Detail label="Reference ID" value={id || "—"} />
          <Detail label="Payment Method" value={type || "—"} last />
        </View>

        <Pressable style={styles.primary} onPress={shareReceipt}><Ionicons name="download-outline" size={18} color="#FFFFFF" /><Text style={styles.primaryText}>Download Receipt</Text></Pressable>
        <Pressable style={styles.report}><Ionicons name="alert-circle-outline" size={18} color="#F87171" /><Text style={styles.reportText}>Report Transaction</Text></Pressable>
      </ScrollView>
    </View>
  );
}

function Detail({ label, value, last = false }: { label: string; value: string; last?: boolean }) {
  return <View style={[styles.detailRow, !last && styles.detailBorder]}><Text style={styles.detailLabel}>{label}</Text><Text style={styles.detailValue}>{value}</Text></View>;
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" }, content: { padding: 20, paddingBottom: 32 }, header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, headerTitle: { color: "#BFDBFE", fontSize: 16, fontWeight: "800" }, hero: { alignItems: "center", marginTop: 38 }, heroIcon: { width: 58, height: 58, borderRadius: 29, alignItems: "center", justifyContent: "center" }, credit: { backgroundColor: "rgba(52,211,153,0.13)" }, debit: { backgroundColor: "rgba(248,113,113,0.13)" }, amount: { color: TEXT, fontSize: 25, fontWeight: "800", marginTop: 18 }, creditText: { color: "#34D399" }, debitText: { color: "#F87171" }, status: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, marginTop: 8 }, statusCredit: { backgroundColor: "rgba(52,211,153,0.13)" }, statusDebit: { backgroundColor: "rgba(248,113,113,0.13)" }, statusText: { fontSize: 11, fontWeight: "700" }, counterparty: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 10, padding: 16, backgroundColor: "#15263D", marginTop: 28 }, party: { flex: 1 }, label: { color: MUTED, fontSize: 9, fontWeight: "800", letterSpacing: 0.8 }, partyValue: { color: TEXT, fontSize: 14, fontWeight: "700", marginTop: 5 }, accountBadge: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center", marginLeft: 16 }, accountBadgeText: { color: TEXT, fontSize: 11, fontWeight: "800" }, details: { marginTop: 18, borderRadius: 10, backgroundColor: "#15263D", paddingHorizontal: 16 }, detailRow: { minHeight: 56, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 }, detailBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(148,163,184,0.13)" }, detailLabel: { color: MUTED, fontSize: 11 }, detailValue: { color: "#CBD5E1", fontSize: 12, fontWeight: "700", flexShrink: 1, textAlign: "right" }, primary: { height: 48, borderRadius: 10, backgroundColor: "#0758D9", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 24 }, primaryText: { color: "#FFFFFF", fontSize: 13, fontWeight: "800" }, report: { height: 44, borderRadius: 9, backgroundColor: "rgba(248,113,113,0.1)", flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "center", marginTop: 10 }, reportText: { color: "#F87171", fontSize: 13, fontWeight: "800" },
});
