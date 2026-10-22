<template>
  <v-container fluid>
    <MatchList
      :title="$t('Team.RecentMatches')"
      :filters="false"
      :page-size="6"
      compact
      class="mb-4"
    >
      <template #actions>
        <v-btn variant="text" append-icon="mdi-arrow-right" to="/matches">{{
          $t("Navbar.AllMatches")
        }}</v-btn>
      </template>
    </MatchList>
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
import MatchList from "@/components/matchlist/MatchList.vue";
import TeamLeaderboardTable from "@/components/TeamLeaderboardTable.vue";
import PlayerLeaderboardTable from "@/components/PlayerLeaderboardTable.vue";
</script>
