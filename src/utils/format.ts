/** Display helpers shared by the pages (were mixin methods in the old panel). */
import type { Match, MapListEntry } from "@/api/types";
import { apiUrl } from "@/config";

const base = import.meta.env.BASE_URL;

/** Valve flag codes available in public/img/valve_flags. */
export const FLAGS = [
  "AE",
  "AR",
  "AT",
  "AU",
  "BD",
  "BE",
  "BG",
  "BR",
  "BY",
  "CA",
  "CC",
  "CH",
  "CL",
  "CN",
  "CZ",
  "DE",
  "DK",
  "DZ",
  "EE",
  "ES",
  "EU",
  "FI",
  "FR",
  "GB",
  "GP",
  "GR",
  "HK",
  "HR",
  "HU",
  "ID",
  "IE",
  "IL",
  "IN",
  "IR",
  "IS",
  "IT",
  "JP",
  "KR",
  "KZ",
  "LT",
  "LU",
  "LV",
  "LY",
  "MK",
  "MO",
  "MX",
  "MY",
  "NL",
  "NO",
  "NZ",
  "PE",
  "PH",
  "PK",
  "PL",
  "PT",
  "RE",
  "RO",
  "RS",
  "RU",
  "SA",
  "SE",
  "SG",
  "SI",
  "SK",
  "SQ",
  "TH",
  "TR",
  "TW",
  "UA",
  "US",
  "VE",
  "VN",
  "ZA"
];

export function flagUrl(flag: string | null | undefined): string {
  return flag ? `${base}img/valve_flags/${flag.toLowerCase()}.png` : `${base}img/_unknown.png`;
}

const KNOWN_MAPS = [
  "de_ancient",
  "de_anubis",
  "de_cache",
  "de_dust2",
  "de_inferno",
  "de_mirage",
  "de_nuke",
  "de_overpass",
  "de_train",
  "de_vertigo"
];

export function mapImageUrl(mapName: string | null | undefined): string {
  return mapName && KNOWN_MAPS.includes(mapName)
    ? `${base}img/maps/${mapName}.jpg`
    : `${base}img/maps/_unknown.jpg`;
}

/** Team logo served by the API. The DB stores only the name; the file is .png or .svg (TeamLogo falls back). */
export function logoUrl(logo: string, ext: "png" | "svg" = "png"): string {
  return apiUrl(`/static/img/logos/${encodeURIComponent(logo)}.${ext}`);
}

export function steamProfileUrl(steamId: string): string {
  return `https://steamcommunity.com/profiles/${steamId}`;
}

/** "de_mirage" -> "Mirage", using the user's map list names when known. */
export function mapDisplayName(mapName: string | null | undefined, mapList: MapListEntry[] = []) {
  if (!mapName) return "";
  const known = mapList.find((map) => map.map_name === mapName);
  if (known) return known.map_display_name;
  return mapName.replace(/^de_/, "").replace(/^\w/, (c) => c.toUpperCase());
}

type StatLine = {
  kills: number;
  deaths: number;
  headshot_kills?: number;
  damage?: number;
  roundsplayed?: number;
};

export const kdr = (s: StatLine) => (s.deaths ? (s.kills / s.deaths).toFixed(2) : String(s.kills));
export const hsp = (s: StatLine) =>
  s.kills ? (((s.headshot_kills ?? 0) / s.kills) * 100).toFixed(1) : "0";
export const adr = (s: StatLine) =>
  s.roundsplayed ? ((s.damage ?? 0) / s.roundsplayed).toFixed(1) : "0";
export const fpr = (s: StatLine) => (s.roundsplayed ? (s.kills / s.roundsplayed).toFixed(2) : "0");

/** HLTV 1.0-style rating, same formula as the API (utils.getRating). */
export function rating(
  kills = 0,
  rounds = 0,
  deaths = 0,
  k1 = 0,
  k2 = 0,
  k3 = 0,
  k4 = 0,
  k5 = 0
): string {
  if (!rounds) return "0.00";
  const killRating = kills / rounds / 0.679;
  const survivalRating = (rounds - deaths) / rounds / 0.317;
  const multiKillRating = (k1 + 4 * k2 + 9 * k3 + 16 * k4 + 25 * k5) / rounds / 1.277;
  return ((killRating + 0.7 * survivalRating + multiKillRating) / 2.7).toFixed(2);
}

export const isCancelled = (m: Match) => m.cancelled == 1;
export const isFinished = (m: Match) => m.end_time != null || m.forfeit == 1 || isCancelled(m);
export const isLive = (m: Match) => !isFinished(m) && m.start_time != null;

/** Map or series score to show for a match: BO1 shows the current map's rounds. */
export function displayScore(m: Match): [number, number] {
  if (m.max_maps == 1 && m.team1_mapscore != null) {
    return [m.team1_mapscore ?? 0, m.team2_mapscore ?? 0];
  }
  return [m.team1_score ?? 0, m.team2_score ?? 0];
}

/** Local date/time for API timestamps ("2026-10-21T15:30:00.000Z" or "2026-10-21 15:30:00"). */
export function formatDateTime(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return isNaN(date.getTime()) ? value : date.toLocaleString();
}

/** Seconds since an API timestamp, or null when there is none. */
export function secondsSince(value: string | null | undefined, now = Date.now()): number | null {
  if (!value) return null;
  const date = new Date(value.includes("T") ? value : value.replace(" ", "T") + "Z");
  return isNaN(date.getTime()) ? null : Math.max(0, Math.round((now - date.getTime()) / 1000));
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  return isNaN(date.getTime()) ? value : date.toLocaleDateString();
}

/** "YYYY-MM-DD" in local time, for <input type="date">; "" when the value is empty or invalid. */
export function toDateInput(value: string | null | undefined): string {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export type SeasonStatus = "upcoming" | "active" | "ended";
export function seasonStatus(season: {
  start_date: string | null;
  end_date: string | null;
}): SeasonStatus {
  const today = toDateInput(new Date().toISOString());
  const start = toDateInput(season.start_date);
  const end = toDateInput(season.end_date);
  if (start && start > today) return "upcoming";
  if (end && end < today) return "ended";
  return "active";
}

/** A match title worth showing: Get5's default template ("Map {MAPNUMBER} of {MAXMAPS}") is not one. */
export function matchTitle(title: string | null | undefined): string {
  return title && !/\{[A-Z_]+\}/.test(title) ? title : "";
}

/** Valid SteamID64 (individual account). */
/** Connect links for a game server; the join password goes into the link and the console command. */
export function connectLinks(
  host: string,
  port: number | string | undefined,
  gotvPort: number | null | undefined,
  password?: string | null
) {
  const address = `${host}:${port}`;
  return {
    address,
    play: `steam://connect/${address}${password ? `/${encodeURIComponent(password)}` : ""}`,
    command: password ? `connect ${address}; password ${password}` : `connect ${address}`,
    gotv: gotvPort ? `steam://connect/${host}:${gotvPort}` : null
  };
}

export const isSteamId64 = (value: string) => /^7656\d{13}$/.test(value.trim());
