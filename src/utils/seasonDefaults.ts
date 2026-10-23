/**
 * Season "match defaults" are stored as season cvars with reserved names (as in the old panel);
 * every other season cvar is a real server cvar copied into each match of the season.
 */
export type SideType = "standard" | "never_knife" | "always_knife";
export type MapSide = "team1_ct" | "team1_t" | "knife";

export interface SeasonDefaults {
  /** Number of maps in the series (BoN). */
  maps_to_win: number;
  players_per_team: number;
  /** Per team (MatchZy's ReadySystem counts each team separately). */
  min_players_to_ready: number;
  min_spectators_to_ready: number;
  skip_veto: boolean;
  wingman: boolean;
  side_type: SideType;
  map_pool: string[];
  map_sides: MapSide[];
  spectators: string[];
}

export const RESERVED_KEYS = [
  "maps_to_win",
  "players_per_team",
  "min_players_to_ready",
  "min_spectators_to_ready",
  "skip_veto",
  "wingman",
  "side_type",
  "map_pool",
  "map_sides",
  "spectators"
] as const;

export const emptyDefaults = (): SeasonDefaults => ({
  maps_to_win: 1,
  players_per_team: 5,
  min_players_to_ready: 5,
  min_spectators_to_ready: 0,
  skip_veto: false,
  wingman: false,
  side_type: "standard",
  map_pool: [],
  map_sides: [],
  spectators: []
});

const words = (value: string | undefined) => (value ?? "").split(" ").filter(Boolean);
const int = (value: string | undefined, fallback: number) => {
  const parsed = parseInt(value ?? "", 10);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const bool = (value: string | undefined) =>
  value != null && value !== "0" && value !== "false" && value !== "";

/** Splits stored season cvars into the match defaults and the remaining server cvars. */
export function parseSeasonCvars(cvars: Record<string, string>): {
  defaults: SeasonDefaults;
  cvars: Record<string, string>;
} {
  const base = emptyDefaults();
  const defaults: SeasonDefaults = {
    maps_to_win: int(cvars.maps_to_win, base.maps_to_win),
    players_per_team: int(cvars.players_per_team, base.players_per_team),
    min_players_to_ready: int(cvars.min_players_to_ready, base.min_players_to_ready),
    min_spectators_to_ready: int(cvars.min_spectators_to_ready, base.min_spectators_to_ready),
    skip_veto: bool(cvars.skip_veto),
    wingman: bool(cvars.wingman),
    side_type: (["standard", "never_knife", "always_knife"].includes(cvars.side_type)
      ? cvars.side_type
      : base.side_type) as SideType,
    map_pool: words(cvars.map_pool),
    map_sides: words(cvars.map_sides) as MapSide[],
    spectators: words(cvars.spectators)
  };
  const rest = Object.fromEntries(
    Object.entries(cvars).filter(([key]) => !(RESERVED_KEYS as readonly string[]).includes(key))
  );
  return { defaults, cvars: rest };
}

/** The `season_cvar` object the API stores: server cvars plus the defaults under their reserved names. */
export function serializeSeasonCvars(
  defaults: SeasonDefaults,
  cvars: Record<string, string>
): Record<string, string> {
  return {
    ...cvars,
    maps_to_win: String(defaults.maps_to_win),
    players_per_team: String(defaults.players_per_team),
    min_players_to_ready: String(defaults.min_players_to_ready),
    min_spectators_to_ready: String(defaults.min_spectators_to_ready),
    skip_veto: defaults.skip_veto ? "1" : "0",
    wingman: defaults.wingman ? "1" : "0",
    side_type: defaults.side_type,
    map_pool: defaults.map_pool.join(" "),
    map_sides: defaults.skip_veto
      ? defaults.map_sides.slice(0, defaults.maps_to_win).join(" ")
      : "",
    spectators: defaults.spectators.join(" ")
  };
}
