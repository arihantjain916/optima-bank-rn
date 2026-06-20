import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const BLUE = "#2563EB";

const ACTIONS = [
  { icon: "snow-outline", label: "FREEZE" },
  { icon: "options-outline", label: "LIMITS" },
  { icon: "stats-chart-outline", label: "STATS" },
  { icon: "add", label: "NEW CARD" },
] as const;

const CVV_ROTATION_SECONDS = 5 * 60;

// Align the countdown with five-minute clock boundaries (for example, 10:05,
// 10:10, 10:15), rather than starting a different window on each device.
function secondsToNextCvvRotation() {
  const periodMs = CVV_ROTATION_SECONDS * 1000;
  const elapsedInPeriod = Date.now() % periodMs;
  return Math.ceil((periodMs - elapsedInPeriod) / 1000);
}

function formatHMS(total: number) {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(Math.floor(total / 3600))}:${p(Math.floor((total % 3600) / 60))}:${p(total % 60)}`;
}

function formatCardNumber(value: string) {
  return value
    .replace(/\s/g, "")
    .replace(/(.{4})/g, "$1 ")
    .trim();
}

type Card = {
  card_holder_name: string;
  expiry_year: string;
  expiry_month: string;
  last4: string;
  card_type: string;
  created_at: string;
  network: string;
  status: string;
  id: string;
};

function CardNetworkLogo({ network }: { network?: string }) {
  const value = network?.toLowerCase() ?? "";

  if (value.includes("mastercard")) {
    return (
      <View accessibilityLabel="Mastercard" style={styles.mastercardLogo}>
        <View style={[styles.networkCircle, styles.networkCircleRed]} />
        <View style={[styles.networkCircle, styles.networkCircleOrange]} />
      </View>
    );
  }

  if (value.includes("visa")) return <Text style={styles.visaLogo}>VISA</Text>;

  if (value.includes("rupay"))
    return <Text style={styles.rupayLogo}>RuPay</Text>;

  return (
    <Text style={styles.networkFallback}>
      {network?.toUpperCase() || "CARD"}
    </Text>
  );
}

export default function Card() {
  const { email } = useAuth();
  const insets = useSafeAreaInsets();
  const [flipped, setFlipped] = useState(false);
  const flip = useRef(new Animated.Value(0)).current;
  const [remaining, setRemaining] = useState(secondsToNextCvvRotation());
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cvv, setCvv] = useState<string | null>(null);
  const [revealingCvv, setRevealingCvv] = useState(false);
  const [cardNumber, setCardNumber] = useState<string | null>(null);
  const [numberVisible, setNumberVisible] = useState(false);
  const [revealingNumber, setRevealingNumber] = useState(false);
  const [revealError, setRevealError] = useState<string | null>(null);
  const card = data[0];

  const load = useCallback(
    async (isRefresh = false) => {
      if (!email) return;
      try {
        if (!isRefresh) setLoading(true);
        setError(null);
        const res = await api<{ data: Card[] }>(`/card`);
        setData(res.data);
      } catch {
        setError("Couldn't load your cards.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [email],
  );

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load(true);
  }, [load]);

  // Live rotation countdown — ticks every second, resets at zero.
  useEffect(() => {
    const id = setInterval(
      () =>
        setRemaining((r) =>
          r > 0 ? r - 1 : secondsToNextCvvRotation(),
        ),
      1000,
    );
    return () => clearInterval(id);
  }, []);

  const revealCvv = useCallback(async () => {
    if (!card?.id) return;

    setRevealingCvv(true);
    setRevealError(null);
    try {
      const response = await api<{ data: string }>(
        `/card/${encodeURIComponent(card.id)}/reveal/cvv`,
      );
      setCvv(response.data);
    } catch {
      setRevealError("Couldn't reveal your CVV. Flip the card to try again.");
    } finally {
      setRevealingCvv(false);
    }
  }, [card?.id]);

  const toggleCardNumber = useCallback(async () => {
    if (numberVisible) {
      setNumberVisible(false);
      return;
    }

    if (cardNumber) {
      setNumberVisible(true);
      return;
    }

    if (!card?.id) return;
    setRevealingNumber(true);
    setRevealError(null);
    try {
      const response = await api<{ data: string }>(
        `/card/${encodeURIComponent(card.id)}/reveal/number`,
      );
      setCardNumber(response.data);
      setNumberVisible(true);
    } catch {
      setRevealError("Couldn't reveal your card number. Try again.");
    } finally {
      setRevealingNumber(false);
    }
  }, [card?.id, cardNumber, numberVisible]);

  function toggleFlip() {
    const flippingToBack = !flipped;

    // Start the protected request with the user's tap, before the animation
    // begins. Both CVV displays consume this single response.
    if (flippingToBack) void revealCvv();

    Animated.spring(flip, {
      toValue: flipped ? 0 : 1,
      useNativeDriver: true,
      friction: 8,
      tension: 10,
    }).start();
    setFlipped((f) => !f);
  }

  // One Animated value drives both faces; the back is offset 180° so only one
  // is ever facing the camera (backfaceVisibility hides the other).
  const frontRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });
  const backRotate = flip.interpolate({
    inputRange: [0, 1],
    outputRange: ["180deg", "360deg"],
  });

  return (
    <ScrollView
      style={styles.fill}
      contentContainerStyle={{
        padding: 20,
        paddingTop: insets.top + 12,
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
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={18} color="#60A5FA" />
          </View>
          <Text style={styles.brand}>Optima Bank</Text>
        </View>
        <Ionicons name="notifications-outline" size={22} color={TEXT} />
      </View>

      {/* Balance */}
      <Text style={styles.balLabel}>CARD STATUS</Text>
      <View style={styles.balRow}>
        <Text style={styles.balance}>{loading ? "Loading…" : "Your card"}</Text>
        <View style={styles.activeBadge}>
          <Text style={styles.activeText}>● {card?.status ?? "Active"}</Text>
        </View>
      </View>

      {/* Flip card */}
      <View style={styles.cardArea}>
        <Animated.View
          pointerEvents={flipped ? "none" : "auto"}
          style={[
            styles.card,
            { transform: [{ perspective: 1000 }, { rotateY: frontRotate }] },
          ]}
        >
          <LinearGradient
            colors={["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardFill}
          >
            <View style={styles.cardTopRow}>
              <Text style={styles.cardBrand}>OPTIMA</Text>
              <CardNetworkLogo network={card?.network || card?.card_type} />
            </View>
            <View style={styles.chip} />
            <View style={styles.cardNumberRow}>
              <Text style={styles.cardNumber}>
                {numberVisible && cardNumber
                  ? formatCardNumber(cardNumber)
                  : `•••• •••• •••• ${card?.last4 ?? "----"}`}
              </Text>
              <Pressable
                accessibilityLabel={
                  numberVisible ? "Hide card number" : "Reveal card number"
                }
                onPress={toggleCardNumber}
                hitSlop={10}
                disabled={revealingNumber}
              >
                {revealingNumber ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons
                    name={numberVisible ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>
            <View style={styles.cardBottomRow}>
              <View>
                <Text style={styles.cardSmallLabel}>CARD HOLDER</Text>
                <Text style={styles.cardValue}>
                  {card?.card_holder_name ?? ""}
                </Text>
              </View>
              <View>
                <Text style={styles.cardSmallLabel}>EXPIRES</Text>
                <Text style={styles.cardValue}>
                  {card?.expiry_month ?? "--"}/{card?.expiry_year ?? "--"}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        <Animated.View
          pointerEvents={flipped ? "auto" : "none"}
          style={[
            styles.card,
            styles.cardBack,
            { transform: [{ perspective: 1000 }, { rotateY: backRotate }] },
          ]}
        >
          <LinearGradient
            colors={["#1E3A8A", "#2563EB"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardFill}
          >
            <View style={styles.magstripe} />
            <View style={styles.sigRow}>
              <View style={styles.sigPanel} />
              <View style={styles.cvvBox}>
                {revealingCvv ? (
                  <ActivityIndicator size="small" color="#0A0E1A" />
                ) : (
                  <Text style={styles.cvvBoxText}>{cvv ?? "•••"}</Text>
                )}
              </View>
            </View>
            <Text style={styles.disclaimer}>
              This card is issued by Optima Bank. Use of this card is subject to
              the cardholder agreement. Unauthorized use is prohibited. If
              found, please return to any Optima Bank branch.
            </Text>
          </LinearGradient>
        </Animated.View>

        {loading && (
          <View style={styles.loadingCard}>
            <ActivityIndicator color="#FFFFFF" />
            <Text style={styles.loadingCardText}>Loading card details</Text>
          </View>
        )}
      </View>

      {!loading && card && (
        <Pressable style={styles.flipBtn} onPress={toggleFlip} hitSlop={8}>
          <Ionicons name="swap-horizontal" size={16} color={MUTED} />
          <Text style={styles.flipText}>TAP TO FLIP CARD</Text>
        </Pressable>
      )}

      {error && (
        <Pressable
          style={styles.errorCard}
          onPress={() => {
            load();
          }}
        >
          <Text style={styles.errorText}>{error} Tap to try again.</Text>
        </Pressable>
      )}

      {revealError && <Text style={styles.revealError}>{revealError}</Text>}

      {/* Dynamic CVV */}
      <View style={styles.cvvPanel}>
        <View style={styles.cvvHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.cvvTitle}>Dynamic CVV</Text>
            <Text style={styles.cvvSub}>
              Enhanced security for online transactions
            </Text>
          </View>
          <View style={styles.cvvRing}>
            <Text style={styles.cvvRingText}>
              {revealingCvv ? (
                <ActivityIndicator size="small" color="#dcdee6" />
              ) : (
                <Text style={styles.cvvSub}>
                  {flipped ? (cvv ?? "•••") : "•••"}
                </Text>
              )}
            </Text>
          </View>
        </View>

        <View style={styles.countdownBox}>
          <Ionicons name="time-outline" size={16} color={BLUE} />
          <View>
            <Text style={styles.countdownLabel}>ROTATION COUNTDOWN</Text>
            <Text style={styles.countdown}>{formatHMS(remaining)}</Text>
          </View>
        </View>
      </View>

      {/* Quick actions */}
      <View style={styles.actions}>
        {ACTIONS.map((a) => (
          <View key={a.label} style={styles.action}>
            <View style={styles.actionIcon}>
              <Ionicons name={a.icon} size={20} color={BLUE} />
            </View>
            <Text style={styles.actionLabel}>{a.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const CARD_HEIGHT = 200;

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(96,165,250,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { color: "#60A5FA", fontSize: 18, fontWeight: "800" },

  balLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginTop: 22,
  },
  balRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 6,
  },
  balance: { color: "#60A5FA", fontSize: 30, fontWeight: "800" },
  activeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(34,197,94,0.15)",
  },
  activeText: { color: "#22C55E", fontSize: 12, fontWeight: "700" },

  cardArea: { height: CARD_HEIGHT, marginTop: 20 },
  card: {
    position: "absolute",
    width: "100%",
    height: CARD_HEIGHT,
    borderRadius: 18,
    backfaceVisibility: "hidden",
  },
  cardBack: {},
  loadingCard: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    backgroundColor: "rgba(30,58,138,0.96)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  loadingCardText: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 14,
    fontWeight: "700",
  },
  cardFill: {
    flex: 1,
    borderRadius: 18,
    padding: 20,
    overflow: "hidden",
    justifyContent: "space-between",
  },

  cardTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardBrand: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 2,
  },
  visaLogo: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  rupayLogo: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "900",
    fontStyle: "italic",
    letterSpacing: -1,
  },
  mastercardLogo: {
    width: 42,
    height: 26,
    flexDirection: "row",
    alignItems: "center",
  },
  networkCircle: { width: 25, height: 25, borderRadius: 13 },
  networkCircleRed: { backgroundColor: "#EB001B" },
  networkCircleOrange: { backgroundColor: "#F79E1B", marginLeft: -9 },
  networkFallback: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  chip: {
    width: 40,
    height: 30,
    borderRadius: 6,
    backgroundColor: "rgba(255,255,255,0.35)",
  },
  cardNumber: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 2,
  },
  cardNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  cardBottomRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  cardSmallLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1,
  },
  cardValue: { color: "#fff", fontSize: 14, fontWeight: "700", marginTop: 2 },

  magstripe: {
    height: 40,
    backgroundColor: "rgba(0,0,0,0.55)",
    marginHorizontal: -20,
    marginTop: 4,
  },
  sigRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  sigPanel: {
    flex: 1,
    height: 34,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  cvvBox: {
    width: 56,
    height: 34,
    borderRadius: 4,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  cvvBoxText: {
    color: "#0A0E1A",
    fontSize: 16,
    fontWeight: "800",
    fontStyle: "italic",
  },
  disclaimer: { color: "rgba(255,255,255,0.55)", fontSize: 9, lineHeight: 13 },

  flipBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
  },
  flipText: { color: MUTED, fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  errorCard: {
    marginTop: 14,
    borderRadius: 10,
    padding: 12,
    backgroundColor: "rgba(239,68,68,0.12)",
  },
  errorText: {
    color: "#FCA5A5",
    fontSize: 13,
    textAlign: "center",
    fontWeight: "600",
  },
  revealError: {
    color: "#FCA5A5",
    fontSize: 13,
    textAlign: "center",
    marginTop: 12,
  },

  cvvPanel: {
    marginTop: 20,
    borderRadius: 18,
    padding: 18,
    backgroundColor: "rgba(255,255,255,0.02)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    gap: 16,
  },
  cvvHeader: { flexDirection: "row", alignItems: "center" },
  cvvTitle: { color: TEXT, fontSize: 17, fontWeight: "800" },
  cvvSub: { color: MUTED, fontSize: 13, marginTop: 4 },
  cvvRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: BLUE,
    borderTopColor: "rgba(37,99,235,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  cvvRingText: { color: "#60A5FA", fontSize: 16, fontWeight: "800" },

  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(37,99,235,0.08)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.2)",
  },
  countdownLabel: {
    color: MUTED,
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1,
  },
  countdown: {
    color: "#60A5FA",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: 2,
    marginTop: 2,
  },

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
    backgroundColor: "rgba(37,99,235,0.12)",
    borderWidth: 1,
    borderColor: "rgba(37,99,235,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
