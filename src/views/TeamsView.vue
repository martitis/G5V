<template>
  <v-container fluid>
    <v-card>
      <v-card-title class="d-flex align-center flex-wrap ga-2">
        <span>{{ mine ? $t("Navbar.MyTeams") : $t("Teams.Title") }}</span>
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
        <template v-if="auth.loggedIn">
          <v-btn color="secondary" variant="tonal" prepend-icon="mdi-import" @click="importDialog = true">
            {{ $t("Teams.ImportTeam") }}
          </v-btn>
          <v-btn color="primary" prepend-icon="mdi-plus" to="/teams/create">
            {{ $t("Navbar.CreateTeam") }}
          </v-btn>
        </template>
      </v-card-title>
      <v-data-table
        :headers="headers"
        :items="visibleTeams"
        :search="search"
        :loading="loading"
        :loading-text="$t('misc.LoadText')"
        :no-data-text="$t('misc.NoData')"
        :sort-by="[{ key: 'id', order: 'desc' }]"
        item-value="id"
        density="comfortable"
      >
        <template #[`item.name`]="{ item }">
          <router-link :to="`/teams/${item.id}`" class="app-link">{{ item.name }}</router-link>
          <v-icon v-if="!item.public_team" size="small" class="ml-1" :title="$t('Team.Private')">
            mdi-lock
          </v-icon>
        </template>
        <template #[`item.flag`]="{ item }">
          <img v-if="item.flag" :src="flagUrl(item.flag)" :alt="item.flag" style="border-radius: 3px" />
        </template>
        <template #[`item.members`]="{ item }">
          {{ Object.keys(item.auth_name ?? {}).length }}
        </template>
        <template #[`item.owner`]="{ item }">
          <router-link :to="`/user/${item.user_id}`" class="app-link">{{ item.owner }}</router-link>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog v-model="importDialog" max-width="560">
      <v-card :title="$t('Teams.ImportTeam')">
        <v-card-text>
          <v-alert type="info" variant="tonal" class="mb-4">{{ $t("Teams.ImportHelp") }}</v-alert>
          <v-text-field
            v-model.trim="tournamentId"
            :label="$t('Seasons.ImportUrl')"
            :hint="$t('Seasons.ImportExplanation')"
            persistent-hint
            :rules="[(v: string) => !!v || $t('misc.Required')]"
            @keyup.enter="importTeams"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="importing" @click="importDialog = false">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="primary" :loading="importing" :disabled="!tournamentId" @click="importTeams">
            {{ $t("Seasons.Import") }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { teams as teamsApi } from "@/api";
import type { Team } from "@/api/types";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { flagUrl } from "@/utils/format";

const route = useRoute();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();
const mine = computed(() => Boolean(route.meta.mine));

const teams = ref<Team[]>([]);
const loading = ref(true);
const search = ref("");
const importDialog = ref(false);
const tournamentId = ref("");
const importing = ref(false);

// Private teams of other users are hidden from regular users (as in the old panel).
const visibleTeams = computed(() =>
  auth.isAdmin
    ? teams.value
    : teams.value.filter((team) => team.public_team || team.user_id === auth.user?.id)
);

const headers = computed(() => [
  { title: t("Team.ID"), key: "id" },
  { title: t("Team.Name"), key: "name" },
  { title: t("Team.TeamTag"), key: "tag", sortable: false },
  { title: t("Team.Flag"), key: "flag" },
  { title: t("Team.Members"), key: "members", sortable: false },
  { title: t("Team.Owner"), key: "owner" }
]);

async function load() {
  loading.value = true;
  try {
    await auth.load();
    teams.value = mine.value ? await teamsApi.mine() : await teamsApi.all();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

async function importTeams() {
  if (!tournamentId.value) return;
  importing.value = true;
  try {
    const result = await teamsApi.importChallonge(tournamentId.value);
    ui.notify(result.message, "success");
    importDialog.value = false;
    tournamentId.value = "";
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    importing.value = false;
  }
}

onMounted(load);
</script>
