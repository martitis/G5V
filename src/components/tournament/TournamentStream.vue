<template>
  <span v-if="false" />
</template>

<script setup lang="ts">
import { tournaments } from "@/api";
import type { TournamentDetail } from "@/api/types";
import { useEventSource } from "@/composables/useEventSource";

/** Live bracket of a running tournament; closes with the page. */
const props = defineProps<{ tournamentId: number }>();
const emit = defineEmits<{ tournament: [data: TournamentDetail] }>();

useEventSource(tournaments.streamUrl(props.tournamentId), {
  tournament: (data: TournamentDetail) => emit("tournament", data)
});
</script>
