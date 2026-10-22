/**
 * Typed G5API calls. Every function returns the payload or throws an ApiError (see ./http).
 * Write endpoints read `req.body[0]` on the API, so bodies are sent as a one-element array.
 */
import { del, get, orEmpty, post, put, type MessageResponse } from "./http";
import type {
  BackupEntry,
  LeaderboardPlayer,
  MapListEntry,
  MapStat,
  Match,
  MatchSummary,
  ResolvedMember,
  PlayerStat,
  Season,
  Server,
  SummaryQuery,
  Team,
  TeamStanding,
  User,
  Veto,
  VetoSide
} from "./types";

type Body = Record<string, unknown>;
const wrap = (body: Body) => [body];

export const auth = {
  /** The logged-in user, or null when logged out. */
  async me(): Promise<User | null> {
    const data = await get<User | false>("/isLoggedIn");
    return data || null;
  },
  login: (username: string, password: string) =>
    post<MessageResponse>("/login", { username, password }),
  register: (username: string, password: string, steam_id: string) =>
    post<MessageResponse>("/register", { username, password, steam_id }),
  logout: () => post<MessageResponse>("/logout")
};

export const users = {
  get: async (id: number | string) => (await get<{ user: User }>(`/users/${id}`)).user,
  all: async () => (await orEmpty(get<{ users: User[] }>("/users"), { users: [] })).users,
  update: (body: Body) => put<MessageResponse>("/users", wrap(body)),
  recentMatches: async (id: number | string) =>
    (await orEmpty(get<{ matches: Match[] }>(`/users/${id}/recent`), { matches: [] })).matches
};

export const maps = {
  list: async (userId: number) =>
    (await orEmpty(get<{ maplist: MapListEntry[] }>(`/maps/${userId}`), { maplist: [] })).maplist,
  enabled: async (userId: number) =>
    (await orEmpty(get<{ maplist: MapListEntry[] }>(`/maps/${userId}/enabled`), { maplist: [] }))
      .maplist,
  create: (body: Body) => post<MessageResponse>("/maps", wrap(body)),
  update: (body: Body) => put<MessageResponse>("/maps", wrap(body)),
  remove: (body: Body) => del<MessageResponse>("/maps", wrap(body))
};

export const teams = {
  get: async (id: number | string) => (await get<{ team: Team }>(`/teams/${id}`)).team,
  basic: async (id: number | string) => (await get<{ team: Team }>(`/teams/${id}/basic`)).team,
  all: async () => (await orEmpty(get<{ teams: Team[] }>("/teams"), { teams: [] })).teams,
  mine: async () => (await orEmpty(get<{ teams: Team[] }>("/teams/myteams"), { teams: [] })).teams,
  recentMatches: async (id: number | string) =>
    (await orEmpty(get<{ matches: Match[] }>(`/teams/${id}/recent`), { matches: [] })).matches,
  result: async (teamId: number | string, matchId: number | string) =>
    (await get<{ result: string }>(`/teams/${teamId}/result/${matchId}`)).result,
  create: (body: Body) => post<MessageResponse & { id: number }>("/teams", wrap(body)),
  update: (body: Body) => put<MessageResponse>("/teams", wrap(body)),
  /** Deletes the team, or only one member when `steam_id` is given. */
  remove: (body: Body) => del<MessageResponse>("/teams", wrap(body)),
  importChallonge: (tournament_id: string) =>
    post<MessageResponse>("/teams/challonge", wrap({ tournament_id })),
  /** SteamID64, Steam name and avatar for any Steam identifiers (max 50); steam_id null when invalid. */
  resolveMembers: async (ids: string[]) =>
    (await post<{ members: ResolvedMember[] }>("/teams/members/resolve", wrap({ ids }))).members
};

export const matches = {
  get: async (id: number | string) => (await get<{ match: Match }>(`/matches/${id}`)).match,
  all: async () => (await orEmpty(get<{ matches: Match[] }>("/matches"), { matches: [] })).matches,
  mine: async () =>
    (await orEmpty(get<{ matches: Match[] }>("/matches/mymatches"), { matches: [] })).matches,
  limit: async (limit: number) =>
    (await orEmpty(get<{ matches: Match[] }>(`/matches/limit/${limit}`), { matches: [] })).matches,
  create: (body: Body) => post<MessageResponse & { id: number }>("/matches", wrap(body)),
  update: (body: Body) => put<MessageResponse>("/matches", wrap(body)),
  /** `{ match_id }` deletes one finished match, `{ all_cancelled: true }` all of the user's cancelled ones. */
  remove: (body: Body) => del<MessageResponse>("/matches", wrap(body)),
  /** The MatchZy config JSON (owner or super admin). */
  config: (id: number | string) => get<Record<string, unknown>>(`/matches/${id}/config`),
  streamUrl: (id: number | string) => `/matches/${id}/stream`,
  /** One page of the match list (live and upcoming first). */
  summary: (query: SummaryQuery) => {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null && value !== "" && value !== false)
        params.set(key, String(value));
    }
    return get<{ matches: MatchSummary[]; total: number }>(`/matches/summary?${params.toString()}`);
  },
  /** "summaries" events with the given and all active matches. */
  summaryStreamUrl: (ids: number[]) => `/matches/summary/stream?ids=${ids.join(",")}`,
  /** One stream with match, mapstats, playerstats, vetodata and vetosidedata events. */
  liveStreamUrl: (id: number | string) => `/matches/${id}/live/stream`,
  // Admin actions (RCON).
  pause: (id: number) => post<MessageResponse>(`/matches/${id}/pause`),
  unpause: (id: number) => post<MessageResponse>(`/matches/${id}/unpause`),
  cancel: (id: number) => post<MessageResponse>(`/matches/${id}/cancel`),
  restart: (id: number) => post<MessageResponse>(`/matches/${id}/restart`),
  forfeit: (id: number, winner: 1 | 2) => post<MessageResponse>(`/matches/${id}/forfeit/${winner}`),
  addPlayer: (id: number, body: Body) =>
    put<MessageResponse & { response?: string }>(`/matches/${id}/adduser`, wrap(body)),
  removePlayer: (id: number, steam_id: string) =>
    put<MessageResponse & { response?: string }>(`/matches/${id}/removeuser`, wrap({ steam_id })),
  addSpectator: (id: number, body: Body) =>
    put<MessageResponse & { response?: string }>(`/matches/${id}/addspec`, wrap(body)),
  rcon: (id: number, rcon_command: string) =>
    put<MessageResponse & { response?: string }>(`/matches/${id}/rcon`, wrap({ rcon_command })),
  backups: async (id: number) =>
    (await get<{ response: BackupEntry[] }>(`/matches/${id}/backup`)).response ?? [],
  restoreBackup: (id: number, backup_name: string) =>
    post<MessageResponse & { response?: string }>(`/matches/${id}/backup`, wrap({ backup_name })),
  remoteBackups: async (id: number) =>
    (await orEmpty(get<{ response: string[] }>(`/matches/${id}/backup/remote`), { response: [] }))
      .response ?? [],
  restoreRemoteBackup: (id: number, server_id: number, backup_file: string) =>
    post<MessageResponse & { response?: string }>(
      `/matches/${id}/backup/remote`,
      wrap({ server_id, backup_file })
    )
};

export const servers = {
  get: async (id: number | string) => (await get<{ server: Server }>(`/servers/${id}`)).server,
  all: async () => (await orEmpty(get<{ servers: Server[] }>("/servers"), { servers: [] })).servers,
  mine: async () =>
    (await orEmpty(get<{ servers: Server[] }>("/servers/myservers"), { servers: [] })).servers,
  available: async () =>
    (await orEmpty(get<{ servers: Server[] }>("/servers/available"), { servers: [] })).servers,
  publicCount: async () => (await get<{ servers: number }>("/servers/publiccount")).servers,
  status: (id: number) => get<MessageResponse>(`/servers/${id}/status`),
  /** The RCON password (owner or super admin only). */
  rconPassword: async (id: number) =>
    (await get<{ rcon_password: string }>(`/servers/${id}/rcon`)).rcon_password,
  create: (body: Body) => post<MessageResponse>("/servers", wrap(body)),
  update: (body: Body) => put<MessageResponse>("/servers", wrap(body)),
  remove: (server_id: number) => del<MessageResponse>("/servers", wrap({ server_id }))
};

export const seasons = {
  all: async () => (await orEmpty(get<{ seasons: Season[] }>("/seasons"), { seasons: [] })).seasons,
  mine: async () =>
    (await orEmpty(get<{ seasons: Season[] }>("/seasons/myseasons"), { seasons: [] })).seasons,
  available: async () =>
    (await orEmpty(get<{ seasons: Season[] }>("/seasons/myseasons/available"), { seasons: [] }))
      .seasons,
  get: (id: number | string) => get<{ season: Season; matches: Match[] }>(`/seasons/${id}`),
  cvars: async (id: number | string) =>
    (await orEmpty(get<{ cvars: Record<string, string> }>(`/seasons/${id}/cvar`), { cvars: {} }))
      .cvars,
  create: (body: Body) => post<MessageResponse & { id: number }>("/seasons", wrap(body)),
  update: (body: Body) => put<MessageResponse>("/seasons", wrap(body)),
  remove: (season_id: number) => del<MessageResponse>("/seasons", wrap({ season_id })),
  importChallonge: (body: Body) => post<MessageResponse>("/seasons/challonge", wrap(body))
};

export const stats = {
  /** Totals of a player (by Steam ID), optionally per season. */
  player: async (steamId: string) =>
    (
      await orEmpty(get<{ playerstats: PlayerStat[] }>(`/playerstats/${steamId}`), {
        playerstats: []
      })
    ).playerstats,
  uniquePlayers: async () => (await get<{ count: number }>("/playerstats/unique")).count,
  /** Site-wide counters (users, teams, matches, ...). */
  metrics: async () => (await get<{ metrics: Record<string, number> }>("/metrics")).metrics,
  ofMatch: async (matchId: number | string) =>
    (
      await orEmpty(get<{ playerstats: PlayerStat[] }>(`/playerstats/match/${matchId}`), {
        playerstats: []
      })
    ).playerstats,
  matchStreamUrl: (matchId: number | string) => `/playerstats/match/${matchId}/stream`,
  playerRecentMatches: async (steamId: string) =>
    (await orEmpty(get<{ matches: Match[] }>(`/playerstats/${steamId}/recent`), { matches: [] }))
      .matches,
  maps: async (matchId: number | string) =>
    (await orEmpty(get<{ mapstats: MapStat[] }>(`/mapstats/${matchId}`), { mapstats: [] }))
      .mapstats,
  allMaps: async () =>
    (await orEmpty(get<{ mapstats: MapStat[] }>("/mapstats"), { mapstats: [] })).mapstats,
  map: async (matchId: number | string, mapNumber: number) =>
    (await get<{ mapstat: MapStat }>(`/mapstats/${matchId}/${mapNumber}`)).mapstat,
  mapStreamUrl: (matchId: number | string) => `/mapstats/${matchId}/stream`
};

export const vetoes = {
  ofMatch: async (matchId: number | string) =>
    (await orEmpty(get<{ vetoes: Veto[] }>(`/vetoes/${matchId}`), { vetoes: [] })).vetoes,
  sidesOfMatch: async (matchId: number | string) =>
    (await orEmpty(get<{ vetoes: VetoSide[] }>(`/vetosides/${matchId}`), { vetoes: [] })).vetoes,
  streamUrl: (matchId: number | string) => `/vetoes/${matchId}/stream`,
  sidesStreamUrl: (matchId: number | string) => `/vetosides/${matchId}/stream`
};

export const leaderboard = {
  teams: async (seasonId?: number | string) =>
    (
      await orEmpty(
        get<{ leaderboard: TeamStanding[] }>(
          seasonId ? `/leaderboard/${seasonId}` : "/leaderboard"
        ),
        { leaderboard: [] }
      )
    ).leaderboard,
  players: async (seasonId?: number | string, pug = false) =>
    (
      await orEmpty(
        get<{ leaderboard: LeaderboardPlayer[] }>(
          pug
            ? "/leaderboard/players/pug"
            : seasonId
              ? `/leaderboard/players/${seasonId}`
              : "/leaderboard/players"
        ),
        { leaderboard: [] }
      )
    ).leaderboard
};
