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
};

type Transaction = {
  id: string;
  date: string;
  amount: number | string;
  type: string;
  acc_no: string;
  method: string;
};

function asTransactions(value: unknown): Transaction[] {
  if (Array.isArray(value)) return value as Transaction[];
  const data = (value as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as Transaction[]) : [];
}

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

function transactionDate(value: string) {
  const date = new Date(value);
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  return sameDay
    ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : date.toLocaleDateString([], {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

export default function Dashboard() {
  const { refreshUserInfo, userInfo } = useAuth();
  const [hideBalance, setHideBalance] = useState(false);
  const [data, setData] = useState<Dashboard | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch lives in a callback so both the initial effect and pull-to-refresh
  // can reuse it. NOTE: the component itself must NOT be async.
  const load = useCallback(
    async (force = false) => {
      try {
        setError(null);
        const dashboard = force
          ? await refreshUserInfo(true)
          : (userInfo ?? (await refreshUserInfo()));
        if (!dashboard) throw new Error("Missing dashboard data");
        setData(dashboard as Dashboard);
        const recent = await api<unknown>(
          `/transaction/recent/${encodeURIComponent(dashboard.id)}`,
        );
        setRecentTransactions(asTransactions(recent).slice(0, 5));
      } catch {
        setError("Couldn't load your dashboard.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [refreshUserInfo, userInfo],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

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
        ) : recentTransactions.length === 0 ? (
          <Text style={styles.empty}>No transactions yet.</Text>
        ) : (
          recentTransactions.map((tx) => {
            const outgoing = tx.method.toUpperCase() === "DEBIT";
            const suffix = tx.acc_no?.slice(-4) || "0000";

            return (
              <View key={tx.id} style={styles.txRow}>
                <View
                  style={[
                    styles.txAvatar,
                    outgoing ? styles.txDebit : styles.txCredit,
                  ]}
                >
                  <View style={styles.txIconCenter}>
                    <Ionicons
                      name={outgoing ? "arrow-up" : "arrow-down"}
                      size={19}
                      color={outgoing ? "#F87171" : "#34D399"}
                    />
                  </View>
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txTitle} numberOfLines={1}>
                    {outgoing ? "Transfer to" : "Transfer from"} •••• {suffix}
                  </Text>
                  <Text style={styles.txMeta}>
                    {tx.type} · {transactionDate(tx.date)}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    outgoing ? styles.txAmountDebit : styles.txAmountCredit,
                  ]}
                >
                  {outgoing ? "−" : "+"}
                  {money(Number(tx.amount || 0))}
                </Text>
              </View>
            );
          })
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
  txDebit: { backgroundColor: "rgba(248,113,113,0.12)" },
  txCredit: { backgroundColor: "rgba(52,211,153,0.13)" },
  txIconCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1, minWidth: 0 },
  txTitle: { color: TEXT, fontSize: 14, fontWeight: "700" },
  txMeta: { color: MUTED, fontSize: 11, marginTop: 3 },
  txAmount: { fontSize: 14, fontWeight: "800" },
  txAmountDebit: { color: "#F87171" },
  txAmountCredit: { color: "#34D399" },
  empty: { color: MUTED, fontSize: 14, padding: 16, textAlign: "center" },

  skel: { backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6 },
});
