<template>
  <v-chip
    :color="connected ? 'success' : 'warning'"
    size="small"
    variant="tonal"
    :prepend-icon="connected ? 'mdi-broadcast' : 'mdi-lan-pending'"
    label
  >
    {{ connected ? $t("Match.LiveUpdates") : $t("Match.Reconnecting") }}
  </v-chip>
</template>

<script setup lang="ts">
import { matches } from "@/api";
import type {
  BombEvent,
  KillEvent,
  MapStat,
  Match,
  MatchRound,
  PauseState,
  PlayerStat,
  Veto,
  VetoSide
} from "@/api/types";
import { useEventSource } from "@/composables/useEventSource";

/**
 * Live data of a running match over one event stream. Mounted only while the match is live, so the
 * stream is closed when the match ends or the page is left (useEventSource closes on unmount).
 */
const props = defineProps<{ matchId: number }>();
const emit = defineEmits<{
  match: [match: Match];
  mapstats: [maps: MapStat[]];
  playerstats: [players: PlayerStat[]];
  vetoes: [vetoes: Veto[]];
  vetosides: [sides: VetoSide[]];
  rounds: [rounds: MatchRound[]];
  kills: [kills: KillEvent[]];
  bombs: [bombs: BombEvent[]];
  pause: [pause: PauseState | null];
}>();

const list = <T,>(data: unknown) => (Array.isArray(data) ? (data as T[]) : []);

const { connected } = useEventSource(matches.liveStreamUrl(props.matchId), {
  matches: (data: Match | null) => data && emit("match", data),
  mapstats: (data) => emit("mapstats", list<MapStat>(data)),
  playerstats: (data) => emit("playerstats", list<PlayerStat>(data)),
  vetodata: (data) => emit("vetoes", list<Veto>(data)),
  vetosidedata: (data) => emit("vetosides", list<VetoSide>(data)),
  rounds: (data) => emit("rounds", list<MatchRound>(data)),
  kills: (data) => emit("kills", list<KillEvent>(data)),
  bombs: (data) => emit("bombs", list<BombEvent>(data)),
  pause: (data: PauseState | null) => emit("pause", data)
});
</script>
