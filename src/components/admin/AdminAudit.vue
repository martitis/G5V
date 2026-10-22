<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap ga-2">
      <span>{{ $t("Admin.TabAudit") }}</span>
      <v-chip size="small" variant="tonal">{{ total }}</v-chip>
      <v-spacer />
      <v-select
        v-model="action"
        :items="actionItems"
        density="compact"
        hide-details
        style="max-width: 220px"
      />
      <v-btn icon="mdi-refresh" variant="text" :loading="loading" @click="load" />
    </v-card-title>
    <v-data-table-server
      v-model:page="page"
      v-model:items-per-page="perPage"
      :headers="headers"
      :items="entries"
      :items-length="total"
      :loading="loading"
      :no-data-text="$t('Admin.NoEntries')"
      item-value="id"
      density="compact"
      @update:options="load"
    >
      <template #[`item.time`]="{ item }">
        <span class="text-no-wrap">{{ formatDateTime(item.time) }}</span>
      </template>
      <template #[`item.user_name`]="{ item }">
        <router-link v-if="item.user_id" :to="`/user/${item.user_id}`" class="app-link">
          {{ item.user_name || `#${item.user_id}` }}
        </router-link>
      </template>
      <template #[`item.action`]="{ item }">
        <code>{{ item.action }}</code>
      </template>
      <template #[`item.target`]="{ item }">
        <router-link v-if="targetLink(item)" :to="targetLink(item)!" class="app-link">
          {{ item.target_type }} #{{ item.target_id }}
        </router-link>
        <span v-else-if="item.target_type"
          >{{ item.target_type }} {{ item.target_id ? `#${item.target_id}` : "" }}</span
        >
      </template>
      <template #[`item.status_code`]="{ item }">
        <v-chip
          v-if="item.status_code"
          size="x-small"
          :color="item.status_code < 400 ? 'success' : item.status_code < 500 ? 'warning' : 'error'"
          variant="tonal"
          label
        >
          {{ item.status_code }}
        </v-chip>
      </template>
      <template #[`item.detail`]="{ item }">
        <span class="detail">{{ item.detail }}</span>
      </template>
    </v-data-table-server>
  </v-card>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { admin } from "@/api";
import type { AuditEntry } from "@/api/types";
import { useUiStore } from "@/stores/ui";
import { formatDateTime } from "@/utils/format";

const { t } = useI18n();
const ui = useUiStore();
const entries = ref<AuditEntry[]>([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const perPage = ref(25);
const action = ref("");

const headers = computed(() => [
  { title: t("Admin.Time"), key: "time", sortable: false },
  { title: t("Admin.Who"), key: "user_name", sortable: false },
  { title: t("Admin.Action"), key: "action", sortable: false },
  { title: t("Admin.Target"), key: "target", sortable: false },
  { title: t("Admin.Result"), key: "status_code", sortable: false },
  { title: t("Admin.Detail"), key: "detail", sortable: false }
]);
const actionItems = computed(() => [
  { value: "", title: t("Admin.AllActions") },
  ...["match.", "user.", "server.", "team.", "season."].map((prefix) => ({
    value: prefix,
    title: prefix + "*"
  }))
]);

const LINKS: Record<string, string> = {
  match: "/match/",
  user: "/user/",
  team: "/teams/",
  season: "/season/"
};
const targetLink = (entry: AuditEntry) =>
  entry.target_type && entry.target_id && LINKS[entry.target_type]
    ? LINKS[entry.target_type] + entry.target_id
    : null;

let requestId = 0;
async function load() {
  const id = ++requestId;
  loading.value = true;
  try {
    const result = await admin.audit({
      action: action.value || undefined,
      limit: perPage.value,
      offset: (page.value - 1) * perPage.value
    });
    if (id !== requestId) return;
    entries.value = result.entries;
    total.value = result.total;
  } catch (error) {
    if (id === requestId) ui.notifyError(error);
  } finally {
    if (id === requestId) loading.value = false;
  }
}

watch(action, () => {
  if (page.value === 1) void load();
  else page.value = 1;
});
</script>

<style scoped>
.detail {
  font-family: ui-monospace, Consolas, monospace;
  font-size: 12px;
  word-break: break-all;
}
</style>
