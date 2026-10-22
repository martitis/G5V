<template>
  <v-tabs color="primary" class="mb-4">
    <v-tab
      :to="season ? `/leaderboard/${season}` : '/leaderboard'"
      prepend-icon="mdi-account-star"
      exact
    >
      {{ $t("Leaderboard.Players") }}
    </v-tab>
    <v-tab
      :to="season ? `/leaderboard/teams/${season}` : '/leaderboard/teams'"
      prepend-icon="mdi-shield-star"
      exact
    >
      {{ $t("Leaderboard.Teams") }}
    </v-tab>
  </v-tabs>
</template>

<script setup lang="ts">
/** Players / Teams tabs of the leaderboards; a season's leaderboards stay in that season. */
defineProps<{ season?: number }>();
</script>
