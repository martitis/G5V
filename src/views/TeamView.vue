<template>
  <v-container fluid>
    <!-- Create mode: only the info form; members are added on the team page afterwards. -->
    <v-card v-if="creating" :title="$t('Navbar.CreateTeam')">
      <v-card-text>
        <TeamInfoForm :team="null" @saved="(id) => router.replace(`/teams/${id}`)" />
      </v-card-text>
    </v-card>

    <template v-else>
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
                <v-icon v-if="!team.public_team" size="small" :title="$t('Team.Private')"
                  >mdi-lock</v-icon
                >
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
                @click="editDialog = true"
              >
                {{ $t("Team.EditInfo") }}
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
              prepend-icon="mdi-account-plus"
              @click="openMember(null)"
            >
              {{ $t("Team.NewMember") }}
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
            <template #[`item.actions`]="{ item }">
              <div v-if="canEdit" class="d-flex justify-end">
                <v-btn icon="mdi-pencil" size="small" variant="text" @click="openMember(item)" />
                <v-btn
                  icon="mdi-delete"
                  size="small"
                  variant="text"
                  color="error"
                  @click="memberToDelete = item"
                />
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
    </template>

    <!-- Edit team info -->
    <v-dialog v-model="editDialog" max-width="760">
      <v-card :title="$t('Team.EditInfo')">
        <v-card-text>
          <TeamInfoForm
            :team="team"
            cancellable
            @cancel="editDialog = false"
            @saved="onInfoSaved"
          />
        </v-card-text>
      </v-card>
    </v-dialog>

    <!-- Add / edit member -->
    <v-dialog v-model="memberDialog" max-width="520">
      <v-card :title="memberDraft.existing ? $t('Team.EditPlayer') : $t('Team.NewPlayer')">
        <v-card-text>
          <v-form ref="memberForm" @submit.prevent="saveMember">
            <v-text-field
              v-model.trim="memberDraft.steam"
              :label="$t('Team.AuthLabel')"
              :hint="$t('Team.AuthHint')"
              persistent-hint
              :disabled="memberDraft.existing"
              :rules="[(v: string) => !!v || $t('misc.Required')]"
              autofocus
            />
            <v-text-field v-model="memberDraft.name" :label="$t('Team.NickLabel')" class="mt-2" />
            <div class="d-flex flex-wrap ga-4">
              <v-switch
                v-model="memberDraft.captain"
                :label="$t('Team.Captain')"
                color="primary"
                hide-details
              />
              <v-switch
                v-model="memberDraft.coach"
                :label="$t('Team.Coach')"
                color="primary"
                hide-details
              />
            </div>
            <v-alert type="info" variant="tonal" density="compact" class="mt-2">
              {{ $t("Team.WhatIsCaptain") }}
            </v-alert>
            <button type="submit" hidden />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="busy" @click="memberDialog = false">{{
            $t("misc.Cancel")
          }}</v-btn>
          <v-btn color="primary" :loading="busy" @click="saveMember">{{ $t("misc.Save") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Delete confirmations -->
    <v-dialog
      :model-value="memberToDelete !== null"
      max-width="480"
      @update:model-value="memberToDelete = null"
    >
      <v-card
        :title="$t('Team.DeleteConfirmation')"
        :text="memberToDelete?.name || memberToDelete?.steamId"
      >
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="memberToDelete = null">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="error" :loading="busy" @click="deleteMember">{{ $t("misc.Delete") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
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
import { computed, reactive, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { teams } from "@/api";
import type { Team } from "@/api/types";
import MatchList from "@/components/matchlist/MatchList.vue";
import TeamInfoForm from "@/components/TeamInfoForm.vue";
import TeamLogo from "@/components/TeamLogo.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { flagUrl, steamProfileUrl } from "@/utils/format";

interface MemberRow {
  steamId: string;
  name: string;
  image?: string;
  captain: boolean;
  coach: boolean;
}

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();

// /teams/create and /teams/:id share this component (and its instance), so key everything off the route.
const creating = computed(() => route.name === "CreateTeam");
const teamId = computed(() => (creating.value ? null : Number(route.params.id)));

const team = ref<(Team & { owner?: string }) | null>(null);
const loading = ref(true);
const busy = ref(false);
const editDialog = ref(false);
const confirmTeamDelete = ref(false);
const memberDialog = ref(false);
const memberToDelete = ref<MemberRow | null>(null);
const memberForm = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const memberDraft = reactive({
  steam: "",
  name: "",
  captain: false,
  coach: false,
  existing: false
});

const canEdit = computed(() => team.value != null && auth.canEdit(team.value.user_id));

// The API already orders captains first; keep that order.
const members = computed<MemberRow[]>(() =>
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
  { title: "", key: "roles", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" as const }
]);

async function load() {
  if (teamId.value == null) {
    loading.value = false;
    return;
  }
  loading.value = true;
  try {
    await auth.load();
    team.value = await teams.get(teamId.value);
  } catch (error) {
    team.value = null;
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

function onInfoSaved() {
  editDialog.value = false;
  void load();
}

function openMember(member: MemberRow | null) {
  Object.assign(memberDraft, {
    steam: member?.steamId ?? "",
    name: member?.name ?? "",
    captain: member?.captain ?? false,
    coach: member?.coach ?? false,
    existing: member !== null
  });
  memberDialog.value = true;
}

async function saveMember() {
  if (!team.value || busy.value || !(await memberForm.value?.validate())?.valid) return;
  busy.value = true;
  try {
    await teams.update({
      id: team.value.id,
      auth_name: {
        [memberDraft.steam]: {
          name: memberDraft.name.trim(),
          captain: memberDraft.captain ? 1 : 0,
          coach: memberDraft.coach ? 1 : 0
        }
      }
    });
    ui.notify(t("TeamCreate.MessageeEditSuccess"), "success");
    memberDialog.value = false;
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

async function deleteMember() {
  if (!team.value || !memberToDelete.value) return;
  busy.value = true;
  try {
    const result = await teams.remove({
      team_id: team.value.id,
      steam_id: memberToDelete.value.steamId
    });
    ui.notify(result.message, "success");
    memberToDelete.value = null;
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

async function deleteTeam() {
  if (!team.value) return;
  busy.value = true;
  try {
    await teams.remove({ team_id: team.value.id });
    ui.notify(t("Team.MessageDeleteSuccess"), "success");
    confirmTeamDelete.value = false;
    await router.push("/myteams");
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}

watch(teamId, load, { immediate: true });
</script>
