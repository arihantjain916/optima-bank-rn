import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useRef, useState } from "react";
import {
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BLUE = "#2563EB";
const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";

// ── Slide data ──────────────────────────────────────────────────────────────
// Each slide is just data + a hero renderer. Keeping it in an array means the
// carousel, the dots, and "is this the last slide?" all derive from one source.
type Slide = {
  key: string;
  title: string;
  subtitle: string;
  Hero: () => React.JSX.Element;
};

const SLIDES: Slide[] = [
  {
    key: "card",
    title: "Experience the next-gen fintech.",
    subtitle:
      "Join a community of elite users redefining the future of digital finance and investment.",
    Hero: CardHero,
  },
  {
    key: "tracking",
    title: "Banking that moves with you",
    subtitle:
      "Seamlessly manage your assets across borders with real-time tracking and effortless transfers.",
    Hero: PreviewHero,
  },
  {
    key: "security",
    title: "Secure. Transparent. Always.",
    subtitle:
      "Military-grade biometric encryption ensures your wealth is protected by the most advanced security protocols.",
    Hero: BiometricHero,
  },
];

export default function Onboarding() {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<Slide>>(null);
  const [index, setIndex] = useState(0);

  // RN gotcha: FlatList throws if onViewableItemsChanged / viewabilityConfig
  // identity changes between renders. Pin both with useRef so they're stable.
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 60 }).current;
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems[0]?.index != null) setIndex(viewableItems[0].index);
    }
  ).current;

  const renderItem = useCallback(
    ({ item }: { item: Slide }) => (
      <View style={[styles.slide, { width }]}>
        <View style={styles.heroArea}>
          <item.Hero />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.subtitle}>{item.subtitle}</Text>
      </View>
    ),
    [width]
  );

  return (
    <LinearGradient colors={["#0B1020", "#0A0E1A"]} style={styles.fill}>
      {/* Header: brand + Skip */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.brand}>Optima Bank</Text>
        <Pressable onPress={() => listRef.current?.scrollToEnd()} hitSlop={12}>
          <Text style={styles.skip}>Skip</Text>
        </Pressable>
      </View>

      {/* Swipeable slides */}
      <FlatList
        ref={listRef}
        data={SLIDES}
        keyExtractor={(s) => s.key}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />

      {/* Footer: dots + CTAs */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.dots}>
          {SLIDES.map((s, i) => (
            <View key={s.key} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>

        <Pressable
          style={({ pressed }) => [styles.primaryBtn, pressed && styles.pressed]}
          onPress={() => {
            // TODO: router.push("/(auth)/register") once the auth stack exists
          }}
        >
          <Text style={styles.primaryText}>Create Account</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.ghostBtn, pressed && styles.pressed]}
          onPress={() => {
            // TODO: router.push("/(auth)/login")
          }}
        >
          <Text style={styles.ghostText}>Login</Text>
        </Pressable>
      </View>
    </LinearGradient>
  );
}

// ── Hero visuals ─────────────────────────────────────────────────────────────
function CardHero() {
  return (
    <LinearGradient
      colors={["#3B82F6", "#60A5FA"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.card}
    >
      <View style={styles.cardTop}>
        <Text style={styles.cardLabel}>PREMIUM ACCOUNT</Text>
        <MaterialCommunityIcons name="contactless-payment" size={22} color="#FFFFFF" />
      </View>
      <Text style={styles.cardTier}>OPTIMA PLATINUM</Text>
      <Text style={styles.cardNumber}>{"✱✱✱✱  ✱✱✱✱  ✱✱✱✱  8824"}</Text>
      <View style={styles.cardBottom}>
        <View>
          <Text style={styles.cardLabel}>CARD HOLDER</Text>
          <Text style={styles.cardHolder}>ALEXANDER VAUGHN</Text>
        </View>
        <View style={styles.cardChip} />
      </View>
    </LinearGradient>
  );
}

function PreviewHero() {
  return (
    <View style={styles.preview}>
      <View style={styles.previewImage}>
        <Ionicons name="phone-portrait-outline" size={44} color="#2DD4BF" />
      </View>
      <View style={[styles.skel, { width: "55%" }]} />
      <View style={[styles.skel, { width: "75%" }]} />
      <View style={[styles.skel, styles.skelBlue]} />
      <View style={styles.previewRow}>
        <View style={styles.previewBlock} />
        <View style={styles.previewBlock} />
      </View>
    </View>
  );
}

function BiometricHero() {
  return (
    <View style={styles.bioOuter}>
      <View style={styles.bioInner}>
        <Ionicons name="finger-print" size={64} color="#34D399" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  brand: { color: TEXT, fontSize: 18, fontWeight: "700" },
  skip: { color: MUTED, fontSize: 15, fontWeight: "500" },

  slide: { flex: 1, paddingHorizontal: 24, justifyContent: "center" },
  heroArea: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { color: TEXT, fontSize: 38, fontWeight: "800", lineHeight: 42, marginTop: 8 },
  subtitle: { color: MUTED, fontSize: 15, lineHeight: 22, marginTop: 16, marginBottom: 8 },

  footer: { paddingHorizontal: 24, gap: 12 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8, marginBottom: 8 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "#334155" },
  dotActive: { width: 18, backgroundColor: BLUE },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: BLUE,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  ghostBtn: {
    height: 54,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  ghostText: { color: "#93C5FD", fontSize: 16, fontWeight: "600" },
  pressed: { opacity: 0.85 },

  // Card hero
  card: { width: "100%", borderRadius: 20, padding: 20, gap: 14 },
  cardTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardLabel: { color: "rgba(255,255,255,0.8)", fontSize: 9, fontWeight: "700", letterSpacing: 1.5 },
  cardTier: { color: "#FFFFFF", fontSize: 18, fontWeight: "800", letterSpacing: 0.5 },
  cardNumber: { color: "#FFFFFF", fontSize: 17, fontWeight: "700", letterSpacing: 2 },
  cardBottom: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 4 },
  cardHolder: { color: "#FFFFFF", fontSize: 14, fontWeight: "700", marginTop: 2 },
  cardChip: { width: 36, height: 26, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.25)" },

  // Preview hero
  preview: {
    width: "100%",
    borderRadius: 20,
    padding: 16,
    gap: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  previewImage: {
    height: 120,
    borderRadius: 14,
    backgroundColor: "#0F1B2E",
    alignItems: "center",
    justifyContent: "center",
  },
  skel: { height: 12, borderRadius: 6, backgroundColor: "rgba(255,255,255,0.08)" },
  skelBlue: { height: 36, width: "100%", backgroundColor: "rgba(37,99,235,0.55)" },
  previewRow: { flexDirection: "row", gap: 12 },
  previewBlock: { flex: 1, height: 60, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.05)" },

  // Biometric hero
  bioOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  bioInner: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.3)",
    backgroundColor: "rgba(52,211,153,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
});
