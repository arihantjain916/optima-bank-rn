import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LineChart, PieChart } from "react-native-gifted-charts";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

const COLORS = {
  background: "#07162E",
  surface: "#0C203D",
  surfaceStrong: "#102B4D",
  border: "#214161",
  text: "#F8FAFC",
  muted: "#8FA3BF",
  blue: "#2563EB",
  cyan: "#34D9E8",
  green: "#36D597",
  red: "#F04E62",
  orange: "#F8A234",
};

const PERIODS = ["week", "month", "year"] as const;
const CATEGORY_COLORS = [COLORS.blue, COLORS.cyan, COLORS.orange, "#9B74E8"];

type Period = (typeof PERIODS)[number];
type Transaction = {
  date: string;
  id: string;
  amount: number | string;
  type: string;
  acc_no: string;
  method: string;
};
function money(value: number, decimals = 2) {
  return `\u20B9${Math.abs(value).toLocaleString("en-IN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}`;
}

function compactMoney(value: number) {
  if (value >= 100000) return `\u20B9${(value / 100000).toFixed(1)}L`;
  if (value >= 1000) return `\u20B9${(value / 1000).toFixed(1)}K`;
  return money(value, 0);
}

function asTransactions(value: unknown): Transaction[] {
  if (Array.isArray(value)) return value as Transaction[];
  const data = (value as { data?: unknown })?.data;
  return Array.isArray(data) ? (data as Transaction[]) : [];
}

function transactionDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString([], { day: "numeric", month: "short" });
}

export default function Analytics() {
  const { refreshUserInfo, userInfo } = useAuth();
  const [period, setPeriod] = useState<Period>("week");
  const [history, setHistory] = useState<Transaction[]>([]);
  const [recent, setRecent] = useState<Transaction[]>([]);
  const [currentBalance, setCurrentBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    const dashboard = force
      ? await refreshUserInfo(true)
      : userInfo ?? (await refreshUserInfo());
    if (!dashboard) {
      setError("Couldn't load your spending analytics.");
      setLoading(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      setCurrentBalance(
        typeof dashboard.currentBalance === "number"
          ? dashboard.currentBalance
          : null,
      );
      const [historyResult, recentResult] = await Promise.all([
        api<unknown>(
          `/transaction/history/me?period=${period}`,
        ),
        api<unknown>("/transaction/recent/me"),
      ]);
      setHistory(asTransactions(historyResult));
      setRecent(asTransactions(recentResult));
    } catch {
      setError("Couldn't load your spending analytics.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, refreshUserInfo, userInfo]);

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
    return { debit, credit };
  }, [history]);

  const categories = useMemo(() => {
    const grouped = new Map<string, number>();
    history
      .filter((tx) => tx.method.toUpperCase() === "DEBIT")
      .forEach((tx) => {
        const name = tx.type?.trim() || "Other";
        grouped.set(name, (grouped.get(name) ?? 0) + Number(tx.amount || 0));
      });
    return [...grouped.entries()]
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4);
  }, [history]);

  const trendData = useMemo(() => {
    const debits = history
      .filter((tx) => tx.method.toUpperCase() === "DEBIT")
      .slice(0, 7)
      .reverse()
      .map((tx, index) => ({
        value: Number(tx.amount || 0),
        label: transactionDate(tx.date) || String(index + 1),
      }));

    return debits.length
      ? debits
      : [32, 48, 42, 64, 52, 76, 58].map((value, index) => ({
          value,
          label: String(index + 1),
        }));
  }, [history]);

  const activity = recent.length ? recent.slice(0, 4) : history.slice(0, 4);
  const totalCategorySpend = categories.reduce((sum, [, value]) => sum + value, 0);

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            load(true);
          }}
          tintColor={COLORS.cyan}
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
              accessibilityRole="button"
              accessibilityState={{ selected }}
              key={value}
              style={[styles.period, selected && styles.periodSelected]}
              onPress={() => setPeriod(value)}
            >
              <Text style={[styles.periodText, selected && styles.periodTextSelected]}>
                {value[0].toUpperCase() + value.slice(1)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator color={COLORS.cyan} />
        </View>
      ) : (
        <>
          <View style={[styles.summaryCard, styles.balanceCard]}>
            <View>
              <Text style={styles.summaryLabel}>CURRENT BALANCE</Text>
              <Text style={styles.balanceValue}>{money(currentBalance ?? summary.credit - summary.debit)}</Text>
              <Text style={styles.summarySubtext}>Across all accounts</Text>
            </View>
            <View style={[styles.summaryIcon, styles.balanceIcon]}>
              <Ionicons name="wallet-outline" size={19} color={COLORS.cyan} />
            </View>
          </View>

          <View style={[styles.summaryCard, styles.spentCard]}>
            <View>
              <Text style={styles.summaryLabel}>TOTAL SPENT</Text>
              <Text style={styles.spentValue}>{money(summary.debit)}</Text>
              <Text style={[styles.summarySubtext, styles.spentSubtext]}>This {period}</Text>
            </View>
            <View style={[styles.summaryIcon, styles.spentIcon]}>
              <Ionicons name="trending-down-outline" size={19} color={COLORS.red} />
            </View>
          </View>

          <View style={styles.panel}>
              <Text style={styles.panelTitle}>By Category</Text>
            <View style={styles.categoryBody}>
              {categories.length ? (
                <PieChart
                  data={categories.map(([name, value], index) => ({
                    value,
                    color: CATEGORY_COLORS[index],
                    text: name,
                  }))}
                  donut
                  radius={50}
                  innerRadius={33}
                  innerCircleColor={COLORS.surface}
                  centerLabelComponent={() => (
                    <View style={styles.donutCenter}>
                      <Text style={styles.donutLabel}>SPENT</Text>
                      <Text style={styles.donutValue}>{compactMoney(totalCategorySpend)}</Text>
                    </View>
                  )}
                />
              ) : (
                <View style={styles.emptyDonut}>
                  <Text style={styles.donutLabel}>SPENT</Text>
                  <Text style={styles.donutValue}>{money(0, 0)}</Text>
                </View>
              )}
              <View style={styles.categoryLegend}>
                {categories.length ? (
                  categories.map(([name, value], index) => (
                    <View key={name} style={styles.categoryRow}>
                      <View style={[styles.legendDot, { backgroundColor: CATEGORY_COLORS[index] }]} />
                      <Text style={styles.categoryName} numberOfLines={1}>{name}</Text>
                      <Text style={styles.categoryValue}>{money(value)}</Text>
                    </View>
                  ))
                ) : (
                  <Text style={styles.empty}>No spending this {period}.</Text>
                )}
              </View>
            </View>
          </View>

          <View style={styles.panel}>
            <View style={styles.panelHeading}>
              <Text style={styles.panelTitle}>Spending Trend</Text>
              <Text style={styles.trendBadge}>This {period}</Text>
            </View>
            <View style={styles.trendChart}>
              <LineChart
                areaChart
                curved
                data={trendData}
                height={112}
                width={282}
                spacing={42}
                initialSpacing={10}
                endSpacing={10}
                color={COLORS.cyan}
                thickness={2}
                startFillColor={COLORS.cyan}
                endFillColor={COLORS.surface}
                startOpacity={0.22}
                endOpacity={0}
                dataPointsColor={COLORS.cyan}
                dataPointsRadius={3}
                hideRules
                hideYAxisText
                hideAxesAndRules
                xAxisLabelTextStyle={styles.chartLabel}
              />
            </View>
          </View>

          <View style={styles.activityHeading}>
            <Text style={styles.panelTitle}>Recent Activity</Text>
            <Text style={styles.viewAll}>View all</Text>
          </View>
          <View style={styles.activityPanel}>
            {activity.length ? (
              activity.map((tx) => {
                const credit = tx.method.toUpperCase() === "CREDIT";
                return (
                  <Pressable
                    key={tx.id}
                    style={styles.activityRow}
                    onPress={() => router.push({
                      pathname: "/transaction/[id]",
                      params: {
                        id: tx.id,
                        amount: String(tx.amount),
                        type: tx.type,
                        account: tx.acc_no,
                        date: tx.date,
                        method: tx.method,
                      },
                    })}
                  >
                    <View style={[styles.activityIcon, credit ? styles.creditIcon : styles.debitIcon]}>
                      <Ionicons name={credit ? "arrow-down" : "arrow-up"} size={15} color={credit ? COLORS.green : COLORS.red} />
                    </View>
                    <View style={styles.activityInfo}>
                      <Text style={styles.activityTitle} numberOfLines={1}>{tx.type || "Bank transfer"}</Text>
                      <Text style={styles.activityMeta}>{transactionDate(tx.date)} · •••• {tx.acc_no?.slice(-4) || "0000"}</Text>
                    </View>
                    <Text style={[styles.activityAmount, credit ? styles.creditAmount : styles.debitAmount]}>
                      {credit ? "+" : "−"}{money(Number(tx.amount || 0))}
                    </Text>
                  </Pressable>
                );
              })
            ) : (
              <Text style={styles.empty}>No recent activity.</Text>
            )}
          </View>
        </>
      )}
      {error && <Text style={styles.error}>{error}</Text>}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: COLORS.background },
  content: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 36 },
  kicker: { color: COLORS.cyan, fontSize: 10, fontWeight: "800", letterSpacing: 1.2 },
  title: { color: COLORS.text, fontSize: 22, fontWeight: "800", marginTop: 4 },
  periods: { flexDirection: "row", backgroundColor: "#102A4A", borderRadius: 7, padding: 3, marginTop: 14 },
  period: { flex: 1, alignItems: "center", paddingVertical: 7, borderRadius: 5 },
  periodSelected: { backgroundColor: COLORS.blue },
  periodText: { color: COLORS.muted, fontSize: 10, fontWeight: "700" },
  periodTextSelected: { color: "#FFFFFF" },
  loading: { minHeight: 260, alignItems: "center", justifyContent: "center" },
  summaryCard: { minHeight: 92, marginTop: 12, borderRadius: 10, padding: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  balanceCard: { backgroundColor: "#0A3D4A", borderWidth: 1, borderColor: "#1A6974" },
  spentCard: { backgroundColor: "#15243B", borderWidth: 1, borderColor: "#2B4161" },
  summaryLabel: { color: COLORS.muted, fontSize: 9, fontWeight: "800", letterSpacing: 0.85 },
  balanceValue: { color: "#FFFFFF", fontSize: 24, lineHeight: 28, fontWeight: "800", marginTop: 5 },
  spentValue: { color: "#FFFFFF", fontSize: 21, lineHeight: 26, fontWeight: "800", marginTop: 5 },
  summarySubtext: { color: "#86B9BE", fontSize: 10, marginTop: 3 },
  spentSubtext: { color: COLORS.muted },
  summaryIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  balanceIcon: { backgroundColor: "#075B67" },
  spentIcon: { backgroundColor: "#4A2537" },
  panel: { marginTop: 12, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, padding: 14 },
  panelTitle: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  categoryBody: { flexDirection: "row", alignItems: "center", marginTop: 16, minHeight: 116 },
  donutCenter: { width: 66, alignItems: "center", justifyContent: "center" },
  emptyDonut: { width: 100, height: 100, borderRadius: 50, borderWidth: 14, borderColor: "#18395B", alignItems: "center", justifyContent: "center", marginHorizontal: 4 },
  donutLabel: { color: COLORS.muted, fontSize: 8, fontWeight: "800", letterSpacing: 0.4 },
  donutValue: { color: COLORS.text, fontSize: 12, fontWeight: "800", marginTop: 2 },
  categoryLegend: { flex: 1, paddingLeft: 14, gap: 8 },
  categoryRow: { flexDirection: "row", alignItems: "center", minWidth: 0 },
  legendDot: { width: 6, height: 6, borderRadius: 3, marginRight: 7 },
  categoryName: { color: COLORS.muted, fontSize: 10, flex: 1 },
  categoryValue: { color: COLORS.text, fontSize: 10, fontWeight: "700", marginLeft: 8 },
  panelHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  trendBadge: { color: COLORS.cyan, fontSize: 10, fontWeight: "700" },
  trendChart: { height: 142, marginTop: 18, overflow: "hidden" },
  chartLabel: { color: COLORS.muted, fontSize: 8, marginTop: 5 },
  activityHeading: { marginTop: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  viewAll: { color: COLORS.cyan, fontSize: 10, fontWeight: "700" },
  activityPanel: { marginTop: 10, backgroundColor: COLORS.surface, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12 },
  activityRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, gap: 9, borderBottomWidth: 1, borderBottomColor: "rgba(143,163,191,0.1)" },
  activityIcon: { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  creditIcon: { backgroundColor: "rgba(54,213,151,0.14)" },
  debitIcon: { backgroundColor: "rgba(240,78,98,0.14)" },
  activityInfo: { flex: 1, minWidth: 0 },
  activityTitle: { color: COLORS.text, fontSize: 11, fontWeight: "700" },
  activityMeta: { color: COLORS.muted, fontSize: 9, marginTop: 2 },
  activityAmount: { fontSize: 10, fontWeight: "800" },
  creditAmount: { color: COLORS.green },
  debitAmount: { color: COLORS.red },
  empty: { color: COLORS.muted, fontSize: 11, paddingVertical: 10 },
  error: { color: COLORS.red, fontSize: 12, textAlign: "center", marginTop: 14 },
});
