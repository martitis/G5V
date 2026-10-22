<template>
  <v-card v-if="queues.length" class="mb-4">
    <v-card-title class="d-flex align-center ga-2">
      <v-icon color="primary">mdi-account-group</v-icon>
      <span>{{ $t("Pug.OpenQueues") }}</span>
    </v-card-title>
    <v-card-text class="d-flex flex-wrap ga-3">
      <v-card
        v-for="queue in queues"
        :key="queue.id"
        :to="`/pug/${queue.id}`"
        variant="tonal"
        :color="queue.status === 'open' ? 'primary' : 'warning'"
        class="queue pa-3"
      >
        <div class="text-title-small">{{ queue.title || $t("Pug.Queue") }}</div>
        <div class="text-body-small">
          {{ $t("Pug.Players", { n: queue.joined, size: queue.size }) }}
        </div>
        <v-progress-linear :model-value="(queue.joined / queue.size) * 100" class="my-2" rounded />
        <v-btn size="small" :color="queue.status === 'open' ? 'primary' : 'warning'" block>
          {{ queue.status === "open" ? $t("Pug.Join") : $t("Pug.StatusReady") }}
        </v-btn>
      </v-card>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { pugs } from "@/api";
import type { OpenPugQueue } from "@/api/types";

/** "Open queue 7/10" cards above the match list; refreshed every 10 s. Hidden when there is none. */
const queues = ref<OpenPugQueue[]>([]);

async function load() {
  try {
    queues.value = await pugs.open();
  } catch {
    // Not important enough to show an error on the match list.
  }
}

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(() => {
  void load();
  timer = setInterval(() => document.visibilityState === "visible" && void load(), 10000);
});
onBeforeUnmount(() => timer && clearInterval(timer));
</script>

<style scoped>
.queue {
  width: 200px;
}
</style>
