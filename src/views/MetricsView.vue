<template>
  <v-container fluid>
    <v-card :title="$t('Metrics.Title')">
      <v-card-text>
        <v-row density="compact">
          <v-col v-for="tile in tiles" :key="tile.key" cols="6" sm="4" md="3">
            <v-card variant="tonal" class="h-100">
              <v-card-text class="d-flex align-center ga-3">
                <v-icon :icon="tile.icon" size="32" color="primary" />
                <div>
                  <div class="text-body-small text-medium-emphasis">{{ tile.label }}</div>
                  <v-skeleton-loader v-if="loading" type="text" width="60" />
                  <div v-else class="text-headline-small font-weight-medium">
                    {{ metrics[tile.key] ?? 0 }}
                  </div>
                </div>
              </v-card-text>
            </v-card>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useI18n } from "vue-i18n";
import { stats } from "@/api";
import { useUiStore } from "@/stores/ui";

const { t } = useI18n();
const ui = useUiStore();
const metrics = ref<Record<string, number>>({});
const loading = ref(true);

const tiles = computed(() => [
  { key: "users", label: t("Metrics.Users"), icon: "mdi-account-multiple" },
  { key: "teams", label: t("Metrics.Teams"), icon: "mdi-shield-account" },
  { key: "matches", label: t("Metrics.Matches"), icon: "mdi-sword-cross" },
  { key: "completed_matches", label: t("Metrics.Complete"), icon: "mdi-flag-checkered" },
  { key: "live_matches", label: t("Metrics.Live"), icon: "mdi-broadcast" },
  { key: "servers", label: t("Metrics.GameServers"), icon: "mdi-server" },
  { key: "maps_played", label: t("Metrics.Maps"), icon: "mdi-map" },
  { key: "players", label: t("Metrics.Players"), icon: "mdi-account-group" },
  { key: "seasons", label: t("Metrics.Seasons"), icon: "mdi-trophy" }
]);

onMounted(async () => {
  try {
    metrics.value = await stats.metrics();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
});
</script>
