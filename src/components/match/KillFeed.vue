<template>
  <div>
    <div v-if="!kills.length" class="text-body-medium text-medium-emphasis">
      {{ $t("Match.NoKills") }}
    </div>
    <div v-else class="d-flex flex-column ga-1">
      <div v-for="kill in visible" :key="kill.id" class="kill text-body-medium">
        <span class="text-caption text-medium-emphasis round-tag">
          {{ $t("Match.RoundShort", { n: kill.round_number + 1 }) }}
        </span>
        <template v-if="kill.attacker_name && !truthy(kill.suicide)">
          <span :class="sideClass(kill.attacker_side)">{{ kill.attacker_name }}</span>
          <span v-if="kill.assister_name" class="text-medium-emphasis">
            +
            <v-icon v-if="truthy(kill.flash_assist)" size="14" :title="$t('Match.FlashAssist')">
              mdi-flash
            </v-icon>
            {{ kill.assister_name }}
          </span>
        </template>
        <span class="weapon">
          <v-chip size="x-small" variant="tonal" label>{{ weaponName(kill.weapon) }}</v-chip>
          <v-icon
            v-if="truthy(kill.headshot)"
            size="14"
            color="error"
            :title="$t('Match.Headshot')"
          >
            mdi-target
          </v-icon>
          <v-icon v-if="truthy(kill.thru_smoke)" size="14" :title="$t('Match.ThroughSmoke')">
            mdi-weather-fog
          </v-icon>
          <v-icon v-if="truthy(kill.no_scope)" size="14" :title="$t('Match.NoScope')">
            mdi-crosshairs-off
          </v-icon>
          <v-icon v-if="truthy(kill.attacker_blind)" size="14" :title="$t('Match.Blind')">
            mdi-eye-off
          </v-icon>
        </span>
        <span :class="sideClass(kill.player_side)">{{ kill.player_name }}</span>
      </div>
    </div>
    <v-btn
      v-if="kills.length > limit"
      variant="text"
      size="small"
      class="mt-1"
      @click="expanded = !expanded"
    >
      {{ expanded ? $t("Match.ShowLess") : $t("Match.ShowAllKills", { n: kills.length }) }}
    </v-btn>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import type { KillEvent } from "@/api/types";

/** Kills of one map, newest first (as the API sends them). */
const props = withDefaults(defineProps<{ kills: KillEvent[]; limit?: number }>(), { limit: 10 });
const expanded = ref(false);

const visible = computed(() => (expanded.value ? props.kills : props.kills.slice(0, props.limit)));
const truthy = (value: unknown) => value === true || Number(value) === 1;

function sideClass(side: string | null) {
  const value = (side ?? "").toLowerCase();
  return value === "ct" ? "side-ct" : value === "t" ? "side-t" : "";
}

/** "weapon_ak47" / "ak47" -> "AK47"; a few names that read badly otherwise. */
function weaponName(weapon: string) {
  const name = (weapon ?? "").replace(/^weapon_/, "");
  const known: Record<string, string> = {
    planted_c4: "C4",
    world: "World",
    hegrenade: "HE",
    inferno: "Molotov",
    knife_t: "Knife",
    knife: "Knife",
    usp_silencer: "USP-S",
    m4a1_silencer: "M4A1-S"
  };
  return known[name] ?? name.toUpperCase();
}
</script>

<style scoped>
.kill {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 6px;
}
.round-tag {
  min-width: 30px;
}
.weapon {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}
.side-ct {
  color: #5d9cec;
  font-weight: 500;
}
.side-t {
  color: #e0a040;
  font-weight: 500;
}
</style>
