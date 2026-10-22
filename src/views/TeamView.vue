<template>
  <v-container fluid>
    <v-skeleton-loader v-if="loading && !team" type="card, table" />
    <v-alert v-else-if="!team" type="warning" variant="tonal">{{
      $t("misc.NotFoundText")
    }}</v-alert>

    <template v-else>
      <v-card class="mb-4">
        <v-card-text class="d-flex align-center flex-wrap ga-4">
          <TeamLogo :logo="team.logo" :size="64" placeholder />
          <div class="flex-grow-1">
            <div class="d-flex align-center flex-wrap ga-2">
              <span class="text-headline-small">{{ team.name }}</span>
              <v-chip size="small" label>{{ team.tag }}</v-chip>
              <img
                v-if="team.flag"
                :src="flagUrl(team.flag)"
                :alt="team.flag"
                style="border-radius: 3px"
              />
              <v-icon v-if="!team.public_team" size="small" :title="$t('Team.Private')">
                mdi-lock
              </v-icon>
            </div>
            <div class="text-body-medium text-medium-emphasis mt-1">
              {{ $t("Team.Owner") }}:
              <router-link :to="`/user/${team.user_id}`" class="app-link">
                {{ team.owner || `#${team.user_id}` }}
              </router-link>
            </div>
          </div>
          <div v-if="canEdit" class="d-flex ga-2">
            <v-btn
              color="primary"
              variant="tonal"
              prepend-icon="mdi-pencil"
              @click="editorOpen = true"
            >
              {{ $t("Team.Edit") }}
            </v-btn>
            <v-btn
              color="error"
              variant="tonal"
              prepend-icon="mdi-delete"
              @click="confirmTeamDelete = true"
            >
              {{ $t("Team.DeleteTeam") }}
            </v-btn>
          </div>
        </v-card-text>
      </v-card>

      <v-card class="mb-4">
        <v-card-title class="d-flex align-center flex-wrap ga-2">
          <span>{{ $t("Team.Players") }}</span>
          <v-chip size="small" variant="tonal">{{ members.length }}</v-chip>
          <v-spacer />
          <v-btn
            v-if="canEdit"
            color="primary"
            variant="tonal"
            prepend-icon="mdi-account-multiple-plus"
            @click="editorOpen = true"
          >
            {{ $t("Team.AddPlayersLabel") }}
          </v-btn>
        </v-card-title>
        <v-data-table
          :headers="memberHeaders"
          :items="members"
          :loading="loading"
          :no-data-text="$t('Team.NoMembers')"
          item-value="steamId"
          density="comfortable"
          :items-per-page="-1"
          hide-default-footer
        >
          <template #[`item.name`]="{ item }">
            <div class="d-flex align-center ga-2">
              <v-avatar size="32" color="surface-variant">
                <v-img v-if="item.image" :src="item.image" alt="" />
                <v-icon v-else>mdi-account</v-icon>
              </v-avatar>
              <a
                :href="steamProfileUrl(item.steamId)"
                target="_blank"
                rel="noopener"
                class="app-link"
              >
                {{ item.name || item.steamId }}
              </a>
            </div>
          </template>
          <template #[`item.roles`]="{ item }">
            <div class="d-flex ga-1">
              <v-chip
                v-if="item.captain"
                size="small"
                color="amber-darken-1"
                variant="tonal"
                prepend-icon="mdi-crown"
                :title="item.steamId === vetoCaptain ? $t('Team.WhatIsCaptain') : undefined"
                label
              >
                {{ $t("Team.CaptainBadge") }}
              </v-chip>
              <v-chip
                v-if="item.coach"
                size="small"
                color="info"
                variant="tonal"
                prepend-icon="mdi-whistle"
                label
              >
                {{ $t("Team.Coach") }}
              </v-chip>
            </div>
          </template>
        </v-data-table>
      </v-card>

      <MatchList
        :title="$t('Team.RecentMatches')"
        :fixed="{ team_id: team.id }"
        :filters="false"
        :page-size="10"
      />
    </template>

    <!-- Info and players are edited together. -->
    <TeamEditorDialog v-model="editorOpen" :team="team" @saved="load" />

    <v-dialog v-model="confirmTeamDelete" max-width="480">
      <v-card :title="$t('Team.DeleteConfirm')" :text="team?.name">
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="confirmTeamDelete = false">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="error" :loading="busy" @click="deleteTeam">{{ $t("misc.Delete") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { teams } from "@/api";
import type { Team } from "@/api/types";
import MatchList from "@/components/matchlist/MatchList.vue";
import TeamEditorDialog from "@/components/team/TeamEditorDialog.vue";
import TeamLogo from "@/components/TeamLogo.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { flagUrl, steamProfileUrl } from "@/utils/format";

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

const team = ref<(Team & { owner?: string }) | null>(null);
const loading = ref(true);
const busy = ref(false);
const editorOpen = ref(false);
const confirmTeamDelete = ref(false);

const canEdit = computed(() => team.value != null && auth.canEdit(team.value.user_id));

// The API already orders captains first; keep that order.
const members = computed(() =>
  Object.entries(team.value?.auth_name ?? {}).map(([steamId, member]) => ({
    steamId,
    name: member.name,
    image: member.image,
    captain: Boolean(member.captain),
    coach: Boolean(member.coach)
  }))
);
/** MatchZy gives the vetoes to the first captain (or the first player when there is none). */
const vetoCaptain = computed(
  () => (members.value.find((m) => m.captain) ?? members.value[0])?.steamId
);

const memberHeaders = computed(() => [
  { title: t("Team.Username"), key: "name" },
  { title: t("Team.SteamIDTitle"), key: "steamId" },
  { title: "", key: "roles", sortable: false }
]);

async function load() {
  loading.value = true;
  try {
    await auth.load();
    team.value = await teams.get(Number(route.params.id));
  } catch (error) {
    team.value = null;
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

async function deleteTeam() {
  if (!team.value) return;
  busy.value = true;
  try {
    await teams.remove({ team_id: team.value.id });
    ui.notify(t("Team.MessageDeleteSuccess"), "success");
    confirmTeamDelete.value = false;
    await router.push({ path: "/teams", query: { mine: "1" } });
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

watch(() => route.params.id, load, { immediate: true });
</script>
