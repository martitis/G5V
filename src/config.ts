/**
 * Runtime configuration, read from /config.json when the app starts, so one build works for any deployment
 * (the API URL used to be baked in at build time). Falls back to VITE_API_URL, then to "/api".
 */
export interface AppConfig {
  /** Base URL of the G5API, e.g. "/api" behind the same reverse proxy, or "https://api.example.com". */
  apiUrl: string;
  /** Panel name in the app bar and browser tab. */
  title: string;
}

const config: AppConfig = {
  apiUrl: import.meta.env.VITE_API_URL || "/api",
  title: "CS2 Panel"
};

export async function loadConfig(): Promise<void> {
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}config.json`, { cache: "no-store" });
    if (response.ok) {
      const loaded = (await response.json()) as Partial<AppConfig>;
      if (loaded.apiUrl) config.apiUrl = loaded.apiUrl.replace(/\/+$/, "");
      if (loaded.title) config.title = loaded.title;
    }
  } catch {
    // No config.json: keep the defaults.
  }
}

export const appTitle = () => config.title;

export function apiUrl(path = ""): string {
  return config.apiUrl + (path && !path.startsWith("/") ? "/" : "") + path;
}
