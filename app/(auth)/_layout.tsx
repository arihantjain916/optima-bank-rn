import { Stack } from "expo-router";

// Dedicated auth stack. Screens draw their own headers, so the native one is
// off here too. Later this is where a Stack.Protected guard / redirect lives.
export default function AuthLayout() {
  return <Stack screenOptions={{ headerShown: false }} />;
}
