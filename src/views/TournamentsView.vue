<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span>{{ $t("Tournament.Title") }}</span>
        <v-spacer />
        <v-text-field
          v-model="search"
          :label="$t('misc.Search')"
          prepend-inner-icon="mdi-magnify"
          density="compact"
          hide-details
          clearable
          style="max-width: 280px"
        />
        <v-btn
          v-if="auth.isAdmin"
          color="primary"
          prepend-icon="mdi-tournament"
          @click="dialog = true"
        >
          {{ $t("Tournament.New") }}
        </v-btn>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="list"
        :search="search ?? ''"
        :loading="loading"
        :loading-text="$t('misc.LoadText')"
        :no-data-text="$t('Tournament.None')"
        item-value="id"
        density="comfortable"
      >
        <template #[`item.name`]="{ item }">
          <router-link :to="`/tournament/${item.id}`" class="app-link">{{ item.name }}</router-link>
        </template>
        <template #[`item.format`]="{ item }">{{ $t(`Tournament.${item.format}`) }}</template>
        <template #[`item.status`]="{ item }">
          <v-chip :color="STATUS_COLORS[item.status]" size="small" variant="tonal" label>
            {{ statusLabel(item.status) }}
          </v-chip>
        </template>
        <template #[`item.owner`]="{ item }">
          <router-link v-if="item.user_id" :to="`/user/${item.user_id}`" class="app-link">
            {{ item.owner || `#${item.user_id}` }}
          </router-link>
        </template>
      </v-data-table>
    </v-card>

    <TournamentDialog
      v-model="dialog"
      :detail="null"
      @saved="(id) => router.push(`/tournament/${id}`)"
    />
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { tournaments } from "@/api";
import type { TournamentSummary } from "@/api/types";
import TournamentDialog from "@/components/tournament/TournamentDialog.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const STATUS_COLORS = { draft: "grey", running: "success", finished: "secondary" } as const;

const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();
const list = ref<TournamentSummary[]>([]);
const loading = ref(true);
const dialog = ref(false);
const search = ref("");

const headers = computed(() => [
  { title: t("Tournament.Name"), key: "name" },
  { title: t("Tournament.Format"), key: "format" },
  { title: "", key: "status", sortable: false },
  { title: t("Team.Members"), key: "team_count", align: "end" as const },
  { title: t("Team.Owner"), key: "owner" }
]);
const statusLabel = (status: TournamentSummary["status"]) =>
  ({
    draft: t("Tournament.StatusDraft"),
    running: t("Tournament.StatusRunning"),
    finished: t("Tournament.StatusFinished")
  })[status];

onMounted(async () => {
  try {
    await auth.load();
    list.value = await tournaments.all();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
});
</script>
