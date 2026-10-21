<template>
  <div class="team-side d-flex" :class="reverse ? 'justify-end' : 'justify-start'">
    <component
      :is="teamId ? RouterLink : 'div'"
      v-bind="teamId ? { to: `/teams/${teamId}` } : {}"
      class="app-link"
    >
      <div class="d-flex align-center ga-3" :class="{ 'flex-row-reverse text-right': reverse }">
        <TeamLogo v-if="team?.logo" :logo="team.logo" :size="48" />
        <img v-else-if="team?.flag" :src="flagUrl(team.flag)" alt="" style="border-radius: 3px" />
        <span
          class="text-headline-small"
          :class="{ 'font-weight-bold': won, 'text-medium-emphasis': lost }"
        >
          {{ name }}
        </span>
      </div>
    </component>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from "vue-router";
import type { Team } from "@/api/types";
import TeamLogo from "@/components/TeamLogo.vue";
import { flagUrl } from "@/utils/format";

/** One team in the match header: logo (or flag) and name, linking to the team page while the team exists. */
defineProps<{
  team: Team | null;
  name: string;
  teamId: number | null;
  won?: boolean;
  lost?: boolean;
  reverse?: boolean;
}>();
</script>
