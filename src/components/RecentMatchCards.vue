<template>
  <v-row v-if="loading" class="justify-center">
    <v-col v-for="n in 3" :key="n" cols="12" md="4">
      <v-skeleton-loader type="image" height="200" />
    </v-col>
  </v-row>
  <v-row v-else class="justify-center">
    <v-col v-for="match in cards" :key="match.id" cols="12" md="4">
      <v-card :to="`/match/${match.id}`" class="overflow-hidden" height="200">
        <v-img
          :src="match.image"
          height="200"
          cover
          gradient="to bottom, rgba(0,0,0,.25), rgba(0,0,0,.75)"
          class="text-white"
          @error="match.image = mapImageUrl(null)"
        >
          <div class="d-flex flex-column fill-height justify-center align-center text-center pa-3">
            <div class="text-title-medium text-uppercase">{{ match.team1_string }}</div>
            <div class="text-body-small">{{ $t("misc.Versus") }}</div>
            <div class="text-title-medium text-uppercase">{{ match.team2_string }}</div>
            <div class="text-display-small font-weight-bold my-1">
              {{ match.score[0] }} : {{ match.score[1] }}
            </div>
            <div class="text-body-small">
              {{ $t("CreateMatch.BestOf") }}{{ match.max_maps }}
              <span v-if="match.mapName"> · {{ mapDisplayName(match.mapName) }}</span>
            </div>
          </div>
        </v-img>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { matches, stats } from "@/api";
import type { Match } from "@/api/types";
import { displayScore, mapDisplayName, mapImageUrl } from "@/utils/format";

type Card = Match & { image: string; mapName: string | null; score: [number, number] };

const cards = ref<Card[]>([]);
const loading = ref(true);

onMounted(async () => {
  try {
    const recent = await matches.limit(3);
    // Map of each match in parallel; a match without maps yet just shows the generic image.
    cards.value = await Promise.all(
      recent.map(async (match) => {
        const firstMap = await stats.map(match.id, 0).catch(() => null);
        const score: [number, number] =
          match.max_maps == 1 && firstMap
            ? [firstMap.team1_score ?? 0, firstMap.team2_score ?? 0]
            : displayScore(match);
        return {
          ...match,
          mapName: firstMap?.map_name ?? null,
          image: mapImageUrl(firstMap?.map_name),
          score
        };
      })
    );
  } catch (error) {
    console.error(error);
  } finally {
    loading.value = false;
  }
});
</script>
