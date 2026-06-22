import { GlobalStatusScreen } from "@/components/global-status-screen";
import { router, useLocalSearchParams } from "expo-router";
import { Share } from "react-native";

export default function SuccessScreen() {
  const { title, message, continueTo, primaryLabel } = useLocalSearchParams<{
    title?: string;
    message?: string;
    continueTo?: string;
    primaryLabel?: string;
  }>();

  const resolvedTitle = title || "Transfer Successful";
  const resolvedMessage =
    message || "Your transaction has been completed successfully.";

  return (
    <GlobalStatusScreen
      status="success"
      title={resolvedTitle}
      message={resolvedMessage}
      primaryLabel={primaryLabel || "Back to Home"}
      onPrimary={() => router.replace(continueTo || "/(tabs)")}
      secondaryLabel="Share Receipt"
      onSecondary={() =>
        Share.share({
          message: `${resolvedTitle}\n${resolvedMessage}`,
        })
      }
    />
  );
}
