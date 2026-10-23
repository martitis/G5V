<template>
  <v-card :title="$t('Match.Vetoes')">
    <v-card-text>
      <div class="veto-grid">
        <div
          v-for="(veto, index) in rows"
          :key="veto.id"
          class="veto rounded"
          :class="veto.pick ? 'veto--pick' : 'veto--ban'"
        >
          <v-img
            :src="mapImageUrl(veto.map)"
            height="56"
            cover
            class="rounded-t"
            :class="{ 'veto-img--ban': !veto.pick }"
          >
            <div class="d-flex align-start justify-space-between pa-1">
              <v-chip size="x-small" variant="flat" :color="veto.pick ? 'success' : 'error'" label>
                {{ veto.pick ? $t("Veto.VetoPick") : $t("Veto.VetoBan") }}
              </v-chip>
              <span class="text-caption veto-index">{{ index + 1 }}</span>
            </div>
          </v-img>
          <div class="pa-2">
            <div class="text-body-medium font-weight-medium">{{ mapDisplayName(veto.map) }}</div>
            <div class="text-body-small text-medium-emphasis">
              {{ veto.team_name === "Decider" ? $t("Veto.DeciderTeam") : veto.team_name }}
            </div>
            <div v-if="veto.side" class="text-body-small mt-1">
              <v-icon size="x-small">mdi-swap-horizontal</v-icon>
              {{ $t("Match.SideChosen", { team: veto.sideTeam, side: veto.side.toUpperCase() }) }}
            </div>
          </div>
        </div>
      </div>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Veto, VetoSide } from "@/api/types";
import { mapDisplayName, mapImageUrl } from "@/utils/format";

/** The map veto in order, with the side each picked map's opponent chose. */
const props = defineProps<{ vetoes: Veto[]; sides: VetoSide[] }>();

const rows = computed(() =>
  [...props.vetoes]
    .sort((a, b) => a.id - b.id)
    .map((veto) => {
      const side = props.sides.find((s) => s.veto_id === veto.id);
      return {
        ...veto,
        pick: veto.pick_or_veto === "pick",
        side: side?.side ?? null,
        sideTeam: side?.team_name ?? ""
      };
    })
);
</script>

<style scoped>
.veto-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 12px;
}
.veto {
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  overflow: hidden;
}
.veto--pick {
  border-color: rgb(var(--v-theme-success));
}
.veto-img--ban {
  filter: grayscale(1) brightness(0.7);
}
.veto-index {
  background: rgba(0, 0, 0, 0.55);
  color: #fff;
  border-radius: 4px;
  padding: 0 6px;
}
</style>
