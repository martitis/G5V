<template>
  <v-card>
    <v-card-text>
      <div class="d-flex align-center flex-wrap ga-2 mb-4">
        <v-chip :color="status.color" size="small" variant="tonal" label>{{ status.label }}</v-chip>
        <span v-if="match.title" class="text-body-medium text-medium-emphasis">{{
          match.title
        }}</span>
        <router-link
          v-if="match.season_id"
          :to="`/season/${match.season_id}`"
          class="app-link text-body-medium"
        >
          {{ $t("Match.Season") }} #{{ match.season_id }}
        </router-link>
        <v-spacer />
        <slot name="actions" />
      </div>

      <div class="match-header">
        <TeamSide
          :team="team1"
          :name="match.team1_string"
          :team-id="match.team1_id"
          :won="winnerSide === 1"
          :lost="winnerSide === 2"
        />
        <div class="text-center">
          <div class="text-display-small font-weight-bold score">
            <span :class="{ 'text-success': winnerSide === 1 }">{{ score[0] }}</span>
            <span class="text-medium-emphasis mx-2">:</span>
            <span :class="{ 'text-success': winnerSide === 2 }">{{ score[1] }}</span>
          </div>
          <div class="text-body-small text-medium-emphasis">BO{{ match.max_maps }}</div>
        </div>
        <TeamSide
          :team="team2"
          :name="match.team2_string"
          :team-id="match.team2_id"
          :won="winnerSide === 2"
          :lost="winnerSide === 1"
          reverse
        />
      </div>

      <div class="text-center text-body-small text-medium-emphasis mt-4">
        <span v-if="match.start_time"
          >{{ $t("Match.StartTime") }} {{ formatDateTime(match.start_time) }}</span
        >
        <span v-if="match.end_time" class="ml-4"
          >{{ $t("Match.EndTime") }} {{ formatDateTime(match.end_time) }}</span
        >
      </div>
      <v-alert
        v-if="match.cancelled == 1"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ $t("Match.MatchHasBeenCancelled") }}
      </v-alert>
      <v-alert
        v-else-if="match.forfeit == 1 && loser"
        type="warning"
        variant="tonal"
        density="compact"
        class="mt-4"
      >
        {{ $t("Match.MatchForfeitedBy", { team: loser }) }}
      </v-alert>

      <div v-if="connect" class="d-flex justify-center flex-wrap ga-2 mt-4">
        <v-btn color="primary" prepend-icon="mdi-play" :href="connect.play">
          {{ $t("Match.Connect") }}
          <span v-if="connect.name" class="ml-1 text-medium-emphasis">({{ connect.name }})</span>
        </v-btn>
        <v-btn
          v-if="connect.gotv"
          color="secondary"
          variant="tonal"
          prepend-icon="mdi-television-play"
          :href="connect.gotv"
        >
          {{ $t("Match.GOTVConnect") }}
        </v-btn>
        <v-btn variant="text" prepend-icon="mdi-content-copy" @click="copyConnect">{{
          $t("Match.CopyConnect")
        }}</v-btn>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { Match, Server, Team } from "@/api/types";
import TeamSide from "@/components/match/TeamSide.vue";
import { useUiStore } from "@/stores/ui";
import { formatDateTime, isFinished } from "@/utils/format";
import { matchStatus } from "@/utils/matchStatus";

const props = defineProps<{
  match: Match;
  team1: Team | null;
  team2: Team | null;
  server: Server | null;
  /** Series score, or the round score of a BO1's only map. */
  score: [number, number];
}>();

const { t } = useI18n();
const ui = useUiStore();

const status = computed(() => matchStatus(props.match, t));
const winnerSide = computed(() =>
  props.match.winner == null
    ? 0
    : props.match.winner === props.match.team1_id
      ? 1
      : props.match.winner === props.match.team2_id
        ? 2
        : 0
);
const loser = computed(() =>
  winnerSide.value === 1
    ? props.match.team2_string
    : winnerSide.value === 2
      ? props.match.team1_string
      : ""
);
/** Connect links while the match isn't over (the API only returns the address to those allowed to see it). */
const connect = computed(() => {
  const server = props.server;
  if (isFinished(props.match) || !server?.ip_string) return null;
  return {
    address: `${server.ip_string}:${server.port}`,
    play: `steam://connect/${server.ip_string}:${server.port}`,
    gotv: server.gotv_port ? `steam://connect/${server.ip_string}:${server.gotv_port}` : null,
    name: server.display_name
  };
});

async function copyConnect() {
  if (!connect.value) return;
  try {
    await navigator.clipboard.writeText(`connect ${connect.value.address}`);
    ui.notify(t("Match.Copied"), "success");
  } catch (error) {
    ui.notifyError(error);
  }
}
</script>

<style scoped>
.match-header {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  align-items: center;
  gap: 16px;
}
.score {
  white-space: nowrap;
  line-height: 1;
}
@media (max-width: 600px) {
  .match-header {
    grid-template-columns: 1fr;
    text-align: center;
  }
  .match-header :deep(.team-side) {
    justify-content: center !important;
  }
}
</style>
