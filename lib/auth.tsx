import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { clearToken, getToken, setToken } from "./storage";

type AuthState = {
  /** null = logged out. This is the single source of truth the guard reads. */
  token: string | null;
  /** true while we read the token from secure-store on boot. */
  isLoading: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session once on app start. The root layout keeps the splash up
  // until this finishes, so there's no logged-out flash for returning users.
  useEffect(() => {
    (async () => {
      try {
        const stored = await getToken();
        // dev-only: brief pause so the custom splash is visible. Remove later.
        await new Promise((r) => setTimeout(r, 600));
        setTokenState(stored);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(newToken: string) {
    await setToken(newToken);
    setTokenState(newToken); // flips the guard -> redirects into (tabs)
  }

  async function signOut() {
    await clearToken();
    setTokenState(null); // flips the guard -> redirects back to auth
  }

  return (
    <AuthContext.Provider value={{ token, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
