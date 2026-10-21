<template>
  <v-row density="compact">
    <v-col v-for="tile in tiles" :key="tile.label" cols="6" sm="4" md="3" lg="">
      <v-card variant="tonal" class="h-100">
        <v-card-text>
          <div class="text-body-small text-medium-emphasis">{{ tile.label }}</div>
          <div class="text-headline-small font-weight-medium">{{ tile.value }}</div>
        </v-card-text>
      </v-card>
    </v-col>
  </v-row>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import type { PlayerStat } from "@/api/types";
import { adr, hsp, kdr, rating } from "@/utils/format";

/** Career totals over every map a player has stats for (one row per map). */
const props = defineProps<{ stats: PlayerStat[] }>();
const { t } = useI18n();

const num = (value: unknown) => Number(value) || 0;

const totals = computed(() => {
  const sum = (key: string) => props.stats.reduce((total, row) => total + num(row[key]), 0);
  return {
    kills: sum("kills"),
    deaths: sum("deaths"),
    headshot_kills: sum("headshot_kills"),
    damage: sum("damage"),
    roundsplayed: sum("roundsplayed"),
    k1: sum("k1"),
    k2: sum("k2"),
    k3: sum("k3"),
    k4: sum("k4"),
    k5: sum("k5")
  };
});

// The rating is computed over all rounds, not averaged per map (a 1-round map would weigh as much as a full one).
const tiles = computed(() => {
  const s = totals.value;
  return [
    { label: t("PlayerStats.Rating"), value: rating(s.kills, s.roundsplayed, s.deaths, s.k1, s.k2, s.k3, s.k4, s.k5) },
    { label: t("PlayerStats.KDR"), value: kdr(s) },
    { label: t("PlayerStats.ADR"), value: adr(s) },
    { label: t("PlayerStats.Headshot"), value: `${hsp(s)}%` },
    { label: t("PlayerStats.Kills"), value: s.kills },
    { label: t("PlayerStats.Deaths"), value: s.deaths },
    { label: t("PlayerStats.5kill"), value: s.k5 },
    { label: t("PlayerStats.TotalMaps"), value: props.stats.length },
    { label: t("PlayerStats.RoundsPlayed"), value: s.roundsplayed }
  ];
});
</script>
