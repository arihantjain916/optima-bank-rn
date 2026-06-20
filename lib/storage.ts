import * as SecureStore from "expo-secure-store";

// expo-secure-store keeps the token in the OS keychain/keystore — encrypted,
// per-app, and NOT readable like AsyncStorage. This is where auth tokens live.
const TOKEN_KEY = "optima.auth.token";

export function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY);
}

export function setToken(token: string): Promise<void> {
  return SecureStore.setItemAsync(TOKEN_KEY, token);
}

export function clearToken(): Promise<void> {
  return SecureStore.deleteItemAsync(TOKEN_KEY);
}
