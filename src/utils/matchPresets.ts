/**
 * Create-match presets and the shape of saved templates (GET/POST /templates).
 * Cvars here are ones MatchZy accepts in a match config: engine convars and MatchZy's own settings
 * (not its action commands).
 */
export interface MatchTemplateSettings {
  maps_to_win: number;
  map_pool: string[];
  veto_first: "team1" | "team2" | "random";
  side_type: "standard" | "never_knife" | "always_knife";
  skip_veto: boolean;
  players_per_team: number;
  min_players_to_ready: number;
  min_spectators_to_ready: number;
  wingman: boolean;
  cvars: Record<string, string>;
}

export interface MatchPreset {
  key: "official" | "scrim" | "pug";
  /** Translation key of the name and the description. */
  label: string;
  hint: string;
  /** map_pool is left out: a preset keeps the maps already picked. */
  settings: Omit<MatchTemplateSettings, "map_pool">;
}

export const MATCH_PRESETS: MatchPreset[] = [
  {
    key: "official",
    label: "Preset.Official",
    hint: "Preset.OfficialHint",
    settings: {
      maps_to_win: 3,
      veto_first: "team1",
      side_type: "standard",
      skip_veto: false,
      players_per_team: 5,
      min_players_to_ready: 5,
      min_spectators_to_ready: 0,
      wingman: false,
      cvars: {
        mp_overtime_enable: "1",
        mp_overtime_maxrounds: "6",
        mp_team_timeout_max: "3",
        matchzy_stop_command_available: "0",
        matchzy_pause_after_restore: "1"
      }
    }
  },
  {
    key: "scrim",
    label: "Preset.Scrim",
    hint: "Preset.ScrimHint",
    settings: {
      maps_to_win: 1,
      veto_first: "team1",
      side_type: "never_knife",
      skip_veto: false,
      players_per_team: 5,
      min_players_to_ready: 5,
      min_spectators_to_ready: 0,
      wingman: false,
      cvars: {
        // Play all 24 rounds, no overtime: scrims are practice.
        mp_match_can_clinch: "0",
        mp_overtime_enable: "0",
        matchzy_stop_command_available: "1",
        matchzy_enable_tech_pause: "1"
      }
    }
  },
  {
    key: "pug",
    label: "Preset.Pug",
    hint: "Preset.PugHint",
    settings: {
      maps_to_win: 1,
      veto_first: "random",
      side_type: "standard",
      skip_veto: false,
      players_per_team: 5,
      min_players_to_ready: 5,
      min_spectators_to_ready: 0,
      wingman: false,
      cvars: { mp_overtime_enable: "1", matchzy_stop_command_available: "0" }
    }
  }
];
