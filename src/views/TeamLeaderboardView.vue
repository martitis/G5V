<template>
  <v-container fluid>
    <LeaderboardTabs :season="seasonId" />
    <TeamLeaderboardTable :season-id="seasonId" searchable />
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import LeaderboardTabs from "@/components/LeaderboardTabs.vue";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable.vue";

const route = useRoute();
const seasonId = computed(() =>
  route.params.seasonid ? Number(route.params.seasonid) : undefined
);
</script>
