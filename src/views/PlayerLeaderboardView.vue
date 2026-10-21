<template>
  <v-container fluid>
    <PlayerLeaderboardTable :season-id="seasonId" />
  </v-container>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import PlayerLeaderboardTable from "@/components/PlayerLeaderboardTable.vue";

const route = useRoute();
const seasonId = computed(() => (route.params.seasonid ? Number(route.params.seasonid) : undefined));
</script>
