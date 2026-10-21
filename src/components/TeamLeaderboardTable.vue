<template>
  <v-card>
    <v-card-title>{{ $t("Leaderboard.TTitle") }}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="teams"
      :loading="loading"
      :loading-text="$t('misc.LoadText')"
      :no-data-text="$t('misc.NoData')"
      :sort-by="[{ key: 'wins', order: 'desc' }]"
      item-value="name"
      density="comfortable"
    >
      <template #[`item.name`]="{ item }">
        <router-link v-if="item.id" :to="`/teams/${item.id}`" class="app-link">{{
          item.name
        }}</router-link>
        <span v-else>{{ item.name }}</span>
      </template>
      <template #[`item.rounddiff`]="{ item }">
        <span :class="item.rounddiff > 0 ? 'text-success' : item.rounddiff < 0 ? 'text-error' : ''">
          {{ item.rounddiff > 0 ? "+" : "" }}{{ item.rounddiff }}
        </span>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { leaderboard } from "@/api";
import type { TeamStanding } from "@/api/types";
import { useUiStore } from "@/stores/ui";

const props = defineProps<{ seasonId?: number }>();
const { t } = useI18n();
const ui = useUiStore();

const teams = ref<TeamStanding[]>([]);
const loading = ref(true);

const headers = computed(() => [
  { title: t("Leaderboard.TName"), key: "name" },
  { title: t("Leaderboard.TWin"), key: "wins" },
  { title: t("Leaderboard.TLosses"), key: "losses" },
  { title: t("Leaderboard.TDiff"), key: "rounddiff" }
]);

onMounted(async () => {
  try {
    teams.value = await leaderboard.teams(props.seasonId);
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
});
</script>
