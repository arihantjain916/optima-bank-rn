import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const TEXT = "#F8FAFC";
const MUTED = "#94A3B8";
const BLUE = "#2563EB";
const RED = "#F87171";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", ".", "0", "backspace"] as const;
const TRANSFER_TYPES = ["NEFT", "IMPS", "RTGS"] as const;

function money(value: number) {
  return `₹${value.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function formatAccount(value: string) {
  return value.replace(/\D/g, "").replace(/(.{4})/g, "$1 ").trim();
}

export default function Send() {
  const { refreshUserInfo, userInfo } = useAuth();
  const insets = useSafeAreaInsets();
  const [account, setAccount] = useState("");
  const [amount, setAmount] = useState("");
  const [transferType, setTransferType] = useState<(typeof TRANSFER_TYPES)[number]>("NEFT");
  const [balance, setBalance] = useState<number | null>(null);
  const [senderAccount, setSenderAccount] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [transferError, setTransferError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState("Amount transferred successfully");

  const loadBalance = useCallback(async () => {
    const dashboard = userInfo ?? (await refreshUserInfo());
    if (!dashboard) {
      setError("Couldn't load your available balance.");
      setLoadingBalance(false);
      setRefreshing(false);
      return;
    }
    try {
      setError(null);
      setBalance(
        typeof dashboard.currentBalance === "number"
          ? dashboard.currentBalance
          : null,
      );
      setSenderAccount(
        typeof dashboard.account_no === "string" ? dashboard.account_no : null,
      );
    } catch {
      setError("Couldn't load your available balance.");
    } finally {
      setLoadingBalance(false);
      setRefreshing(false);
    }
  }, [refreshUserInfo, userInfo]);

  useEffect(() => {
    loadBalance();
  }, [loadBalance]);

  const numericAmount = Number(amount || 0);
  const recipientDigits = account.replace(/\D/g, "");
  const accountValid = recipientDigits.length >= 10;
  const amountValid = numericAmount > 0 && (balance === null || numericAmount <= balance);
  const formValid = accountValid && amountValid;
  const amountError =
    amount && balance !== null && numericAmount > balance
      ? "Amount exceeds your available balance."
      : null;

  const displayAmount = useMemo(
    () => (amount ? `₹${Number(amount).toLocaleString("en-IN")}` : "₹0"),
    [amount],
  );

  function onKeyPress(key: (typeof KEYS)[number]) {
    setAmount((current) => {
      if (key === "backspace") return current.slice(0, -1);
      if (key === ".") {
        if (current.includes(".")) return current;
        return current ? `${current}.` : "0.";
      }

      const [whole, decimal = ""] = current.split(".");
      if (decimal && decimal.length >= 2) return current;
      if (!current || current === "0") return key;
      if (whole.length >= 9 && !current.includes(".")) return current;
      return `${current}${key}`;
    });
  }

  function reviewTransfer() {
    if (!formValid) {
      setError(
        !accountValid
          ? "Enter a valid recipient account number."
          : amountError ?? "Enter an amount greater than ₹0.",
      );
      return;
    }
    setError(null);
    setConfirmed(false);
    setTransferError(null);
    setReviewing(true);
  }

  async function confirmTransfer() {
    if (!senderAccount) {
      setTransferError("Your sender account is unavailable. Refresh and try again.");
      return;
    }

    setSubmitting(true);
    setTransferError(null);
    try {
      const response = await api<{ message?: string }>("/transfer", {
        method: "POST",
        body: JSON.stringify({
          receiver_acc_no: recipientDigits,
          amount: numericAmount,
          type: transferType,
          sender_acc_no: senderAccount,
        }),
      });
      setSuccessMessage(response.message ?? "Amount transferred successfully");
      setConfirmed(true);
      loadBalance();
    } catch {
      setTransferError("Transfer couldn't be completed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  function resetTransfer() {
    setReviewing(false);
    setConfirmed(false);
    setTransferError(null);
    setAccount("");
    setAmount("");
  }

  async function shareReceipt() {
    await Share.share({
      message: [
        "Optima Bank transfer receipt",
        `To: ${formatAccount(account)}`,
        `Amount: ${money(numericAmount)}`,
        `Type: ${transferType}`,
        successMessage,
      ].join("\n"),
    });
  }

  function returnHome() {
    resetTransfer();
    router.replace("/");
  }

  return (
    <KeyboardAvoidingView
      style={styles.fill}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: 12 }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => {
            setRefreshing(true);
            loadBalance();
          }} tintColor="#60A5FA" />
        }
      >
        <Text style={styles.title}>Send Money</Text>
        <Text style={styles.subtitle}>Enter recipient details and amount</Text>

        <Text style={styles.label}>RECIPIENT ACCOUNT</Text>
        <View style={[styles.inputWrap, account.length > 0 && styles.inputWrapActive]}>
          <TextInput
            value={formatAccount(account)}
            onChangeText={(value) => setAccount(value.replace(/\D/g, "").slice(0, 20))}
            placeholder="Account number"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
            style={styles.input}
            maxLength={24}
          />
          <Ionicons name="search-outline" size={19} color="#64748B" />
        </View>

        <Text style={styles.typeLabel}>TRANSFER TYPE</Text>
        <View style={styles.typeOptions}>
          {TRANSFER_TYPES.map((type) => {
            const selected = transferType === type;
            return (
              <Pressable
                key={type}
                style={[styles.typeOption, selected && styles.typeOptionSelected]}
                onPress={() => setTransferType(type)}
              >
                <Text style={[styles.typeText, selected && styles.typeTextSelected]}>{type}</Text>
              </Pressable>
            );
          })}
        </View>

        <View style={styles.amountArea}>
          <Text style={styles.amountLabel}>ENTER AMOUNT</Text>
          <Text style={styles.amount}>{displayAmount}</Text>
          <Text style={styles.balance}>
            {loadingBalance ? "Loading available balance…" : `Available balance: ${money(balance ?? 0)}`}
          </Text>
          {amountError && <Text style={styles.validation}>{amountError}</Text>}
        </View>

        <View style={styles.keypad}>
          {[0, 3, 6, 9].map((start) => (
            <View key={start} style={styles.keyRow}>
              {KEYS.slice(start, start + 3).map((key) => (
                <Pressable
                  key={key}
                  style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
                  onPress={() => onKeyPress(key)}
                  accessibilityLabel={key === "backspace" ? "Delete amount digit" : key}
                >
                  {key === "backspace" ? (
                    <Ionicons name="backspace-outline" size={19} color="#F87171" />
                  ) : (
                    <Text style={styles.keyText}>{key}</Text>
                  )}
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Pressable
          style={({ pressed }) => [
            styles.reviewButton,
            styles.mainReviewButton,
            pressed && styles.reviewButtonDisabled,
          ]}
          onPress={reviewTransfer}
          disabled={loadingBalance}
        >
          <Text style={styles.reviewText}>Review Transfer</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={reviewing} transparent animationType="slide" onRequestClose={() => setReviewing(false)}>
        <View style={[styles.modalBackdrop, confirmed && styles.successBackdrop]}>
          <View
            style={
              confirmed
                ? styles.successCard
                : [styles.sheet, { paddingBottom: Math.max(insets.bottom, 20) }]
            }
          >
            {!confirmed && <View style={styles.sheetHandle} />}
            {confirmed ? (
              <View style={styles.confirmed}>
                <View style={styles.successIcon}>
                <Ionicons name="checkmark" size={28} color="#FFFFFF" />
                </View>
                <Text style={styles.sheetTitle}>Transfer successful</Text>
                <Text style={styles.successSub}>
                  Your money has been sent to {formatAccount(account)}. A receipt has been sent to your email.
                </Text>
                <Pressable style={[styles.reviewButton, styles.successAction]} onPress={returnHome}>
                  <Text style={styles.reviewText}>Back to Home</Text>
                </Pressable>
                <Pressable style={styles.shareButton} onPress={shareReceipt}>
                  <Text style={styles.shareText}>Share Receipt</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <Text style={styles.sheetTitle}>Review transfer</Text>
                <Text style={styles.sheetSub}>Check the details before continuing.</Text>
                <View style={styles.summary}>
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>TO</Text>
                    <Text style={styles.summaryValue}>{formatAccount(account)}</Text>
                  </View>
                  <View style={styles.summaryLine} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>AMOUNT</Text>
                    <Text style={styles.summaryAmount}>{money(numericAmount)}</Text>
                  </View>
                  <View style={styles.summaryLine} />
                  <View style={styles.summaryRow}>
                    <Text style={styles.summaryLabel}>TRANSFER TYPE</Text>
                    <Text style={styles.summaryValue}>{transferType}</Text>
                  </View>
                </View>
                {transferError && <Text style={styles.transferError}>{transferError}</Text>}
                <Pressable
                  style={({ pressed }) => [styles.reviewButton, (submitting || pressed) && styles.reviewButtonDisabled]}
                  onPress={confirmTransfer}
                  disabled={submitting}
                >
                  {submitting ? <ActivityIndicator color="#FFFFFF" /> : <Text style={styles.reviewText}>Confirm Details</Text>}
                </Pressable>
                <Pressable style={styles.cancelButton} onPress={() => setReviewing(false)}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#0A0E1A" },
  content: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 16 },
  title: { color: TEXT, fontSize: 21, fontWeight: "800", marginTop: 8 },
  subtitle: { color: MUTED, fontSize: 12, marginTop: 5 },
  label: { color: "#93C5FD", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 28, marginBottom: 7 },
  inputWrap: { height: 48, flexDirection: "row", alignItems: "center", borderRadius: 9, paddingHorizontal: 14, backgroundColor: "#15263D", borderWidth: 1, borderColor: "rgba(148,163,184,0.17)" },
  inputWrapActive: { borderColor: "rgba(96,165,250,0.55)" },
  input: { flex: 1, color: TEXT, fontSize: 16, fontWeight: "700", letterSpacing: 0.3 },
  typeLabel: { color: "#93C5FD", fontSize: 10, fontWeight: "800", letterSpacing: 0.8, marginTop: 16, marginBottom: 7 },
  typeOptions: { flexDirection: "row", gap: 8 },
  typeOption: { flex: 1, height: 36, borderRadius: 8, borderWidth: 1, borderColor: "rgba(148,163,184,0.2)", alignItems: "center", justifyContent: "center" },
  typeOptionSelected: { backgroundColor: "rgba(37,99,235,0.2)", borderColor: "#2563EB" },
  typeText: { color: MUTED, fontSize: 11, fontWeight: "800" },
  typeTextSelected: { color: "#93C5FD" },
  amountArea: { alignItems: "center", marginTop: 29, minHeight: 94 },
  amountLabel: { color: MUTED, fontSize: 9, letterSpacing: 1, marginBottom: 6 },
  amount: { color: TEXT, fontSize: 23, fontWeight: "800" },
  balance: { color: "#34D399", fontSize: 11, fontWeight: "600", marginTop: 9 },
  validation: { color: RED, fontSize: 11, marginTop: 5 },
  keypad: { flex: 1, gap: 8, marginTop: 12, marginBottom: 16 },
  keyRow: { flex: 1, flexDirection: "row", gap: 8 },
  key: { flex: 1, minHeight: 39, borderRadius: 7, backgroundColor: "#1A2D45", alignItems: "center", justifyContent: "center" },
  keyPressed: { backgroundColor: "#294568", transform: [{ scale: 0.98 }] },
  keyText: { color: TEXT, fontSize: 16, fontWeight: "800" },
  error: { color: RED, textAlign: "center", fontSize: 12, marginTop: 12 },
  reviewButton: { height: 47, borderRadius: 12, backgroundColor: "#0758D9", alignItems: "center", justifyContent: "center", marginTop: 16 },
  mainReviewButton: { marginTop: "auto" },
  reviewButtonDisabled: { opacity: 0.58 },
  reviewText: { color: "#FFFFFF", fontSize: 12, fontWeight: "800" },
  modalBackdrop: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.58)" },
  successBackdrop: { justifyContent: "center", paddingHorizontal: 34 },
  sheet: { backgroundColor: "#101C2E", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  sheetHandle: { width: 38, height: 4, borderRadius: 2, backgroundColor: "#475569", alignSelf: "center", marginBottom: 21 },
  sheetTitle: { color: TEXT, fontSize: 22, fontWeight: "800", textAlign: "center" },
  sheetSub: { color: MUTED, fontSize: 13, textAlign: "center", marginTop: 7 },
  summary: { marginTop: 24, padding: 16, borderRadius: 14, backgroundColor: "#16263B" },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryLabel: { color: MUTED, fontSize: 10, fontWeight: "800", letterSpacing: 0.8 },
  summaryValue: { color: TEXT, fontSize: 14, fontWeight: "700" },
  summaryAmount: { color: "#60A5FA", fontSize: 19, fontWeight: "800" },
  summaryLine: { height: 1, backgroundColor: "rgba(148,163,184,0.15)", marginVertical: 15 },
  cancelButton: { alignItems: "center", paddingVertical: 15 },
  cancelText: { color: MUTED, fontSize: 13, fontWeight: "700" },
  transferError: { color: RED, fontSize: 12, textAlign: "center", marginTop: 14 },
  successCard: { borderRadius: 18, backgroundColor: "#23364C", padding: 24 },
  confirmed: { alignItems: "center" },
  successIcon: { width: 62, height: 62, borderRadius: 31, backgroundColor: "#5EE7B7", borderWidth: 5, borderColor: "rgba(20,184,130,0.3)", alignItems: "center", justifyContent: "center", marginBottom: 17 },
  successSub: { color: "#CBD5E1", fontSize: 13, lineHeight: 19, textAlign: "center", marginTop: 8 },
  successAction: { alignSelf: "stretch" },
  shareButton: { alignSelf: "stretch", height: 44, borderRadius: 9, borderWidth: 1, borderColor: "#64748B", alignItems: "center", justifyContent: "center", marginTop: 9 },
  shareText: { color: "#CBD5E1", fontSize: 12, fontWeight: "800" },
});
