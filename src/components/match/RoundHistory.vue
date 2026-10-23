<template>
  <div class="round-history">
    <div class="lanes">
      <div class="lane-names text-body-small">
        <div class="lane-name" :title="team1">{{ team1 }}</div>
        <div class="lane-name" :title="team2">{{ team2 }}</div>
      </div>
      <div class="rounds">
        <template v-for="round in cells" :key="round.round_number">
          <div v-if="round.halftime" class="halftime" :title="$t('Match.Halftime')" />
          <div class="round">
            <div class="cell" :class="cellClass(round, 'team1')">
              <v-icon v-if="round.winner === 'team1'" :icon="reasonIcon(round.reason)" size="14" />
            </div>
            <div class="cell" :class="cellClass(round, 'team2')">
              <v-icon v-if="round.winner === 'team2'" :icon="reasonIcon(round.reason)" size="14" />
            </div>
            <div class="round-no text-caption">
              {{ round.round_number }}
              <span v-if="round.planted" class="plant-dot" />
            </div>
            <v-tooltip activator="parent" location="top">
              <div class="font-weight-medium">
                {{ $t("Match.RoundShort", { n: round.round_number }) }} ·
                {{ round.winner === "team1" ? team1 : round.winner === "team2" ? team2 : "–" }}
              </div>
              <div>
                {{ reasonLabel(round.reason) }}
                <span v-if="round.winner_side">({{ round.winner_side.toUpperCase() }})</span>
              </div>
              <div v-if="round.planted">{{ $t("Match.Planted", { site: round.planted }) }}</div>
              <div>{{ round.team1_score }} : {{ round.team2_score }}</div>
            </v-tooltip>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { BombEvent, MatchRound } from "@/api/types";

/** HLTV-style round strip of one map: each round sits in the winner's lane, coloured by the side that won. */
const props = withDefaults(
  defineProps<{
    rounds: MatchRound[];
    bombs?: BombEvent[];
    team1: string;
    team2: string;
    /** Rounds per half in regulation (MR12); overtime halves are 3 rounds. */
    halfLength?: number;
  }>(),
  { bombs: () => [], halfLength: 12 }
);
const { t } = useI18n();

const cells = computed(() => {
  const regulation = props.halfLength * 2;
  return [...props.rounds]
    .sort((a, b) => a.round_number - b.round_number)
    .map((round) => {
      const previous = round.round_number - 1;
      // A divider before the first round of every half: after the first half, and every 3 rounds in overtime.
      const halftime =
        previous === props.halfLength ||
        (previous >= regulation && (previous - regulation) % 3 === 0 && previous > 0);
      const plant = props.bombs.find(
        (bomb) =>
          !bomb.defused && bomb.round_number === (round.event_round ?? round.round_number - 1)
      );
      return {
        ...round,
        halftime,
        planted: plant?.site ? plant.site.toUpperCase() : plant ? "?" : null
      };
    });
});

function cellClass(round: MatchRound, lane: "team1" | "team2") {
  if (round.winner !== lane) return "cell--empty";
  return round.winner_side === "ct"
    ? "cell--ct"
    : round.winner_side === "t"
      ? "cell--t"
      : "cell--won";
}

// CS2 round end reasons (RoundEndReason).
function reasonIcon(reason: number | null) {
  switch (reason) {
    case 1:
      return "mdi-bomb";
    case 7:
      return "mdi-wrench";
    case 8:
    case 9:
      return "mdi-skull";
    case 12:
      return "mdi-timer-sand";
    default:
      return "mdi-check";
  }
}
function reasonLabel(reason: number | null) {
  switch (reason) {
    case 1:
      return t("Match.ReasonBombed");
    case 7:
      return t("Match.ReasonDefused");
    case 8:
    case 9:
      return t("Match.ReasonElimination");
    case 12:
      return t("Match.ReasonTime");
    default:
      return t("Match.ReasonOther");
  }
}
</script>

<style scoped>
.lanes {
  display: flex;
  gap: 8px;
}
.lane-names {
  display: flex;
  flex-direction: column;
  gap: 2px;
  width: 90px;
  flex-shrink: 0;
}
.lane-name {
  height: 22px;
  line-height: 22px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.rounds {
  display: flex;
  gap: 2px;
  overflow-x: auto;
  padding-bottom: 4px;
}
.round {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex-shrink: 0;
}
.cell {
  width: 22px;
  height: 22px;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.cell--empty {
  background: rgba(var(--v-theme-on-surface), 0.06);
}
.cell--ct {
  background: #3d7cc9;
}
.cell--t {
  background: #c98a2e;
}
.cell--won {
  background: rgb(var(--v-theme-secondary));
}
.round-no {
  text-align: center;
  line-height: 1;
  opacity: 0.6;
  position: relative;
}
.plant-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #e05050;
  vertical-align: middle;
}
.halftime {
  width: 2px;
  margin: 0 3px;
  background: rgba(var(--v-theme-on-surface), 0.3);
  height: 46px;
  flex-shrink: 0;
}
</style>
