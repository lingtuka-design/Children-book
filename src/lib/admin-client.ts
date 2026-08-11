/** Extracts a readable message from an unknown error. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again.") {
  return e instanceof Error ? e.message : fallback;
}

/** CSRF token from the double-submit cookie set at login. */
export function csrfToken() {
  if (typeof document === "undefined") return "";
  const match = document.cookie
    .split("; ")
    .find((c) => c.startsWith("csrf_token="));
  return match ? match.slice("csrf_token=".length) : "";
}

/** Admin API helper: attaches the CSRF header and handles 401/errors. */
export async function api<T = unknown>(
  url: string,
  opts: RequestInit = {}
): Promise<T> {
  const headers = new Headers(opts.headers);
  headers.set("x-csrf-token", csrfToken());

  const res = await fetch(url, { ...opts, headers });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/admin/login");
    }
    throw new Error("Your session has expired. Please sign in again.");
  }
  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(
      (data as { error?: string } | null)?.error ?? "Something went wrong. Please try again."
    );
  }
  return data as T;
}
