<template>
  <div>
    <div class="d-flex align-center flex-wrap ga-2">
      <span class="text-body-medium">{{ $t("CreateMatch.FormMapPool") }}</span>
      <v-chip size="x-small" variant="tonal" label>{{ model.length }} / {{ maps.length }}</v-chip>
      <v-spacer />
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-check-all"
        :disabled="!maps.length || model.length === maps.length"
        @click="model = maps.map((map) => map.map_name)"
      >
        {{ $t("CreateMatch.SelectAllMaps") }}
      </v-btn>
      <v-btn
        size="small"
        variant="text"
        prepend-icon="mdi-close"
        :disabled="!model.length"
        @click="model = []"
      >
        {{ $t("CreateMatch.ClearMaps") }}
      </v-btn>
    </div>
    <div class="text-body-small text-medium-emphasis">
      {{ $t("CreateMatch.FormMapExplanation") }}
    </div>
    <v-chip-group v-model="model" multiple column selected-class="text-primary">
      <v-chip v-for="map in maps" :key="map.id" :value="map.map_name" filter variant="outlined">
        {{ map.map_display_name }}
      </v-chip>
    </v-chip-group>
    <div v-if="error" class="text-error text-body-small mb-2">{{ error }}</div>
  </div>
</template>

<script setup lang="ts">
import type { MapListEntry } from "@/api/types";

/** Map pool selection (map names, in the order of the user's map list). */
const model = defineModel<string[]>({ required: true });
defineProps<{ maps: MapListEntry[]; error?: string }>();
</script>
