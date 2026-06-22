import { GlobalStatusScreen } from "@/components/global-status-screen";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useCallback, useEffect, useState } from "react";

import { CustomSplash } from "@/components/custom-splash";
import { AuthProvider, useAuth } from "@/lib/auth";
import { getUserPreference } from "@/lib/storage";
import {
  authenticateAsync,
  hasHardwareAsync,
  isEnrolledAsync,
} from "expo-local-authentication";

// Module scope: must run before any component renders, or auto-hide wins the race.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  // AuthProvider has to wrap the navigator so the guard below can read the token.
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}

export function ErrorBoundary({
  error,
  retry,
}: {
  error: Error;
  retry: () => Promise<void>;
}) {
  return (
    <GlobalStatusScreen
      status="error"
      title="Something went wrong"
      message={
        error.message || "We couldn't complete that request. Please try again."
      }
      primaryLabel="Try Again"
      onPrimary={() => void retry()}
      secondaryLabel="Return Home"
      onSecondary={() => router.replace("/")}
    />
  );
}

function RootNavigator() {
  const { token, isLoading, signOut } = useAuth();
  const [splashGone, setSplashGone] = useState(false);
  const [biometricStatus, setBiometricStatus] = useState<
    "checking" | "unlocked" | "locked"
  >("checking");

  const verifyBiometrics = useCallback(async () => {
    if (isLoading) return;

    // Biometrics protect an existing signed-in session; never show a device
    // prompt before the user has authenticated or when the feature is off.
    if (!token) {
      setBiometricStatus("unlocked");
      return;
    }

    setBiometricStatus("checking");
    try {
      const enabled = await getUserPreference("biometrics");
      if (enabled !== "true") {
        setBiometricStatus("unlocked");
        return;
      }

      const available = (await hasHardwareAsync()) && (await isEnrolledAsync());
      if (!available) {
        setBiometricStatus("locked");
        return;
      }

      const result = await authenticateAsync({
        promptMessage: "Unlock Optima Bank",
        cancelLabel: "Cancel",
        disableDeviceFallback: true,
      });
      setBiometricStatus(result.success ? "unlocked" : "locked");
    } catch {
      setBiometricStatus("locked");
    }
  }, [isLoading, token]);

  useEffect(() => {
    void verifyBiometrics();
  }, [verifyBiometrics]);

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Logged OUT: onboarding + auth screens are reachable. */}
        <Stack.Protected guard={!token}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        {/* Logged IN: the tab app is reachable. */}
        <Stack.Protected guard={!!token}>
          <Stack.Screen name="(tabs)" />
        </Stack.Protected>

        {/* A global destination, but never the initial route. */}
        <Stack.Screen name="success" />
      </Stack>

      {biometricStatus === "locked" ? (
        <GlobalStatusScreen
          status="error"
          title="Unlock Optima Bank"
          message="Biometric verification is required to access your account."
          primaryLabel="Try Again"
          onPrimary={() => void verifyBiometrics()}
          secondaryLabel="Sign Out"
          onSecondary={() => void signOut()}
        />
      ) : null}

      {/* Splash stays up until session restoration and biometric verification finish. */}
      {!splashGone && biometricStatus !== "locked" && (
        <CustomSplash
          ready={!isLoading && biometricStatus === "unlocked"}
          onDone={() => setSplashGone(true)}
        />
      )}
    </>
  );
}
