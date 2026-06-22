import { GlobalStatusScreen } from "@/components/global-status-screen";
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useState } from "react";

import { CustomSplash } from "@/components/custom-splash";
import { AuthProvider, useAuth } from "@/lib/auth";

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
        error.message ||
        "We couldn't complete that request. Please try again."
      }
      primaryLabel="Try Again"
      onPrimary={() => void retry()}
      secondaryLabel="Return Home"
      onSecondary={() => router.replace("/")}
    />
  );
}

function RootNavigator() {
  const { token, isLoading } = useAuth();
  const [splashGone, setSplashGone] = useState(false);

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

      {/* Splash stays up until the session is restored (isLoading -> false). */}
      {!splashGone && (
        <CustomSplash ready={!isLoading} onDone={() => setSplashGone(true)} />
      )}
    </>
  );
}
