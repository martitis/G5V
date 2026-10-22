<template>
  <v-container fluid>
    <OpenQueues />
    <MatchList
      ref="list"
      :key="mine ? 'mine' : 'all'"
      :title="mine ? $t('Navbar.MyMatches') : $t('Navbar.AllMatches')"
      :fixed="mine ? { mine: true } : {}"
      :initial-status="mine ? 'all' : 'default'"
      @loaded="onLoaded"
    >
      <template #actions>
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
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { matches } from "@/api";
import type { MatchSummary } from "@/api/types";
import MatchList from "@/components/matchlist/MatchList.vue";
import OpenQueues from "@/components/pug/OpenQueues.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";

const route = useRoute();
const auth = useAuthStore();
const ui = useUiStore();
const mine = computed(() => Boolean(route.meta.mine));

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
