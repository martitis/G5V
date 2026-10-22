<template>
  <v-container fluid>
    <OpenQueues />
    <ScheduledMatches v-if="auth.isAdmin" @changed="list?.reload()" />
    <MatchList
      ref="list"
      :key="mine ? 'mine' : 'all'"
      :title="$t('Navbar.Matches')"
      :fixed="mine ? { mine: true } : {}"
      :initial-status="mine ? 'all' : 'default'"
      hide-mine-toggle
      @loaded="onLoaded"
    >
      <template #actions>
        <v-switch
          v-if="auth.loggedIn"
          v-model="mine"
          :label="$t('misc.OnlyMine')"
          color="primary"
          density="compact"
          hide-details
          class="mr-2"
        />
        <v-btn v-if="auth.isAdmin" color="primary" prepend-icon="mdi-plus" to="/match/create">
          {{ $t("CreateMatch.Title") }}
        </v-btn>
        <v-btn
          v-if="mine && hasCancelled"
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete-sweep"
          :loading="deleting"
          @click="deleteCancelled"
        >
          {{ $t("Matches.DeleteButton") }}
        </v-btn>
      </template>
    </MatchList>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { matches } from "@/api";
import type { MatchSummary } from "@/api/types";
import MatchList from "@/components/matchlist/MatchList.vue";
import OpenQueues from "@/components/pug/OpenQueues.vue";
import ScheduledMatches from "@/components/matchlist/ScheduledMatches.vue";
import { useOnlyMine } from "@/composables/useOnlyMine";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const auth = useAuthStore();
const ui = useUiStore();
const mine = useOnlyMine("matches");

const list = ref<InstanceType<typeof MatchList> | null>(null);
const hasCancelled = ref(false);
const deleting = ref(false);

function onLoaded(list: MatchSummary[]) {
  hasCancelled.value = list.some((match) => match.status === "cancelled");
}

async function deleteCancelled() {
  deleting.value = true;
  try {
    const result = await matches.remove({ all_cancelled: true });
    ui.notify(result.message, "success");
    await list.value?.reload();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    deleting.value = false;
  }
}
</script>
