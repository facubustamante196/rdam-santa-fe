export const BACKEND_BASE_URL =
  process.env.API_BASE_URL ??
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "http://localhost:3000";

export function buildBackendUrl(
  path: string,
  query?: Record<string, string | number | undefined | null>,
) {
  const base = new URL(BACKEND_BASE_URL);
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(normalized, base.toString());

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "") {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}
