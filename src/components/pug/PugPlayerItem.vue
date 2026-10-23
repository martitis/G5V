<template>
  <v-list-item>
    <template #prepend>
      <v-avatar size="32" color="surface-variant" class="mr-1">
        <v-img v-if="player.image" :src="player.image" alt="" />
        <v-icon v-else>mdi-account</v-icon>
      </v-avatar>
    </template>
    <v-list-item-title>
      {{ player.name || player.steam_id }}
      <v-icon v-if="player.captain" size="16" color="amber-darken-1" class="ml-1">mdi-crown</v-icon>
    </v-list-item-title>
    <template #append>
      <v-chip size="x-small" variant="tonal" label class="mr-2" :title="$t('Pug.Rating')">
        {{ player.rating.toFixed(2) }}
      </v-chip>
      <v-icon v-if="showReady" :color="player.ready ? 'success' : undefined">
        {{ player.ready ? "mdi-check-circle" : "mdi-timer-sand" }}
      </v-icon>
      <slot />
    </template>
  </v-list-item>
</template>

<script setup lang="ts">
import type { PugPlayer } from "@/api/types";

/** One player of a PUG queue: avatar, name, captain crown, rating and (during the ready check) ready state. */
defineProps<{ player: PugPlayer; showReady?: boolean }>();
</script>
