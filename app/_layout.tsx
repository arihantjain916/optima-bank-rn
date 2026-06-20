import { Stack } from "expo-router";
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
      </Stack>

      {/* Splash stays up until the session is restored (isLoading -> false). */}
      {!splashGone && (
        <CustomSplash ready={!isLoading} onDone={() => setSplashGone(true)} />
      )}
    </>
  );
}
