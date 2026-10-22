<template>
  <span v-if="false" />
</template>

<script setup lang="ts">
import { matches } from "@/api";
import type { MatchSummary } from "@/api/types";
import { useEventSource } from "@/composables/useEventSource";

/** Live summaries of the listed (and all active) matches. Re-created by the list (key) when its ids change. */
const props = defineProps<{ ids: number[] }>();
const emit = defineEmits<{ summaries: [summaries: MatchSummary[]] }>();

useEventSource(matches.summaryStreamUrl(props.ids), {
  summaries: (data: unknown) =>
    emit("summaries", Array.isArray(data) ? (data as MatchSummary[]) : [])
});
</script>
