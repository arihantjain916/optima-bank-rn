import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import {
  clearEmail,
  clearToken,
  getEmail,
  getToken,
  setEmail,
  setToken,
} from "./storage";

type AuthState = {
  /** null = logged out. This is the single source of truth the guard reads. */
  token: string | null;
  /** the logged-in user's email, used to build per-user endpoints. */
  email: string | null;
  /** true while we read the session from secure-store on boot. */
  isLoading: boolean;
  signIn: (token: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [email, setEmailState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore the session once on app start. The root layout keeps the splash up
  // until this finishes, so there's no logged-out flash for returning users.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedEmail] = await Promise.all([getToken(), getEmail()]);
        // dev-only: brief pause so the custom splash is visible. Remove later.
        await new Promise((r) => setTimeout(r, 600));
        setTokenState(storedToken);
        setEmailState(storedEmail);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(newToken: string, newEmail: string) {
    await Promise.all([setToken(newToken), setEmail(newEmail)]);
    setTokenState(newToken); // flips the guard -> redirects into (tabs)
    setEmailState(newEmail);
  }

  async function signOut() {
    await Promise.all([clearToken(), clearEmail()]);
    setTokenState(null); // flips the guard -> redirects back to auth
    setEmailState(null);
  }

  return (
    <AuthContext.Provider value={{ token, email, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
