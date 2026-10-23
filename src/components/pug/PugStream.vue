<template>
  <span v-if="false" />
</template>

<script setup lang="ts">
import { pugs } from "@/api";
import type { PugPlayer, PugQueue } from "@/api/types";
import { useEventSource } from "@/composables/useEventSource";

/** Live state of a PUG queue; closes with the page. */
const props = defineProps<{ queueId: number }>();
const emit = defineEmits<{ queue: [data: { queue: PugQueue; players: PugPlayer[] }] }>();

useEventSource(pugs.streamUrl(props.queueId), {
  queue: (data: { queue: PugQueue; players: PugPlayer[] }) => emit("queue", data)
});
</script>
