<template>
  <v-card v-if="ready" class="mb-4">
    <v-card-text class="d-flex flex-wrap align-center ga-4">
      <v-icon color="primary">mdi-account-check</v-icon>
      <div v-for="[name, team] in teams" :key="name" class="d-flex align-center ga-2">
        <span class="font-weight-medium">{{ name }}</span>
        <v-chip :color="team?.ready ? 'success' : 'warning'" size="small" variant="tonal" label>
          {{ team?.ready ? $t("Ready.Ready") : $t("Ready.NotReady") }}
        </v-chip>
        <span class="text-body-medium text-medium-emphasis">
          {{ $t("Ready.Connected", { n: team?.connected_clients ?? 0 }) }}
        </span>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import { matches } from "@/api";
import type { Match, ReadyState } from "@/api/types";

/** Team ready state before a match goes live (MatchZy reports it per team), refreshed every 10 s. */
const props = defineProps<{ match: Match }>();
const ready = ref<ReadyState | null>(null);

const teams = computed(
  () =>
    [
      [props.match.team1_string, ready.value?.team1],
      [props.match.team2_string, ready.value?.team2]
    ] as const
);

async function load() {
  try {
    ready.value = await matches.ready(props.match.id);
  } catch {
    ready.value = null;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  void load();
  timer = setInterval(() => document.visibilityState === "visible" && void load(), 10000);
});
onBeforeUnmount(() => timer && clearInterval(timer));
</script>
