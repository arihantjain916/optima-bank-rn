import * as SecureStore from "expo-secure-store";

// expo-secure-store keeps the token in the OS keychain/keystore — encrypted,
// per-app, and NOT readable like AsyncStorage. This is where auth tokens live.
const TOKEN_KEY = "optima.auth.token";
const EMAIL_KEY = "optima.auth.email";

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}

// We also remember the user's email — endpoints like /api/dashboard/<email>
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
