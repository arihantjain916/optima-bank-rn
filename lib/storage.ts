import * as SecureStore from "expo-secure-store";

// expo-secure-store keeps the token in the OS keychain/keystore — encrypted,
// per-app, and NOT readable like AsyncStorage. This is where auth tokens live.
const TOKEN_KEY = "optima.auth.token";
const EMAIL_KEY = "optima.auth.email";
const USER_INFO_KEY = "optima.auth.user-info";

export type StoredUserInfo = {
  id: string;
  email: string;
  name?: string;
  account_no?: string;
  password_updated_at?: string;
};

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

// We also remember the user's email for display and MFA verification.
// need it, and it's not worth decoding the JWT on every screen.
export function getEmail(): Promise<string | null> {
  return SecureStore.getItemAsync(EMAIL_KEY);
}

export function setEmail(email: string): Promise<void> {
  return SecureStore.setItemAsync(EMAIL_KEY, email);
}

export function clearEmail(): Promise<void> {
  return SecureStore.deleteItemAsync(EMAIL_KEY);
}

export async function getStoredUserInfo(): Promise<StoredUserInfo | null> {
  const raw = await SecureStore.getItemAsync(USER_INFO_KEY);
  if (!raw) return null;

  try {
    const value = JSON.parse(raw) as StoredUserInfo;
    return value.id && value.email ? value : null;
  } catch {
    return null;
  }
}

export function setStoredUserInfo(userInfo: StoredUserInfo): Promise<void> {
  return SecureStore.setItemAsync(USER_INFO_KEY, JSON.stringify(userInfo));
}

export function clearStoredUserInfo(): Promise<void> {
  return SecureStore.deleteItemAsync(USER_INFO_KEY);
}

export function getUserPreference(key: string) {
  return SecureStore.getItemAsync(key);
}

export function setUserPreference(key: string, value: string) {
  return SecureStore.setItemAsync(key, value);
}
