<template>
  <v-container fluid>
    <div class="text-headline-small mb-4">{{ $t("Admin.Title") }}</div>
    <v-tabs v-model="tab" color="primary" class="mb-4">
      <v-tab value="live" prepend-icon="mdi-broadcast">{{ $t("Admin.TabLive") }}</v-tab>
      <v-tab value="users" prepend-icon="mdi-account-key">{{ $t("Admin.TabUsers") }}</v-tab>
      <v-tab value="servers" prepend-icon="mdi-server">{{ $t("Admin.TabServers") }}</v-tab>
      <v-tab value="audit" prepend-icon="mdi-history">{{ $t("Admin.TabAudit") }}</v-tab>
    </v-tabs>
    <v-window v-model="tab">
      <v-window-item value="live">
        <!-- Every match being played or waiting to start; each row opens its page with the admin actions. -->
        <MatchList :title="$t('Admin.TabLive')" initial-status="active" :page-size="50" />
      </v-window-item>
      <v-window-item value="users">
        <AdminUsers />
      </v-window-item>
      <v-window-item value="servers">
        <ServersView />
      </v-window-item>
      <v-window-item value="audit">
        <AdminAudit />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import AdminAudit from "@/components/admin/AdminAudit.vue";
import AdminUsers from "@/components/admin/AdminUsers.vue";
import MatchList from "@/components/matchlist/MatchList.vue";
import ServersView from "@/views/ServersView.vue";

const route = useRoute();
const router = useRouter();
const TABS = ["live", "users", "servers", "audit"];
// The tab is in the URL (?tab=audit), so reloading or sharing keeps it.
const tab = ref(TABS.includes(String(route.query.tab)) ? String(route.query.tab) : "live");
watch(tab, (value) => void router.replace({ query: { ...route.query, tab: value } }));
</script>
