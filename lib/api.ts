import { getToken } from "./storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

type ErrorPayload = {
  message?: unknown;
  error?: unknown;
  data?: unknown;
};

function fallbackErrorMessage(status: number) {
  if (status === 401 || status === 403) {
    return "Your session has expired. Please sign in again.";
  }
  if (status === 404) {
    return "The requested information could not be found.";
  }
  if (status >= 500) {
    return "Our service is temporarily unavailable. Please try again.";
  }
  return "We couldn't complete that request. Please review your details and try again.";
}

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    // This is a React Native bearer-token client. Never send persisted native
    // cookies: the backend may otherwise select an old cookie before this JWT.
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // The user-facing fallback below intentionally avoids exposing raw server output.
  }

  if (!res.ok) {
    const payload = data as ErrorPayload;
    const backendMessage = [
      payload?.message,
      payload?.error,
      payload?.data,
    ].find(
      (value): value is string =>
        typeof value === "string" && value.trim().length > 0,
    );
    throw new Error(backendMessage ?? fallbackErrorMessage(res.status));
  }

  if (data === null && raw) {
    throw new Error("We received an unexpected response. Please try again.");
  }

  return data as T;
}
