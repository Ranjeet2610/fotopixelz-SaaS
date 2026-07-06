import { API_BASE_URL } from "@/lib/api-client";

export function startGoogleOAuth(nextPath?: string | null) {
  const next =
    nextPath && nextPath.startsWith("/") && !nextPath.startsWith("//")
      ? nextPath
      : "/dashboard";

  const url = new URL(`${API_BASE_URL}/auth/google`);
  url.searchParams.set("next", next);
  window.location.assign(url.toString());
}
