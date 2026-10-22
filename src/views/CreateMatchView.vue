<template>
  <v-container fluid style="max-width: 1100px">
    <v-skeleton-loader v-if="loading" type="card, card, card" />
    <v-form v-else ref="formRef" @submit.prevent="create">
      <div class="text-headline-small mb-4">{{ $t("CreateMatch.Title") }}</div>

      <!-- Server & season -->
      <v-card class="mb-4" :title="$t('CreateMatch.SectionServer')">
        <v-card-text>
          <v-row density="compact">
            <v-col cols="12" md="7">
              <v-select
                v-model="form.server_id"
                :items="serverItems"
                :label="$t('CreateMatch.ServerLabel')"
                :no-data-text="$t('CreateMatch.NoServers')"
                :rules="[(v: number | null) => mode === 'pug' || v != null || $t('misc.Required')]"
              >
                <template #append>
                  <v-btn
                    variant="tonal"
                    prepend-icon="mdi-server-plus"
                    @click="serverDialog = true"
                  >
                    {{ $t("CreateMatch.AddServer") }}
                  </v-btn>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="5">
              <v-select
                v-model="form.season_id"
                :items="seasonItems"
                :label="$t('CreateMatch.SeasonLabel')"
                :hint="seasonHint"
                persistent-hint
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Teams -->
      <v-card class="mb-4" :title="$t('CreateMatch.SectionTeams')">
        <v-card-text>
          <div class="text-body-medium mb-1">{{ $t("Pug.TeamMode") }}</div>
          <v-btn-toggle
            v-model="mode"
            mandatory
            color="primary"
            variant="outlined"
            divided
            class="mb-4"
          >
            <v-btn value="teams" prepend-icon="mdi-shield-account">{{
              $t("Pug.ExistingTeams")
            }}</v-btn>
            <v-btn value="pug" prepend-icon="mdi-account-multiple-plus">{{
              $t("Pug.Queue")
            }}</v-btn>
          </v-btn-toggle>
          <template v-if="mode === 'pug'">
            <v-alert type="info" variant="tonal" density="compact" class="mb-4">{{
              $t("Pug.QueueHint")
            }}</v-alert>
            <v-row density="compact">
              <v-col cols="12" sm="4">
                <v-select
                  v-model="pug.formation"
                  :items="formationItems"
                  :label="$t('Pug.Formation')"
                />
              </v-col>
              <v-col cols="6" sm="4">
                <v-number-input
                  v-model="pug.ready_seconds"
                  :label="$t('Pug.ReadySeconds')"
                  :min="20"
                  :max="300"
                  :step="10"
                  control-variant="split"
                />
              </v-col>
              <v-col cols="6" sm="4">
                <v-number-input
                  v-model="pug.expires_minutes"
                  :label="$t('Pug.ExpiresMinutes')"
                  :min="0"
                  :max="1440"
                  :step="15"
                  clearable
                  control-variant="split"
                />
              </v-col>
            </v-row>
          </template>
          <v-row v-else density="compact" class="align-center">
            <v-col cols="12" md="5">
              <v-autocomplete
                v-model="form.team1_id"
                :items="teamItems"
                :label="$t('CreateMatch.FormTeam1')"
                :rules="[teamRule]"
              />
            </v-col>
            <v-col cols="12" md="2" class="text-center text-title-medium text-medium-emphasis">
              {{ $t("Matches.Versus") }}
            </v-col>
            <v-col cols="12" md="5">
              <v-autocomplete
                v-model="form.team2_id"
                :items="teamItems"
                :label="$t('CreateMatch.FormTeam2')"
                :rules="[teamRule]"
              />
            </v-col>
          </v-row>
          <v-text-field
            v-model="form.title"
            :class="{ 'mt-2': mode === 'pug' }"
            :label="$t('CreateMatch.FormMatchTitle')"
            counter="60"
            :rules="[
              (v: string) =>
                (v ?? '').length <= 60 ||
                $t('Team.CharacterLimit', [$t('CreateMatch.FormMatchTitle'), 60])
            ]"
          />
        </v-card-text>
      </v-card>

      <!-- Series & maps -->
      <v-card class="mb-4" :title="$t('CreateMatch.SectionMaps')">
        <v-card-text>
          <div class="text-body-medium mb-1">{{ $t("CreateMatch.FormSeriesType") }}</div>
          <v-btn-toggle
            v-model="defaults.maps_to_win"
            mandatory
            color="primary"
            variant="outlined"
            divided
            class="mb-4"
          >
            <v-btn v-for="n in [1, 2, 3, 5, 7]" :key="n" :value="n">BO{{ n }}</v-btn>
          </v-btn-toggle>

          <MapPoolPicker v-model="defaults.map_pool" :maps="mapList" :error="mapPoolError" />

          <v-row density="compact" class="mt-2">
            <v-col cols="12" sm="6">
              <v-select
                v-model="form.veto_first"
                :items="vetoFirstItems"
                :label="$t('CreateMatch.VetoFirst')"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-select
                v-model="defaults.side_type"
                :items="sideTypeItems"
                :label="$t('Veto.SidePick')"
              />
            </v-col>
          </v-row>

          <v-switch
            v-model="defaults.skip_veto"
            :label="$t('CreateMatch.SkipVeto')"
            color="primary"
            hide-details
          />
          <v-row v-if="defaults.skip_veto" density="compact" class="mt-2">
            <v-col v-for="index in defaults.maps_to_win" :key="index" cols="12" sm="6" md="4">
              <v-select
                v-model="defaults.map_sides[index - 1]"
                :items="mapSideItems"
                :label="
                  $t('CreateMatch.MapSides', {
                    map: mapLabel(defaults.map_pool[index - 1]) ?? index
                  })
                "
                density="compact"
              />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <!-- Players -->
      <v-card class="mb-4" :title="$t('CreateMatch.SectionPlayers')">
        <v-card-text>
          <v-row density="compact">
            <v-col cols="12" sm="4">
              <v-number-input
                v-model="defaults.players_per_team"
                :label="$t('CreateMatch.PlayersPerTeam')"
                :min="1"
                :max="10"
                control-variant="split"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-number-input
                v-model="defaults.min_players_to_ready"
                :label="$t('CreateMatch.ReadyPerTeam')"
                :min="1"
                :max="defaults.players_per_team || 10"
                control-variant="split"
                :rules="[readyRule]"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-number-input
                v-model="defaults.min_spectators_to_ready"
                :label="$t('CreateMatch.SpectatorsToReady')"
                :min="0"
                control-variant="split"
              />
            </v-col>
          </v-row>
          <v-switch
            v-model="defaults.wingman"
            :label="$t('CreateMatch.Wingman')"
            color="primary"
            hide-details
            @update:model-value="onWingman"
          />
          <v-combobox
            v-model="defaults.spectators"
            :label="$t('CreateMatch.Spectators')"
            :hint="$t('CreateMatch.SpectatorsHint')"
            persistent-hint
            multiple
            chips
            closable-chips
            class="mt-4"
          />
        </v-card-text>
      </v-card>

      <!-- Advanced -->
      <v-card class="mb-4" :title="$t('CreateMatch.SectionAdvanced')">
        <v-card-text>
          <div class="text-body-medium mb-2">{{ $t("CreateMatch.FormCVARS") }}</div>
          <CvarEditor v-model="cvars" />
        </v-card-text>
      </v-card>

      <div class="d-flex align-center justify-end ga-3 mb-8">
        <span v-if="creating" class="text-body-medium text-medium-emphasis">{{
          $t("CreateMatch.Creating")
        }}</span>
        <v-btn
          color="primary"
          size="large"
          type="submit"
          prepend-icon="mdi-sword-cross"
          :loading="creating"
        >
          {{ $t("CreateMatch.Title") }}
        </v-btn>
      </div>
    </v-form>

    <ServerDialog v-model="serverDialog" :server="null" @saved="onServerAdded" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  maps,
  matches,
  pugs,
  seasons as seasonsApi,
  servers as serversApi,
  teams as teamsApi
} from "@/api";
import type { MapListEntry, Season, Server, Team } from "@/api/types";
import CvarEditor from "@/components/CvarEditor.vue";
import MapPoolPicker from "@/components/MapPoolPicker.vue";
import ServerDialog from "@/components/ServerDialog.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { emptyDefaults, parseSeasonCvars } from "@/utils/seasonDefaults";

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const formRef = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const loading = ref(true);
const creating = ref(false);
const serverDialog = ref(false);
const servers = ref<Server[]>([]);
const teams = ref<Team[]>([]);
const seasons = ref<Season[]>([]);
const mapList = ref<MapListEntry[]>([]);

const form = reactive({
  server_id: null as number | null,
  season_id: null as number | null,
  team1_id: null as number | null,
  team2_id: null as number | null,
  title: "",
  veto_first: "team1"
});
/** Existing teams, or a PUG queue that forms the teams when it fills. */
const mode = ref<"teams" | "pug">("teams");
const pug = reactive({
  formation: "balanced" as "balanced" | "random" | "captains",
  ready_seconds: 60 as number | null,
  expires_minutes: null as number | null
});
/** Series, ready and veto settings; a season pre-fills them. */
const defaults = reactive(emptyDefaults());
const cvars = ref<Record<string, string>>({});
const seasonApplied = ref(false);

const serverItems = computed(() => [
  // A PUG queue can take whichever server is free once it fills.
  ...(mode.value === "pug"
    ? [{ value: null as number | null, title: t("Pug.AnyFreeServer") }]
    : []),
  ...servers.value.map((server) => ({
    value: server.id as number | null,
    title:
      server.display_name + (server.public_server && server.user_id !== auth.user?.id ? " 🌐" : "")
  }))
]);
const formationItems = computed(() =>
  (["balanced", "random", "captains"] as const).map((value) => ({
    value,
    title: t(`Pug.${value}`)
  }))
);
const teamItems = computed(() =>
  teams.value.map((team) => ({
    value: team.id,
    title: team.tag ? `${team.name} [${team.tag}]` : team.name
  }))
);
const seasonItems = computed(() => [
  { value: null, title: t("CreateMatch.NoSeason") },
  ...seasons.value.map((season) => ({ value: season.id, title: season.name }))
]);
const seasonHint = computed(() =>
  seasonApplied.value ? t("CreateMatch.SeasonDefaultsApplied") : ""
);

const vetoFirstItems = computed(() => [
  { value: "team1", title: t("CreateMatch.FormTeam1") },
  { value: "team2", title: t("CreateMatch.FormTeam2") },
  { value: "random", title: t("CreateMatch.Random") }
]);
const sideTypeItems = computed(() => [
  { value: "standard", title: t("CreateMatch.KnifeDefault") },
  { value: "never_knife", title: t("CreateMatch.KnifeNever") },
  { value: "always_knife", title: t("CreateMatch.KnifeAlways") }
]);
const mapSideItems = computed(() => [
  { value: "team1_ct", title: t("CreateMatch.MapSidesTeam1CT") },
  { value: "team1_t", title: t("CreateMatch.SideT") },
  { value: "knife", title: t("CreateMatch.MapSidesKnife") }
]);

const mapLabel = (name: string | undefined) =>
  name ? (mapList.value.find((map) => map.map_name === name)?.map_display_name ?? name) : undefined;

const teamRule = (value: number | null) => {
  if (mode.value === "pug") return true;
  if (value == null) return t("CreateMatch.TeamRequired");
  if (form.team1_id != null && form.team1_id === form.team2_id)
    return t("CreateMatch.TeamCannotBeEqual");
  return true;
};
const readyRule = (value: number | null) =>
  value == null ||
  !defaults.players_per_team ||
  value <= defaults.players_per_team ||
  t("CreateMatch.ReadyTooMany");
const mapPoolError = computed(() => {
  if (defaults.map_pool.length === 0) return t("CreateMatch.MapChoiceError");
  if (defaults.map_pool.length < defaults.maps_to_win) return t("CreateMatch.MapNotEnough");
  return "";
});

watch(
  () => defaults.players_per_team,
  (size) => {
    if (size && defaults.min_players_to_ready > size) defaults.min_players_to_ready = size;
  }
);
/** Wingman is 2v2: switching it sets the team size (a season's own values are applied without this). */
function onWingman(wingman: boolean | null) {
  defaults.players_per_team = wingman ? 2 : 5;
  defaults.min_players_to_ready = defaults.players_per_team;
}

// Picking a season pre-fills its match defaults and server cvars.
watch(
  () => form.season_id,
  async (seasonId) => {
    seasonApplied.value = false;
    if (seasonId == null) return;
    try {
      const parsed = parseSeasonCvars(await seasonsApi.cvars(seasonId));
      Object.assign(defaults, parsed.defaults);
      // Keep only maps the user can pick.
      defaults.map_pool = parsed.defaults.map_pool.filter((name) =>
        mapList.value.some((m) => m.map_name === name)
      );
      cvars.value = parsed.cvars;
      seasonApplied.value = true;
    } catch (error) {
      ui.notifyError(error);
    }
  }
);

/** The user's own servers first, then public ones. */
async function loadServers() {
  const list = await serversApi.available();
  servers.value = [...list].sort(
    (a, b) =>
      Number(b.user_id === auth.user?.id) - Number(a.user_id === auth.user?.id) ||
      Number(b.public_server) - Number(a.public_server)
  );
}

async function onServerAdded() {
  const before = new Set(servers.value.map((server) => server.id));
  try {
    await loadServers();
    const added = servers.value.find((server) => !before.has(server.id));
    if (added) form.server_id = added.id;
  } catch (error) {
    ui.notifyError(error);
  }
}

onMounted(async () => {
  try {
    await auth.load();
    const userId = auth.user?.id;
    const [allTeams, myTeams, seasonList, mapsList] = await Promise.all([
      teamsApi.all(),
      teamsApi.mine(),
      seasonsApi.available(),
      userId != null ? maps.enabled(userId) : Promise.resolve([]),
      loadServers()
    ]);
    // Own teams first, then public ones (admins see every team).
    const mine = new Set(myTeams.map((team) => team.id));
    teams.value = [
      ...myTeams,
      ...allTeams.filter((team) => !mine.has(team.id) && (auth.isAdmin || team.public_team))
    ];
    seasons.value = seasonList;
    mapList.value = mapsList;
    if (servers.value.length === 1) form.server_id = servers.value[0].id;
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
});

async function create() {
  if (creating.value || mapPoolError.value || !(await formRef.value?.validate())?.valid) return;
  creating.value = true;
  try {
    const playersPerTeam = defaults.players_per_team || 5;
    if (mode.value === "pug") {
      const queue = await pugs.create({
        title: form.title.trim() || undefined,
        server_id: form.server_id,
        season_id: form.season_id,
        expires_minutes: pug.expires_minutes || undefined,
        settings: {
          players_per_team: playersPerTeam,
          formation: pug.formation,
          max_maps: defaults.maps_to_win,
          map_pool: defaults.map_pool,
          side_type: defaults.side_type,
          skip_veto: defaults.skip_veto,
          ready_seconds: pug.ready_seconds || 60
        }
      });
      await router.push(`/pug/${queue.id}`);
      return;
    }
    const result = await matches.create({
      server_id: form.server_id,
      season_id: form.season_id,
      team1_id: form.team1_id,
      team2_id: form.team2_id,
      title: form.title.trim() || undefined,
      start_time: new Date().toISOString().slice(0, 19).replace("T", " "),
      max_maps: defaults.maps_to_win,
      veto_mappool: defaults.map_pool.join(" "),
      veto_first: form.veto_first,
      skip_veto: defaults.skip_veto,
      side_type: defaults.side_type,
      map_sides: defaults.skip_veto
        ? defaults.map_sides.slice(0, defaults.maps_to_win).join(",")
        : null,
      players_per_team: playersPerTeam,
      min_players_to_ready: Math.min(
        defaults.min_players_to_ready || playersPerTeam,
        playersPerTeam
      ),
      min_spectators_to_ready: defaults.min_spectators_to_ready || 0,
      wingman: defaults.wingman,
      spectator_auths: defaults.spectators.length ? defaults.spectators : null,
      match_cvars: cvars.value
    });
    ui.notify(t("CreateMatch.MessageRegisterSuccess"), "success");
    await router.push(`/match/${result.id}`);
  } catch (error) {
    // Nothing is lost: the form stays filled in so the problem can be fixed and retried.
    ui.notifyError(error);
  } finally {
    creating.value = false;
  }
}
</script>
