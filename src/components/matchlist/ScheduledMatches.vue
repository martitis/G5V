<template>
  <v-card v-if="rows.length" class="mb-4">
    <v-card-title class="d-flex align-center ga-2">
      <v-icon color="primary">mdi-calendar-clock</v-icon>
      <span>{{ $t("Schedule.Title") }}</span>
    </v-card-title>
    <v-list density="compact">
      <v-list-item v-for="row in rows" :key="row.id">
        <template #prepend>
          <v-chip :color="STATUS[row.status].color" size="small" variant="tonal" label class="mr-3">
            {{ $t(STATUS[row.status].key) }}
          </v-chip>
        </template>
        <v-list-item-title>
          {{ row.title || `${teamName(row.team1_id)} vs ${teamName(row.team2_id)}` }}
        </v-list-item-title>
        <v-list-item-subtitle>
          {{ new Date(row.run_at).toLocaleString() }}
          <span v-if="row.max_maps"> · BO{{ row.max_maps }}</span>
          <span v-if="row.owner"> · {{ row.owner }}</span>
          <span v-if="row.error" class="text-error"> · {{ row.error }}</span>
        </v-list-item-subtitle>
        <template #append>
          <v-btn
            v-if="row.match_id"
            size="small"
            variant="text"
            :to="`/match/${row.match_id}`"
            append-icon="mdi-chevron-right"
          >
            {{ $t("Schedule.Open") }}
          </v-btn>
          <template v-if="row.status === 'pending' || row.status === 'failed'">
            <v-btn
              size="small"
              variant="tonal"
              color="primary"
              :loading="busy === row.id"
              @click="run(row.id)"
            >
              {{ $t("Schedule.RunNow") }}
            </v-btn>
            <v-btn
              size="small"
              variant="text"
              color="error"
              :disabled="busy === row.id"
              @click="cancel(row.id)"
            >
              {{ $t("Schedule.Cancel") }}
            </v-btn>
          </template>
        </template>
      </v-list-item>
    </v-list>
  </v-card>
</template>

<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from "vue";
import { scheduled, teams as teamsApi } from "@/api";
import type { ScheduledMatch, Team } from "@/api/types";
import { useUiStore } from "@/stores/ui";

const STATUS: Record<ScheduledMatch["status"], { key: string; color: string }> = {
  pending: { key: "Schedule.StatusPending", color: "info" },
  running: { key: "Schedule.StatusRunning", color: "warning" },
  loaded: { key: "Schedule.StatusLoaded", color: "success" },
  failed: { key: "Schedule.StatusFailed", color: "error" },
  cancelled: { key: "Schedule.StatusCancelled", color: "grey" }
};

/** Admins' scheduled matches (waiting, failed, and the latest created ones); refreshed every 30 s. */
const emit = defineEmits<{ changed: [] }>();
const ui = useUiStore();
const rows = ref<ScheduledMatch[]>([]);
const teamList = ref<Team[]>([]);
const busy = ref<number | null>(null);

const teamName = (id: number | null) =>
  teamList.value.find((team) => team.id === id)?.name ?? `#${id ?? "?"}`;

async function load() {
  try {
    rows.value = await scheduled.list();
  } catch {
    rows.value = [];
  }
}

async function run(id: number) {
  busy.value = id;
  try {
    const result = await scheduled.run(id);
    if (result.scheduled.status === "loaded") ui.notify(result.message, "success");
    else ui.notify(result.scheduled.error ?? result.message, "warning");
    await load();
    emit("changed");
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = null;
  }
}

async function cancel(id: number) {
  busy.value = id;
  try {
    await scheduled.cancel(id);
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = null;
  }
}

let timer: ReturnType<typeof setInterval> | null = null;
onMounted(async () => {
  teamList.value = await teamsApi.all().catch(() => []);
  await load();
  timer = setInterval(() => document.visibilityState === "visible" && void load(), 30000);
});
onBeforeUnmount(() => timer && clearInterval(timer));
</script>
