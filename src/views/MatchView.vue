<template>
  <v-container fluid>
    <v-skeleton-loader v-if="loading && !match" type="card, card" />
    <v-alert v-else-if="!match" type="warning" variant="tonal">{{
      $t("misc.NotFoundText")
    }}</v-alert>

    <template v-else>
      <MatchHeader
        :match="match"
        :team1="team1"
        :team2="team2"
        :server="server"
        :score="score"
        class="mb-4"
      >
        <template #actions>
          <MatchStreams
            v-if="live"
            :match-id="match.id"
            @match="onMatch"
            @mapstats="(list) => (mapStats = list)"
            @playerstats="(list) => (playerStats = list)"
            @vetoes="(list) => (vetoList = list)"
            @vetosides="(list) => (vetoSides = list)"
            @rounds="(list) => (rounds = list)"
            @kills="(list) => (kills = list)"
            @bombs="(list) => (bombs = list)"
            @pause="(state) => (pause = state)"
          />
          <MatchAdminMenu v-if="adminTools" ref="adminMenu" :match="match" @changed="reload" />
        </template>
      </MatchHeader>

      <v-alert
        v-if="live && pauseText"
        type="warning"
        variant="tonal"
        prominent
        icon="mdi-pause-circle"
        class="mb-4"
      >
        {{ pauseText }}
      </v-alert>

      <v-alert
        v-if="waitingMinutes != null && waitingMinutes >= 10"
        type="warning"
        variant="tonal"
        icon="mdi-account-clock"
        class="mb-4"
      >
        {{ $t("Schedule.NoShow", { n: waitingMinutes }) }}
      </v-alert>

      <ServerStateBanner
        v-if="live"
        :match="match"
        :admin="adminTools"
        @action="onServerAction"
        @changed="reload"
      />

      <ReadyStatus v-if="waitingMinutes != null" :match="match" />

      <MatchControlPanel v-if="adminTools" :match="match" class="mb-4" />

      <VetoList v-if="vetoList.length" :vetoes="vetoList" :sides="vetoSides" class="mb-4" />

      <MapScoreboard
        v-for="map in maps"
        :key="map.key"
        :match="match"
        :map-stat="map.stat"
        :map-number="map.number"
        :players="map.players"
        :rounds="map.rounds"
        :kills="map.kills"
        :bombs="map.bombs"
        :live="live && map.stat?.end_time == null"
        class="mb-4"
      />
      <v-alert v-if="!maps.length" type="info" variant="tonal">{{ $t("Match.NoMapsYet") }}</v-alert>
    </template>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { matches, servers, stats, teams, vetoes } from "@/api";
import { useI18n } from "vue-i18n";
import type {
  BombEvent,
  KillEvent,
  MapStat,
  Match,
  MatchRound,
  PauseState,
  PlayerStat,
  Server,
  Team,
  Veto,
  VetoSide
} from "@/api/types";
import MapScoreboard from "@/components/match/MapScoreboard.vue";
import MatchAdminMenu from "@/components/match/MatchAdminMenu.vue";
import MatchControlPanel from "@/components/match/MatchControlPanel.vue";
import MatchHeader from "@/components/match/MatchHeader.vue";
import MatchStreams from "@/components/match/MatchStreams.vue";
import ReadyStatus from "@/components/match/ReadyStatus.vue";
import ServerStateBanner from "@/components/match/ServerStateBanner.vue";
import VetoList from "@/components/match/VetoList.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { isFinished } from "@/utils/format";

const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const match = ref<Match | null>(null);
const adminMenu = ref<InstanceType<typeof MatchAdminMenu> | null>(null);
const team1 = ref<Team | null>(null);
const team2 = ref<Team | null>(null);
const server = ref<Server | null>(null);
const mapStats = ref<MapStat[]>([]);
const playerStats = ref<PlayerStat[]>([]);
const vetoList = ref<Veto[]>([]);
const vetoSides = ref<VetoSide[]>([]);
const rounds = ref<MatchRound[]>([]);
const kills = ref<KillEvent[]>([]);
const bombs = ref<BombEvent[]>([]);
const pause = ref<PauseState | null>(null);
const loading = ref(true);

/** Live (or waiting to start): the event stream replaces the one-off requests. */
const live = computed(() => match.value != null && !isFinished(match.value));
const adminTools = computed(
  () => match.value != null && live.value && (auth.isAdmin || auth.user?.id === match.value.user_id)
);

/** Series score; a BO1 shows the round score of its map instead of 1:0. */
const score = computed<[number, number]>(() => {
  const m = match.value;
  if (!m) return [0, 0];
  if (m.max_maps == 1 && mapStats.value[0])
    return [mapStats.value[0].team1_score, mapStats.value[0].team2_score];
  return [m.team1_score ?? 0, m.team2_score ?? 0];
});

/** Recovery choices from the server state banner open the admin menu's dialogs. */
function onServerAction(action: "restore" | "restart" | "forfeit" | "cancel") {
  if (action === "restore") void adminMenu.value?.openBackups();
  else adminMenu.value?.open(action);
}

/** Minutes since the match was loaded while no map has gone live yet (no-show check). */
const now = ref(Date.now());
const waitingMinutes = computed(() => {
  const m = match.value;
  if (!m || isFinished(m) || mapStats.value.length || !m.start_time) return null;
  return Math.max(0, Math.floor((now.value - new Date(m.start_time).getTime()) / 60000));
});
const clock = setInterval(() => (now.value = Date.now()), 30000);
onBeforeUnmount(() => clearInterval(clock));

const pauseText = computed(() => {
  const state = pause.value;
  if (!state || !(state.paused === true || Number(state.paused) === 1)) return "";
  if (!state.team_paused || state.team_paused === "Admin") return t("Match.PausedAdmin");
  return t("Match.PausedBanner", { team: state.team_paused, type: state.pause_type ?? "" });
});

/** One entry per played map, with its players (stats rows can arrive before the map row). */
const maps = computed(() => {
  const byMap = new Map<number, PlayerStat[]>();
  for (const player of playerStats.value) {
    byMap.set(player.map_id, [...(byMap.get(player.map_id) ?? []), player]);
  }
  const timeline = (mapId: number) => ({
    rounds: rounds.value.filter((round) => round.map_id === mapId),
    kills: kills.value.filter((kill) => kill.map_id === mapId),
    bombs: bombs.value.filter((bomb) => bomb.map_id === mapId)
  });
  const entries: ({
    key: number;
    stat: MapStat | null;
    number: number;
    players: PlayerStat[];
  } & ReturnType<typeof timeline>)[] = [...mapStats.value]
    .sort((a, b) => a.map_number - b.map_number)
    .map((stat) => ({
      key: stat.id,
      stat,
      number: stat.map_number,
      players: byMap.get(stat.id) ?? [],
      ...timeline(stat.id)
    }));
  for (const [mapId, players] of byMap) {
    if (!mapStats.value.some((stat) => stat.id === mapId)) {
      entries.push({ key: mapId, stat: null, number: entries.length, players, ...timeline(mapId) });
    }
  }
  return entries;
});

function onMatch(updated: Match) {
  const serverChanged = updated.server_id !== match.value?.server_id;
  match.value = updated;
  if (serverChanged) void loadServer();
}

async function loadServer() {
  const id = match.value?.server_id;
  // Server details need a login; anonymous viewers don't get connect buttons.
  server.value = id && auth.loggedIn ? await servers.get(id).catch(() => null) : null;
}

async function load() {
  loading.value = true;
  try {
    await auth.load();
    const id = String(route.params.id);
    const found = await matches.get(id);
    match.value = found;
    const [t1, t2] = await Promise.all([
      found.team1_id ? teams.basic(found.team1_id).catch(() => null) : null,
      found.team2_id ? teams.basic(found.team2_id).catch(() => null) : null,
      loadServer()
    ]);
    team1.value = t1;
    team2.value = t2;
    // A live match gets everything from its event stream (MatchStreams).
    if (isFinished(found)) {
      const [mapList, playerList, vetoRows, sideRows, timeline] = await Promise.all([
        stats.maps(id),
        stats.ofMatch(id),
        vetoes.ofMatch(id),
        vetoes.sidesOfMatch(id),
        matches.timeline(id).catch(() => null)
      ]);
      mapStats.value = mapList;
      playerStats.value = playerList;
      vetoList.value = vetoRows;
      vetoSides.value = sideRows;
      rounds.value = timeline?.rounds ?? [];
      kills.value = timeline?.kills ?? [];
      bombs.value = timeline?.bombs ?? [];
      pause.value = null;
    }
  } catch (error) {
    match.value = null;
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

/** After an admin action (not every action triggers a stream update, e.g. cancel). */
async function reload() {
  if (!match.value) return;
  try {
    onMatch(await matches.get(match.value.id));
  } catch (error) {
    ui.notifyError(error);
  }
}

watch(() => route.params.id, load, { immediate: true });
</script>
