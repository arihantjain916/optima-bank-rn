import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { CustomSplash } from "@/components/custom-splash";

// Module scope: must run before any component renders, or auto-hide wins the race.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [ready, setReady] = useState(false);
  const [splashGone, setSplashGone] = useState(false);

  // Boot work: do async startup here (load fonts, read auth token from
  // secure-store) and only flip `ready` once it's all done.
  useEffect(() => {
    async function prepare() {
      try {
        // TODO: await loadFonts(); await restoreSession();
        await new Promise((r) => setTimeout(r, 1800)); // dev-only: lets the splash be seen
      } finally {
        setReady(true);
      }
    }
    prepare();
  }, []);

  // Note: we no longer call SplashScreen.hideAsync() here — CustomSplash hides
  // the native splash once its own view paints, then fades itself out.
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}  />
      {!splashGone && <CustomSplash ready={ready} onDone={() => setSplashGone(true)} />}
    </>
  );
}
