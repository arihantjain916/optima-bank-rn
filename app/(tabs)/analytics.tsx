import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const BLUE = "#2563EB";

const PERIODS = ["week", "month", "year"] as const;

type Period = (typeof PERIODS)[number];
type Transaction = {
  date: string;
  id: string;
  amount: number | string;
  type: string;
  acc_no: string;
  method: string;
};

type Dashboard = { id: string };

function amount(value: number) {
  return `₹${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function asTransactions(value: unknown): Transaction[] {
  if (Array.isArray(value)) return value as Transaction[];
  const data = (value as { data?: unknown })?.data;
  if (Array.isArray(data)) return data as Transaction[];
  return [];
}

function transactionDate(date: string) {
  const value = new Date(date);
  return Number.isNaN(value.getTime())
    ? date
    : value.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function Analytics() {
  const { email } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [history, setHistory] = useState<Transaction[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!email) return;
    try {
      setError(null);
      const dashboard = await api<{ data: Dashboard }>(
        `/dashboard/${encodeURIComponent(email)}`,
      );
      const userId = dashboard.data.id;
      const [historyResult, recentResult] = await Promise.all([
        api<unknown>(
          `/transaction/history/${encodeURIComponent(userId)}?period=${period}`,
        ),
        api<unknown>(`/transaction/recent/${encodeURIComponent(userId)}`),
      ]);

      console.log("historyResult", historyResult);
      setHistory(asTransactions(historyResult));
      setRecent(asTransactions(recentResult));
    } catch {
      setError("Couldn't load your spending analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [email, period]);

  useEffect(() => {
    setLoading(true);
    load();
  }, [load]);

  const summary = useMemo(() => {
    const debit = history
      .filter((tx) => tx.method.toUpperCase() === "DEBIT")
      .reduce((total, tx) => total + Number(tx.amount || 0), 0);
    const credit = history
      .filter((tx) => tx.method.toUpperCase() === "CREDIT")
      .reduce((total, tx) => total + Number(tx.amount || 0), 0);
    return { debit, credit, net: credit - debit };
  }, [history]);

  const categories = useMemo(() => {
    const grouped = new Map<string, number>();
    history
      .filter((tx) => tx.method.toUpperCase() === "DEBIT")
      .forEach((tx) =>
        grouped.set(
          tx.type,
          (grouped.get(tx.type) ?? 0) + Number(tx.amount || 0),
        ),
      );
    return [...grouped.entries()].sort(([, a], [, b]) => b - a).slice(0, 3);
  }, [history]);

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load();
          }}
          tintColor="#60A5FA"
        />
      }
    >
      <Text style={styles.kicker}>FINANCIAL INSIGHTS</Text>
      <Text style={styles.title}>Spending Analytics</Text>

      <View style={styles.periods}>
        {PERIODS.map((value) => {
          const selected = period === value;
          return (
            <Pressable
              key={value}
              style={[styles.period, selected && styles.periodSelected]}
              onPress={() => setPeriod(value)}
            >
              <Text
                style={[
                  styles.periodText,
                  selected && styles.periodTextSelected,
                ]}
              >
                {value}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color="#60A5FA" />
        </View>
      ) : (
        <>
          <View style={styles.summaryRow}>
            <View style={[styles.summaryCard, styles.spentCard]}>
              <Text style={styles.summaryLabel}>SPENT</Text>
              <Text style={styles.spentValue}>{amount(summary.debit)}</Text>
              <Text style={styles.summaryNote}>This {period}</Text>
            </View>
            <View style={[styles.summaryCard, styles.receivedCard]}>
              <Text style={styles.summaryLabel}>RECEIVED</Text>
              <Text style={styles.receivedValue}>{amount(summary.credit)}</Text>
              <Text style={styles.summaryNote}>
                Net {summary.net >= 0 ? "+" : ""}
                {amount(summary.net)}
              </Text>
            </View>
          </View>

          <View style={styles.panel}>
            <Text style={styles.panelTitle}>By category</Text>
            {categories.length ? (
              categories.map(([type, value], index) => (
                <View key={type} style={styles.categoryRow}>
                  <View
                    style={[
                      styles.categoryDot,
                      {
                        backgroundColor: ["#60A5FA", "#A78BFA", "#F59E0B"][
                          index
                        ],
                      },
                    ]}
                  />
                  <Text style={styles.categoryName}>{type}</Text>
                  <Text style={styles.categoryValue}>{amount(value)}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.empty}>No spending in this period.</Text>
            )}
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeading}>
              <Text style={styles.panelTitle}>Spending trend</Text>
              <Text style={styles.trendNote}>{period}</Text>
            </View>
            {history
              .filter((tx) => tx.method.toUpperCase() === "DEBIT")
              .slice(0, 5)
              .map((tx) => (
                <View key={tx.id} style={styles.trendRow}>
                  <Text style={styles.trendDate}>
                    {transactionDate(tx.date)}
                  </Text>
                  <View style={styles.trendLine} />
                  <Text style={styles.trendAmount}>
                    {amount(Number(tx.amount || 0))}
                  </Text>
                </View>
              ))}
          </View>

          <View style={styles.activityHeading}>
            <Text style={styles.panelTitle}>Recent activity</Text>
            <Pressable hitSlop={8}>
              <Text style={styles.viewMore}>View More</Text>
            </Pressable>
          </View>
          <View style={styles.panel}>
            {recent.slice(0, 5).map((tx) => {
              const credit = tx.method.toUpperCase() === "CREDIT";
              return (
                <View key={tx.id} style={styles.activityRow}>
                  <View
                    style={[
                      styles.activityIcon,
                      credit ? styles.creditIcon : styles.debitIcon,
                    ]}
                  >
                    <Ionicons
                      name={credit ? "arrow-down" : "arrow-up"}
                      size={16}
                      color={credit ? "#34D399" : "#F87171"}
                    />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle}>{tx.type} transfer</Text>
                    <Text style={styles.activityMeta}>
                      {transactionDate(tx.date)} · •••• {tx.acc_no.slice(-4)}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.activityAmount,
                      credit ? styles.creditValue : styles.debitValue,
                    ]}
                  >
                    {credit ? "+" : "−"}
                    {amount(Number(tx.amount || 0))}
                  </Text>
                </View>
              );
            })}
          </View>
        </>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },
  content: { padding: 20, paddingTop: 16, paddingBottom: 32 },
  kicker: {
    color: "#60A5FA",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.1,
  },
  title: { color: TEXT, fontSize: 23, fontWeight: "800", marginTop: 4 },
  periods: {
    flexDirection: "row",
    borderRadius: 8,
    backgroundColor: "#15263D",
    padding: 3,
    marginTop: 16,
  },
  period: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
    borderRadius: 6,
  },
  periodSelected: { backgroundColor: BLUE },
  periodText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  periodTextSelected: { color: "#FFFFFF" },
  loading: { minHeight: 180, alignItems: "center", justifyContent: "center" },
  summaryRow: { flexDirection: "row", gap: 10, marginTop: 14 },
  summaryCard: { flex: 1, borderRadius: 10, padding: 14 },
  spentCard: { backgroundColor: "#173344" },
  receivedCard: { backgroundColor: "#1D293F" },
  summaryLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  spentValue: {
    color: "#67E8F9",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 7,
  },
  receivedValue: {
    color: "#A5B4FC",
    fontSize: 19,
    fontWeight: "800",
    marginTop: 7,
  },
  summaryNote: { color: MUTED, fontSize: 10, marginTop: 4 },
  panel: {
    borderRadius: 14,
    padding: 15,
    marginTop: 14,
    backgroundColor: "#0D1929",
    borderWidth: 1,
    borderColor: "rgba(148,163,184,0.13)",
  },
  panelHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  panelTitle: { color: TEXT, fontSize: 16, fontWeight: "800" },
  trendNote: {
    color: "#60A5FA",
    fontSize: 11,
    fontWeight: "700",
    textTransform: "capitalize",
  },
  categoryRow: { flexDirection: "row", alignItems: "center", marginTop: 13 },
  categoryDot: { width: 8, height: 8, borderRadius: 4, marginRight: 9 },
  categoryName: { color: MUTED, fontSize: 13, flex: 1 },
  categoryValue: { color: TEXT, fontSize: 13, fontWeight: "700" },
  trendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 14,
  },
  trendDate: { color: MUTED, fontSize: 11, width: 52 },
  trendLine: { flex: 1, height: 2, backgroundColor: "rgba(96,165,250,0.35)" },
  trendAmount: { color: "#60A5FA", fontSize: 12, fontWeight: "700" },
  activityHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
  },
  viewMore: { color: "#60A5FA", fontSize: 12, fontWeight: "800" },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 9,
  },
  activityIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  debitIcon: { backgroundColor: "rgba(248,113,113,0.13)" },
  creditIcon: { backgroundColor: "rgba(52,211,153,0.13)" },
  activityInfo: { flex: 1 },
  activityTitle: { color: TEXT, fontSize: 13, fontWeight: "700" },
  activityMeta: { color: MUTED, fontSize: 10, marginTop: 2 },
  activityAmount: { fontSize: 13, fontWeight: "800" },
  debitValue: { color: "#F87171" },
  creditValue: { color: "#34D399" },
  empty: { color: MUTED, fontSize: 13, paddingTop: 14 },
  error: { color: "#F87171", fontSize: 13, textAlign: "center", marginTop: 14 },
});
