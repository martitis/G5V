<template>
  <v-card>
    <v-card-title>{{ title ?? $t("misc.PLeader") }}</v-card-title>
    <v-data-table
      :headers="headers"
      :items="players"
      :loading="loading"
      :loading-text="$t('misc.LoadText')"
      :no-data-text="$t('misc.NoData')"
      :sort-by="[
        { key: 'wins', order: 'desc' },
        { key: 'kills', order: 'desc' }
      ]"
      multi-sort
      item-value="steamId"
      show-expand
      density="comfortable"
    >
      <template #[`item.name`]="{ item }">
        <router-link :to="`/user/${item.steamId}`" class="app-link">{{ item.name }}</router-link>
      </template>
      <template #expanded-row="{ columns, item }">
        <tr>
          <td :colspan="columns.length" class="py-2">
            <!-- Detail stats of one player. -->
            <v-table density="compact">
              <thead>
                <tr>
                  <th v-for="detail in details" :key="detail.key">{{ detail.title }}</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td v-for="detail in details" :key="detail.key">{{ detail.value(item) }}</td>
                </tr>
              </tbody>
            </v-table>
          </td>
        </tr>
      </template>
    </v-data-table>
  </v-card>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { leaderboard } from "@/api";
import type { LeaderboardPlayer } from "@/api/types";
import { useUiStore } from "@/stores/ui";

const props = defineProps<{ seasonId?: number; pug?: boolean; title?: string }>();
const { t } = useI18n();
const ui = useUiStore();

const players = ref<LeaderboardPlayer[]>([]);
const loading = ref(true);

const headers = computed(() => [
  { title: t("PlayerStats.User"), key: "name" },
  { title: t("misc.TWins"), key: "wins" },
  { title: t("PlayerStats.Kills"), key: "kills" },
  { title: t("PlayerStats.Deaths"), key: "deaths" },
  { title: t("PlayerStats.Assists"), key: "assists" },
  { title: t("PlayerStats.FlashbangAssists"), key: "fba" },
  { title: t("PlayerStats.TotalRoundsPlayed"), key: "trp" },
  { title: t("PlayerStats.Rating"), key: "average_rating" },
  { title: "", key: "data-table-expand" }
]);

type Detail = { key: string; title: string; value: (p: LeaderboardPlayer) => string | number };
const details = computed<Detail[]>(() => [
  {
    key: "adr",
    title: t("PlayerStats.ADR"),
    value: (p) => (p.trp ? (p.total_damage / p.trp).toFixed(1) : 0)
  },
  { key: "hsp", title: t("PlayerStats.Headshot") + "%", value: (p) => p.hsp },
  { key: "k5", title: t("PlayerStats.5kill"), value: (p) => p.k5 },
  { key: "k4", title: t("PlayerStats.4kill"), value: (p) => p.k4 },
  { key: "k3", title: t("PlayerStats.3kill"), value: (p) => p.k3 },
  { key: "k2", title: t("PlayerStats.2kill"), value: (p) => p.k2 },
  { key: "k1", title: t("PlayerStats.1kill"), value: (p) => p.k1 },
  { key: "v5", title: t("PlayerStats.v5"), value: (p) => p.v5 },
  { key: "v4", title: t("PlayerStats.v4"), value: (p) => p.v4 },
  { key: "v3", title: t("PlayerStats.v3"), value: (p) => p.v3 },
  { key: "v2", title: t("PlayerStats.v2"), value: (p) => p.v2 },
  { key: "v1", title: t("PlayerStats.v1"), value: (p) => p.v1 },
  { key: "maps", title: t("PlayerStats.TotalMaps"), value: (p) => p.total_maps }
]);

onMounted(async () => {
  try {
    players.value = await leaderboard.players(props.seasonId, props.pug);
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
});
</script>
