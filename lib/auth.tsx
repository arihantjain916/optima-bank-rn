import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";

import {
  clearEmail,
  clearStoredUserInfo,
  clearToken,
  getEmail,
  getStoredUserInfo,
  getToken,
  setEmail,
  setStoredUserInfo,
  setToken,
} from "./storage";
import { api } from "./api";
import type { StoredUserInfo } from "./storage";

export type UserInfo = StoredUserInfo & {
  currentBalance?: number;
  openingBalance?: number;
  sentTransaction?: unknown[];
  receivedTransaction?: unknown[];
  [key: string]: unknown;
};

type AuthState = {
  /** null = logged out. This is the single source of truth the guard reads. */
  token: string | null;
  /** The logged-in user's email, used for display and MFA verification. */
  email: string | null;
  /** true while we read the session from secure-store on boot. */
  isLoading: boolean;
  /** Full dashboard payload for this app session. */
  userInfo: UserInfo | null;
  /** Refreshes the full in-memory dashboard payload once when needed. */
  refreshUserInfo: (force?: boolean) => Promise<UserInfo | null>;
  /** Updates cached profile fields after a successful account mutation. */
  updateUserInfo: (updates: Partial<UserInfo>) => Promise<void>;
  signIn: (token: string, email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | undefined>(undefined);

async function fetchUserInfo(email: string): Promise<UserInfo> {
  const result = await api<{ data: UserInfo }>("/dashboard/me");
  return { ...result.data, email: result.data.email || email };
}

function stableUserInfo(userInfo: UserInfo): StoredUserInfo {
  return {
    id: userInfo.id,
    email: userInfo.email,
    ...(typeof userInfo.name === "string" ? { name: userInfo.name } : {}),
    ...(typeof userInfo.account_no === "string"
      ? { account_no: userInfo.account_no }
      : {}),
    ...(typeof userInfo.password_updated_at === "string"
      ? { password_updated_at: userInfo.password_updated_at }
      : {}),
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState<string | null>(null);
  const [email, setEmailState] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const fetchedDashboardFor = useRef<string | null>(null);

  const refreshUserInfo = useCallback(async (force = false) => {
    if (!email) return null;
    if (!force && fetchedDashboardFor.current === email && userInfo) return userInfo;

    try {
      const dashboard = await fetchUserInfo(email);
      setUserInfo(dashboard);
      fetchedDashboardFor.current = email;
      await setStoredUserInfo(stableUserInfo(dashboard));
      return dashboard;
    } catch {
      return null;
    }
  }, [email]);

  const updateUserInfo = useCallback(
    async (updates: Partial<UserInfo>) => {
      if (!userInfo) return;
      const next = { ...userInfo, ...updates };
      setUserInfo(next);
      await setStoredUserInfo(stableUserInfo(next));
    },
    [userInfo],
  );

  // Restore the session once on app start. The root layout keeps the splash up
  // until this finishes, so there's no logged-out flash for returning users.
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedEmail, storedUserInfo] = await Promise.all([
          getToken(),
          getEmail(),
          getStoredUserInfo(),
        ]);
        let dashboard = storedUserInfo as UserInfo | null;
        if (storedToken && storedEmail) {
          try {
            dashboard = await fetchUserInfo(storedEmail);
            fetchedDashboardFor.current = storedEmail;
            await setStoredUserInfo(stableUserInfo(dashboard));
          } catch {
            // Keep the saved identity available and let a screen retry later.
          }
        }

        // dev-only: brief pause so the custom splash is visible. Remove later.
        await new Promise((r) => setTimeout(r, 600));
        setTokenState(storedToken);
        setEmailState(storedEmail);
        setUserInfo(dashboard);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  async function signIn(newToken: string, newEmail: string) {
    await Promise.all([setToken(newToken), setEmail(newEmail)]);
    let dashboard: UserInfo | null = null;
    try {
      dashboard = await fetchUserInfo(newEmail);
      fetchedDashboardFor.current = newEmail;
      await setStoredUserInfo(stableUserInfo(dashboard));
    } catch {
      // The session still succeeds; the regular refresh can retry later.
    }
    setTokenState(newToken); // flips the guard -> redirects into (tabs)
    setEmailState(newEmail);
    setUserInfo(dashboard);
  }

  async function signOut() {
    // Local credentials are removed even when the device is offline or the
    // server has already invalidated the session.
    await api("/auth/logout", { method: "POST" }).catch(() => undefined);
    await Promise.all([clearToken(), clearEmail(), clearStoredUserInfo()]);
    setTokenState(null); // flips the guard -> redirects back to auth
    setEmailState(null);
    setUserInfo(null);
    fetchedDashboardFor.current = null;
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        email,
        isLoading,
        userInfo,
        refreshUserInfo,
        updateUserInfo,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
