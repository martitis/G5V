<template>
  <v-container fluid>
    <MatchesTable
      ref="table"
      :load="load"
      :title="mine ? $t('Navbar.MyMatches') : $t('Navbar.AllMatches')"
      @loaded="onLoaded"
    >
      <template v-if="mine && hasCancelled" #actions>
        <v-btn
          color="error"
          variant="tonal"
          prepend-icon="mdi-delete-sweep"
          :loading="deleting"
          @click="deleteCancelled"
        >
          {{ $t("Matches.DeleteButton") }}
        </v-btn>
      </template>
    </MatchesTable>
  </v-container>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useRoute } from "vue-router";
import { matches } from "@/api";
import type { Match } from "@/api/types";
import MatchesTable from "@/components/MatchesTable.vue";
import { useUiStore } from "@/stores/ui";

const route = useRoute();
const ui = useUiStore();
const mine = computed(() => Boolean(route.meta.mine));
const load = computed(() => (mine.value ? matches.mine : matches.all));

const table = ref<InstanceType<typeof MatchesTable> | null>(null);
const hasCancelled = ref(false);
const deleting = ref(false);

function onLoaded(list: Match[]) {
  hasCancelled.value = list.some((match) => match.cancelled == 1);
}

async function deleteCancelled() {
  deleting.value = true;
  try {
    const result = await matches.remove({ all_cancelled: true });
    ui.notify(result.message, "success");
    await table.value?.reload();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    deleting.value = false;
  }
}
</script>
