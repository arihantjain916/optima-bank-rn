import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const RED = "#EF4444";

type Dashboard = {
  name: string;
  email: string;
  account_no: string;
  id: string;
  openingBalance: number;
  currentBalance: number;
  sentTransaction: unknown[];
  receivedTransaction: unknown[];
};

const ACTIONS = [
  { icon: "paper-plane", label: "Send", href: "/send" },
  { icon: "card", label: "My Card", href: "/card" },
  { icon: "stats-chart", label: "Stats", href: "/analytics" },
  { icon: "ellipsis-horizontal", label: "More", href: "/profile" },
] as const;

function money(n: number) {
  const [int, dec] = Math.abs(n).toFixed(2).split(".");
  const grouped = int.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return `₹${grouped}.${dec}`;
}

export default function Dashboard() {
  const { email } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lives in a callback so both the initial effect and pull-to-refresh
  // can reuse it. NOTE: the component itself must NOT be async.
  const load = useCallback(async () => {
    if (!email) return;
    try {
      setError(null);
      const res = await api<{ data: Dashboard }>(
        `/dashboard/${encodeURIComponent(email)}`,
      );
      setData(res.data);
    } catch {
      setError("Couldn't load your dashboard.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const last4 = data?.account_no;
  const txCount =
    (data?.sentTransaction.length ?? 0) +
    (data?.receivedTransaction.length ?? 0);

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{
        padding: 20,
        paddingTop: 20,
        paddingBottom: 32,
      }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#60A5FA"
        />
      }
    >
      {/* Account card */}
      <LinearGradient
        colors={["#2563EB", "#1D4ED8"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.accountCard}
      >
        <View style={styles.accountTop}>
          <Text style={styles.accountLabel}>PRIMARY ACCOUNT</Text>
          <Ionicons
            name="card-outline"
            size={20}
            color="rgba(255,255,255,0.9)"
          />
        </View>
        <Text style={styles.balance}>
          {loading
            ? "…"
            : hideBalance
              ? "₹ • • • • • •"
              : money(data?.currentBalance ?? 0)}
        </Text>
        <View style={styles.accountBottom}>
          <Text style={styles.account}>{data?.account_no}</Text>
          <Pressable onPress={() => setHideBalance((h) => !h)} hitSlop={8}>
            <Ionicons
              name={hideBalance ? "eye-off" : "eye"}
              size={18}
              color="rgba(255,255,255,0.9)"
            />
          </Pressable>
        </View>
      </LinearGradient>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Quick actions */}
      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <Pressable
            key={a.label}
            style={styles.action}
            onPress={() => router.push(a.href)}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon} size={20} color="#FFFFFF" />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Recent transactions */}
      <View style={styles.sectionRow}>
        <Text style={styles.section}>Recent Transactions</Text>
        <Pressable hitSlop={8}>
          <Text style={styles.viewAll}>View All</Text>
        </Pressable>
      </View>

      <View style={styles.txCard}>
        {loading ? (
          [0, 1, 2].map((i) => (
            <View key={`skel-${i}`} style={styles.txRow}>
              <View style={[styles.txAvatar, styles.skel]} />
              <View style={{ flex: 1, gap: 8 }}>
                <View style={[styles.skel, { height: 12, width: "55%" }]} />
                <View style={[styles.skel, { height: 10, width: "35%" }]} />
              </View>
            </View>
          ))
        ) : txCount === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          // TODO: render rows once we know the sent/received transaction shape.
          <Text style={styles.empty}>{txCount} transactions</Text>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },

  accountCard: { borderRadius: 20, padding: 20, marginTop: 20, gap: 14 },
  accountTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  accountLabel: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  balance: { color: "#FFFFFF", fontSize: 32, fontWeight: "800" },
  accountBottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  account: { color: "rgba(255,255,255,0.9)", fontSize: 15, letterSpacing: 2 },

  error: { color: RED, fontSize: 13, marginTop: 12 },

  actions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 24,
  },
  action: { alignItems: "center", gap: 8, flex: 1 },
  actionIcon: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "#2563EB",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: { color: MUTED, fontSize: 12, fontWeight: "600" },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 28,
    marginBottom: 12,
  },
  section: { color: TEXT, fontSize: 17, fontWeight: "800" },
  viewAll: { color: "#60A5FA", fontSize: 13, fontWeight: "700" },

  txCard: {
    borderRadius: 18,
    padding: 8,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  txRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 12 },
  txAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  empty: { color: MUTED, fontSize: 14, padding: 16, textAlign: "center" },

  skel: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6 },
});
