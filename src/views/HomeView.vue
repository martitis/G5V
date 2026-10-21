<template>
  <v-container fluid>
    <RecentMatchCards class="mb-4" />
    <v-row>
      <v-col cols="12" lg="6">
        <TeamLeaderboardTable />
      </v-col>
      <v-col cols="12" lg="6">
        <PlayerLeaderboardTable />
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import RecentMatchCards from "@/components/RecentMatchCards.vue";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable.vue";
import PlayerLeaderboardTable from "@/components/PlayerLeaderboardTable.vue";
</script>
