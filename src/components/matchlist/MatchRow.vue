<template>
  <!-- Not a link element: the connect buttons inside are links themselves. -->
  <v-card
    class="match-row"
    :class="[`match-row--${match.status}`, { 'match-row--link': linkable }]"
    variant="flat"
    border
    :role="linkable ? 'link' : undefined"
    :tabindex="linkable ? 0 : undefined"
    @click="open"
    @keydown.enter="open"
  >
    <div class="match-row__grid pa-3">
      <!-- Status -->
      <div class="match-row__status">
        <v-chip :color="statusColor" size="small" :variant="live ? 'flat' : 'tonal'" label>
          <span v-if="match.status === 'live'" class="live-dot mr-1" />
          {{ statusLabel }}
        </v-chip>
        <div class="text-body-small text-medium-emphasis mt-1">
          BO{{ match.max_maps }}<span v-if="match.title"> · {{ match.title }}</span>
        </div>
      </div>

      <!-- Teams and series score -->
      <div class="match-row__teams">
        <div class="match-row__team justify-end text-right" :class="teamClass(1)">
          <ResultBadge v-if="finished" :result="result(1)" class="mr-2" />
          <span class="team-name">{{ match.team1.name }}</span>
          <TeamLogo :logo="match.team1.logo" :size="32" class="ml-2" placeholder />
        </div>
        <div class="match-row__score text-headline-small font-weight-bold">
          <span :class="scoreClass(1)">{{ seriesScore[0] }}</span>
          <span class="text-medium-emphasis mx-1">:</span>
          <span :class="scoreClass(2)">{{ seriesScore[1] }}</span>
        </div>
        <div class="match-row__team" :class="teamClass(2)">
          <TeamLogo :logo="match.team2.logo" :size="32" class="mr-2" placeholder />
          <span class="team-name">{{ match.team2.name }}</span>
          <ResultBadge v-if="finished" :result="result(2)" class="ml-2" />
        </div>
      </div>

      <!-- Live map / played maps -->
      <div class="match-row__maps">
        <div v-if="match.current_map" class="d-flex align-center ga-2">
          <v-img
            :src="mapImageUrl(match.current_map.name)"
            width="56"
            height="32"
            cover
            class="rounded flex-grow-0"
          />
          <div>
            <div class="text-body-small text-medium-emphasis">
              {{ mapDisplayName(match.current_map.name) }} ·
              {{ $t("Matches.Round", { n: match.current_map.round + 1 }) }}
            </div>
            <div class="text-title-medium font-weight-bold">
              <span :class="sideClass(1)">{{ match.current_map.team1_score }}</span>
              <span class="text-medium-emphasis mx-1">:</span>
              <span :class="sideClass(2)">{{ match.current_map.team2_score }}</span>
            </div>
          </div>
          <v-chip
            v-if="match.pause"
            color="warning"
            size="x-small"
            variant="flat"
            label
            class="ml-1"
          >
            {{
              match.pause.team
                ? $t("Matches.PausedBy", { team: match.pause.team })
                : $t("Matches.StatusPaused")
            }}
          </v-chip>
        </div>
        <div
          v-if="playedMaps.length"
          class="d-flex flex-wrap ga-1"
          :class="{ 'mt-1': match.current_map }"
        >
          <v-chip
            v-for="map in playedMaps"
            :key="map.number"
            size="x-small"
            variant="tonal"
            :color="map.winner === 1 ? 'success' : map.winner === 2 ? 'error' : undefined"
            label
          >
            {{ mapDisplayName(map.name) }} {{ map.team1_score }}:{{ map.team2_score }}
          </v-chip>
        </div>
        <v-chip
          v-if="match.waiting_minutes != null && match.waiting_minutes >= NO_SHOW_MINUTES"
          color="warning"
          size="x-small"
          variant="tonal"
          prepend-icon="mdi-account-clock"
          label
        >
          {{ $t("Schedule.Waiting", { n: match.waiting_minutes }) }}
        </v-chip>
        <div v-if="match.forfeit" class="text-body-small text-medium-emphasis">
          {{ $t("Matches.ByForfeit") }}
        </div>
      </div>

      <!-- Actions -->
      <div class="match-row__actions">
        <template v-if="connect">
          <v-btn
            :href="connect.play"
            color="primary"
            size="small"
            prepend-icon="mdi-play"
            @click.stop
          >
            {{ $t("Match.Connect") }}
          </v-btn>
          <v-btn
            v-if="connect.gotv"
            :href="connect.gotv"
            size="small"
            variant="tonal"
            icon="mdi-television-play"
            :title="$t('Match.GOTVConnect')"
            @click.stop
          />
          <v-btn
            size="small"
            variant="tonal"
            icon="mdi-content-copy"
            :title="$t('Match.CopyConnect')"
            @click.stop="copyConnect"
          />
        </template>
        <div v-else-if="match.start_time" class="text-body-small text-medium-emphasis text-right">
          {{ formatDateTime(match.end_time ?? match.start_time) }}
        </div>
      </div>
    </div>
  </v-card>
</template>

<script setup lang="ts">
import { computed, defineComponent, h } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import type { MatchSummary } from "@/api/types";
import TeamLogo from "@/components/TeamLogo.vue";
import { useUiStore } from "@/stores/ui";
import { copyText } from "@/utils/clipboard";
import { formatDateTime, mapDisplayName, mapImageUrl } from "@/utils/format";

const props = defineProps<{ match: MatchSummary }>();
/** A loaded match still waiting for its first map after this long gets a no-show warning. */
const NO_SHOW_MINUTES = 10;
const { t } = useI18n();
const router = useRouter();
const ui = useUiStore();

const linkable = computed(() => props.match.status !== "cancelled");
function open() {
  if (linkable.value) void router.push(`/match/${props.match.id}`);
}

/** Only sent to viewers who may connect, and only while the match isn't over. */
const connect = computed(() => {
  const server = props.match.server;
  if (!server) return null;
  return {
    address: `${server.ip}:${server.port}`,
    play: `steam://connect/${server.ip}:${server.port}`,
    gotv: server.gotv_port ? `steam://connect/${server.ip}:${server.gotv_port}` : null
  };
});

async function copyConnect() {
  if (!connect.value) return;
  if (await copyText(`connect ${connect.value.address}`)) ui.notify(t("Match.Copied"), "success");
  else ui.notify(t("misc.CopyFailed"), "warning");
}

const live = computed(() => props.match.status === "live" || props.match.status === "paused");
const finished = computed(() => props.match.status === "finished");

const STATUS: Record<MatchSummary["status"], { key: string; color: string }> = {
  pending: { key: "Matches.StatusPending", color: "info" },
  warmup: { key: "Matches.StatusWarmup", color: "info" },
  live: { key: "Matches.StatusLive", color: "error" },
  paused: { key: "Matches.StatusPaused", color: "warning" },
  finished: { key: "Matches.StatusFinished", color: "secondary" },
  cancelled: { key: "Matches.StatusCancelled", color: "grey" }
};
const statusLabel = computed(() => t(STATUS[props.match.status].key));
const statusColor = computed(() => STATUS[props.match.status].color);

/** A BO1 shows its map's round score; longer series show maps won. */
const seriesScore = computed<[number, number]>(() => {
  const m = props.match;
  if (m.max_maps === 1) {
    const map = m.current_map ?? m.maps[0];
    if (map) return [map.team1_score, map.team2_score];
  }
  return [m.team1.score, m.team2.score];
});
const playedMaps = computed(() =>
  props.match.maps.filter((map) => map.finished || map.number !== props.match.current_map?.number)
);

function result(team: 1 | 2): "win" | "loss" | "tie" {
  if (props.match.winner == null) return "tie";
  return props.match.winner === team ? "win" : "loss";
}
function teamClass(team: 1 | 2) {
  if (!finished.value || props.match.winner == null) return "";
  return props.match.winner === team ? "font-weight-bold" : "text-medium-emphasis";
}
function scoreClass(team: 1 | 2) {
  if (finished.value && props.match.winner === team) return "text-success";
  // While live, the leading team's number stands out.
  const [a, b] = seriesScore.value;
  const leading = a === b ? 0 : a > b ? 1 : 2;
  return !finished.value && leading === team
    ? "text-high-emphasis"
    : finished.value
      ? "text-medium-emphasis"
      : "";
}
/** CT blue / T orange for the live map. */
function sideClass(team: 1 | 2) {
  const side = props.match.current_map?.team1_side;
  if (!side) return "";
  const teamSide = team === 1 ? side : side === "ct" ? "t" : "ct";
  return teamSide === "ct" ? "side-ct" : "side-t";
}

/** W / L / T badge of a finished match. */
const ResultBadge = defineComponent({
  props: { result: { type: String, required: true } },
  setup(p) {
    return () =>
      h(
        "span",
        { class: ["result-badge", `result-badge--${p.result}`] },
        p.result === "win"
          ? t("Matches.Win")
          : p.result === "loss"
            ? t("Matches.Loss")
            : t("Matches.TieShort")
      );
  }
});
</script>

<style scoped>
.match-row__grid {
  display: grid;
  grid-template-columns: 130px minmax(0, 1fr) minmax(180px, 260px) auto;
  align-items: center;
  gap: 16px;
}
.match-row__teams {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto minmax(0, 1fr);
  align-items: center;
  gap: 12px;
}
.match-row__team {
  display: flex;
  align-items: center;
  min-width: 0;
}
.team-name {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.match-row__score {
  white-space: nowrap;
}
.match-row__actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 4px;
}
.match-row--live,
.match-row--paused {
  border-left: 4px solid rgb(var(--v-theme-error)) !important;
}
.match-row--paused {
  border-left-color: rgb(var(--v-theme-warning)) !important;
}
.match-row--link {
  cursor: pointer;
}
.match-row--link:hover {
  background: rgba(var(--v-theme-on-surface), 0.04);
}
.match-row--cancelled {
  opacity: 0.6;
}
.side-ct {
  color: #5d9cec;
}
.side-t {
  color: #e0a040;
}
.result-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 22px;
  height: 22px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 700;
  color: #fff;
}
.result-badge--win {
  background: rgb(var(--v-theme-success));
}
.result-badge--loss {
  background: rgb(var(--v-theme-error));
}
.result-badge--tie {
  background: rgb(var(--v-theme-secondary));
}
.live-dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #fff;
  animation: pulse 1.4s ease-in-out infinite;
}
@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
/* Phones and narrow tablets: stack, score centered. */
@media (max-width: 960px) {
  .match-row__grid {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .match-row__status {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .match-row__status > div {
    margin-top: 0 !important;
  }
  .match-row__maps {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .match-row__actions {
    justify-content: center;
  }
}
</style>
