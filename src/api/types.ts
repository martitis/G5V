/** Shapes returned by G5API. Fields the panel doesn't use are reachable through the index signature. */

export interface User {
  id: number | null;
  steam_id: string;
  name: string;
  admin: boolean | number;
  super_admin: boolean | number;
  small_image: string;
  medium_image: string;
  large_image: string;
  /** Only for the logged-in user's own profile. */
  api_key?: string;
  challonge_api_key?: string;
  username?: string;
  [key: string]: unknown;
}

export interface TeamMember {
  name: string;
  captain: number | boolean;
  coach: number | boolean;
  image?: string;
}

export interface Team {
  id: number;
  user_id: number;
  name: string;
  tag: string;
  flag: string;
  logo: string | null;
  public_team: number | boolean;
  challonge_team_id?: number | null;
  /** steam id -> member */
  auth_name?: Record<string, TeamMember>;
  [key: string]: unknown;
}

export interface Match {
  id: number;
  user_id: number;
  server_id: number | null;
  team1_id: number | null;
  team2_id: number | null;
  winner: number | null;
  team1_score: number;
  team2_score: number;
  team1_series_score?: number;
  team2_series_score?: number;
  team1_string: string;
  team2_string: string;
  cancelled: number | null;
  forfeit: number | null;
  start_time: string | null;
  end_time: string | null;
  max_maps: number;
  title?: string;
  skip_veto?: number | boolean;
  season_id?: number | null;
  is_pug?: number | boolean;
  owner?: string;
  team1_mapscore?: number | null;
  team2_mapscore?: number | null;
  /** Only on /matches/mymatches. */
  server_name?: string | null;
  ip_string?: string | null;
  port?: number | null;
  api_key?: string;
  [key: string]: unknown;
}

export interface MapStat {
  id: number;
  match_id: number;
  winner: number | null;
  map_number: number;
  map_name: string | null;
  team1_score: number;
  team2_score: number;
  start_time: string | null;
  end_time: string | null;
  demoFile?: string | null;
  [key: string]: unknown;
}

export interface PlayerStat {
  id: number;
  match_id: number;
  map_id: number;
  team_id: number | null;
  steam_id: string;
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  roundsplayed: number;
  damage: number;
  headshot_kills: number;
  [key: string]: unknown;
}

export interface Server {
  id: number;
  user_id?: number;
  name?: string;
  display_name: string;
  ip_string?: string;
  port?: number;
  gotv_port?: number | null;
  public_server: number | boolean;
  in_use?: number | boolean;
  flag?: string;
  [key: string]: unknown;
}

export interface Season {
  id: number;
  user_id: number;
  name: string;
  start_date: string | null;
  end_date: string | null;
  challonge_url?: string | null;
  cvars?: Record<string, string>;
  [key: string]: unknown;
}

export interface Veto {
  id: number;
  match_id: number;
  team_name: string;
  map: string;
  pick_or_veto: "pick" | "veto" | string;
  [key: string]: unknown;
}

export interface VetoSide {
  id: number;
  match_id: number;
  veto_id: number;
  team_name: string;
  map: string;
  side: string;
  [key: string]: unknown;
}

export interface MapListEntry {
  id: number;
  user_id: number;
  map_name: string;
  map_display_name: string;
  enabled: number | boolean;
  inserted_at?: string;
}

export interface LeaderboardPlayer {
  steamId: string;
  name: string;
  kills: number;
  deaths: number;
  assists: number;
  k1: number;
  k2: number;
  k3: number;
  k4: number;
  k5: number;
  v1: number;
  v2: number;
  v3: number;
  v4: number;
  v5: number;
  trp: number;
  fba: number;
  total_damage: number;
  hsk: number;
  hsp: number;
  average_rating: number;
  wins: number;
  total_maps: number;
  enemies_flashed?: number;
  friendlies_flashed?: number;
  util_damage?: number;
}

export interface TeamStanding {
  id?: number;
  name: string;
  wins: number;
  losses: number;
  rounddiff: number;
}

export interface BackupEntry {
  file: string;
  map_number: number;
  round: number;
  info: string;
}

/** GET /matches/summary: one match list entry. */
export type MatchSummaryStatus =
  "pending" | "warmup" | "live" | "paused" | "finished" | "cancelled";

export interface SummaryTeam {
  id: number | null;
  name: string;
  tag: string | null;
  logo: string | null;
  flag: string | null;
  /** Maps won. */
  score: number;
}

export interface MatchSummary {
  id: number;
  title: string | null;
  status: MatchSummaryStatus;
  winner: 1 | 2 | null;
  forfeit: boolean;
  max_maps: number;
  season_id: number | null;
  is_pug: boolean;
  private_match: boolean;
  owner: { id: number; name: string | null };
  start_time: string | null;
  end_time: string | null;
  team1: SummaryTeam;
  team2: SummaryTeam;
  maps: {
    number: number;
    name: string | null;
    team1_score: number;
    team2_score: number;
    winner: 1 | 2 | null;
    finished: boolean;
  }[];
  current_map: {
    number: number;
    name: string | null;
    team1_score: number;
    team2_score: number;
    /** Rounds played; the current round is round + 1. */
    round: number;
    team1_side: "ct" | "t" | null;
  } | null;
  pause: { type: string | null; team: string | null } | null;
  server: { name: string | null; ip: string; port: number; gotv_port: number | null } | null;
}

export interface SummaryQuery {
  status?: "active" | "finished" | "cancelled" | "all";
  season_id?: number;
  team_id?: number;
  server_id?: number;
  mine?: boolean;
  q?: string;
  limit?: number;
  offset?: number;
}

/** POST /teams/members/resolve: one entry per identifier sent. */
export interface ResolvedMember {
  input: string;
  steam_id: string | null;
  name: string | null;
  image: string | null;
}
