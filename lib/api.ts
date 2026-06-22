import { getToken } from "./storage";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api";

export async function api<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = await getToken();
  const method = options.method ?? "GET";
  console.log("path", method, ":", path);
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  // Read the body exactly once — you can't read a Response body twice.
  const raw = await res.text();
  let data: unknown = null;
  try {
    data = raw ? JSON.parse(raw) : null;
  } catch {
    // not JSON (usually an HTML error page) — handled below
  }

  if (!res.ok) {
    const message =
      (data as { message?: string })?.message ?? `HTTP ${res.status}`;
    throw new Error(`${method} ${path} → ${message}`);
  }

  // 2xx but the body wasn't JSON: say so clearly instead of crashing on "<".
  if (data === null && raw) {
    throw new Error(
      `${method} ${path} → expected JSON, got: ${raw.slice(0, 80)}`,
    );
  }

  return data as T;
}
