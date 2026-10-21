<template>
  <v-container fluid>
    <v-skeleton-loader v-if="loading && !season" type="card, table" />
    <v-alert v-else-if="!season" type="warning" variant="tonal">{{
      $t("misc.NotFoundText")
    }}</v-alert>
    <template v-else>
      <v-card class="mb-4">
        <v-card-text class="d-flex align-center flex-wrap ga-4">
          <div class="flex-grow-1">
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="text-headline-small">{{ season.name }}</span>
              <v-chip :color="STATUS_COLORS[status]" size="small" variant="tonal" label>{{
                statusLabel
              }}</v-chip>
            </div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              {{ formatDate(season.start_date) }} –
              {{ season.end_date ? formatDate(season.end_date) : $t("Seasons.NotFinished") }}
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn
              variant="tonal"
              prepend-icon="mdi-account-star"
              :to="`/leaderboard/${season.id}`"
            >
              {{ $t("misc.PLeader") }}
            </v-btn>
            <v-btn
              variant="tonal"
              prepend-icon="mdi-trophy"
              :to="`/leaderboard/teams/${season.id}`"
            >
              {{ $t("Leaderboard.TTitle") }}
            </v-btn>
            <v-btn
              v-if="auth.canEdit(season.user_id)"
              color="primary"
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="dialog = true"
            >
              {{ $t("Seasons.EditFormTitle") }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <MatchesTable :load="loadMatches" :title="$t('Seasons.Matches')" />
    </template>

    <SeasonDialog v-model="dialog" :season="season" @saved="load" />
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { seasons } from "@/api";
import type { Match, Season } from "@/api/types";
import MatchesTable from "@/components/MatchesTable.vue";
import SeasonDialog from "@/components/SeasonDialog.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { formatDate, seasonStatus, type SeasonStatus } from "@/utils/format";

const STATUS_COLORS: Record<SeasonStatus, string> = {
  upcoming: "info",
  active: "success",
  ended: "grey"
};

const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const season = ref<Season | null>(null);
const matches = ref<Match[]>([]);
const loading = ref(true);
const dialog = ref(false);

const status = computed<SeasonStatus>(() => (season.value ? seasonStatus(season.value) : "active"));
const statusLabel = computed(
  () =>
    ({
      upcoming: t("Seasons.StatusUpcoming"),
      active: t("Seasons.StatusActive"),
      ended: t("Seasons.StatusEnded")
    })[status.value]
);

// The season request already returns its matches; hand them to the table without a second request.
const loadMatches = computed(() => {
  const list = matches.value;
  return () => Promise.resolve(list);
});

async function load() {
  loading.value = true;
  try {
    await auth.load();
    const result = await seasons.get(String(route.params.id));
    season.value = result.season;
    matches.value = result.matches ?? [];
  } catch (error) {
    season.value = null;
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

watch(() => route.params.id, load, { immediate: true });
</script>
