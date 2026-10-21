<template>
  <v-dialog v-model="show" max-width="900" scrollable>
    <v-card :title="season ? $t('Seasons.EditFormTitle') : $t('Seasons.NewFormTitle')">
      <v-card-text>
        <v-skeleton-loader v-if="loading" type="article, article" />
        <v-form v-else ref="form" @submit.prevent="save">
          <v-text-field v-model="draft.name" :label="$t('Seasons.Name')" :rules="[required]" />
          <v-row density="compact">
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="draft.start"
                type="date"
                :label="$t('Seasons.StartDate')"
                :rules="[required]"
              />
            </v-col>
            <v-col cols="12" sm="6">
              <v-text-field
                v-model="draft.end"
                type="date"
                :label="$t('Seasons.EndDate')"
                :rules="[endRule]"
                clearable
              />
            </v-col>
          </v-row>

          <div class="text-title-medium mt-2">{{ $t("Seasons.Defaults") }}</div>
          <div class="text-body-small text-medium-emphasis mb-3">
            {{ $t("Seasons.DefaultsHint") }}
          </div>

          <div class="text-body-medium mb-1">{{ $t("CreateMatch.FormSeriesType") }}</div>
          <v-btn-toggle
            v-model="defaults.maps_to_win"
            mandatory
            color="primary"
            variant="outlined"
            divided
            class="mb-4"
          >
            <v-btn v-for="n in [1, 2, 3, 5, 7]" :key="n" :value="n">BO{{ n }}</v-btn>
          </v-btn-toggle>

          <v-row density="compact">
            <v-col cols="12" sm="4">
              <v-number-input
                v-model="defaults.players_per_team"
                :label="$t('CreateMatch.PlayersPerTeam')"
                :min="1"
                :max="10"
                control-variant="split"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-number-input
                v-model="defaults.min_players_to_ready"
                :label="$t('Seasons.ReadyPerTeam')"
                :min="1"
                :max="defaults.players_per_team"
                control-variant="split"
              />
            </v-col>
            <v-col cols="12" sm="4">
              <v-number-input
                v-model="defaults.min_spectators_to_ready"
                :label="$t('CreateMatch.SpectatorsToReady')"
                :min="0"
                control-variant="split"
              />
            </v-col>
          </v-row>

          <div class="d-flex flex-wrap ga-4">
            <v-switch
              v-model="defaults.wingman"
              :label="$t('CreateMatch.Wingman')"
              color="primary"
              hide-details
            />
            <v-switch
              v-model="defaults.skip_veto"
              :label="$t('CreateMatch.SkipVeto')"
              color="primary"
              hide-details
            />
          </div>

          <v-radio-group v-model="defaults.side_type" inline hide-details class="mb-2">
            <v-radio :label="$t('CreateMatch.KnifeDefault')" value="standard" />
            <v-radio :label="$t('CreateMatch.KnifeNever')" value="never_knife" />
            <v-radio :label="$t('CreateMatch.KnifeAlways')" value="always_knife" />
          </v-radio-group>

          <div class="text-body-medium mt-2">{{ $t("CreateMatch.FormMapPool") }}</div>
          <div class="text-body-small text-medium-emphasis">
            {{ $t("CreateMatch.FormMapExplanation") }}
          </div>
          <v-chip-group v-model="defaults.map_pool" multiple column selected-class="text-primary">
            <v-chip
              v-for="map in mapList"
              :key="map.id"
              :value="map.map_name"
              filter
              variant="outlined"
            >
              {{ map.map_display_name }}
            </v-chip>
          </v-chip-group>
          <div v-if="mapPoolError" class="text-error text-body-small mb-2">{{ mapPoolError }}</div>

          <v-row v-if="defaults.skip_veto" density="compact" class="mt-2">
            <v-col v-for="index in defaults.maps_to_win" :key="index" cols="12" sm="6" md="4">
              <v-select
                v-model="defaults.map_sides[index - 1]"
                :items="sideItems"
                :label="$t('CreateMatch.MapSides', { map: defaults.map_pool[index - 1] ?? index })"
                density="compact"
              />
            </v-col>
          </v-row>

          <v-combobox
            v-model="defaults.spectators"
            :label="$t('CreateMatch.Spectators')"
            :hint="$t('Team.AuthHint')"
            persistent-hint
            multiple
            chips
            closable-chips
            class="mt-4"
          />

          <div class="text-body-medium mt-6 mb-2">{{ $t("CreateMatch.FormCVARS") }}</div>
          <CvarEditor v-model="cvars" :hint="$t('Seasons.CvarHint')" />
          <button type="submit" hidden />
        </v-form>
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" :disabled="busy" @click="show = false">{{ $t("misc.Cancel") }}</v-btn>
        <v-btn color="primary" :loading="busy" :disabled="loading" @click="save">{{
          $t("misc.Save")
        }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { maps, seasons } from "@/api";
import type { MapListEntry, Season } from "@/api/types";
import CvarEditor from "@/components/CvarEditor.vue";
import { useAuthStore } from "@/stores/auth";
import { useUiStore } from "@/stores/ui";
import { toDateInput } from "@/utils/format";
import { emptyDefaults, parseSeasonCvars, serializeSeasonCvars } from "@/utils/seasonDefaults";

const show = defineModel<boolean>({ default: false });
/** The season to edit, or null to create one. */
const props = defineProps<{ season: Season | null }>();
const emit = defineEmits<{ saved: [] }>();

const { t } = useI18n();
const auth = useAuthStore();
const ui = useUiStore();
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const loading = ref(false);
const busy = ref(false);
const mapList = ref<MapListEntry[]>([]);

const draft = reactive({ name: "", start: "", end: null as string | null });
const defaults = reactive(emptyDefaults());
const cvars = ref<Record<string, string>>({});

const sideItems = computed(() => [
  { title: t("CreateMatch.MapSidesTeam1CT"), value: "team1_ct" },
  { title: t("CreateMatch.MapSidesTeam2CT"), value: "team1_t" },
  { title: t("CreateMatch.MapSidesKnife"), value: "knife" }
]);

watch(show, async (open) => {
  if (!open) return;
  loading.value = true;
  Object.assign(draft, {
    name: props.season?.name ?? "",
    start: toDateInput(props.season?.start_date) || toDateInput(new Date().toISOString()),
    end: toDateInput(props.season?.end_date) || null
  });
  Object.assign(defaults, emptyDefaults());
  cvars.value = {};
  try {
    const [list, stored] = await Promise.all([
      auth.user?.id != null ? maps.enabled(auth.user.id) : Promise.resolve([]),
      props.season ? seasons.cvars(props.season.id) : Promise.resolve({})
    ]);
    mapList.value = list;
    const parsed = parseSeasonCvars(stored);
    Object.assign(defaults, parsed.defaults);
    cvars.value = parsed.cvars;
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
});

// Keep the ready count within the team size.
watch(
  () => defaults.players_per_team,
  (size) => {
    if (size && defaults.min_players_to_ready > size) defaults.min_players_to_ready = size;
  }
);

const required = (value: string) => !!value?.trim() || t("misc.Required");
const endRule = (value: string | null) =>
  !value || value >= draft.start || t("Seasons.EndBeforeStart");
const mapPoolError = computed(() => {
  if (defaults.map_pool.length === 0) return "";
  return defaults.map_pool.length < defaults.maps_to_win ? t("CreateMatch.MapNotEnough") : "";
});

async function save() {
  if (busy.value || loading.value || mapPoolError.value || !(await form.value?.validate())?.valid)
    return;
  busy.value = true;
  try {
    const body = {
      name: draft.name.trim(),
      start_date: draft.start,
      end_date: draft.end || null,
      // Cleared number fields come back as null; fall back to the defaults.
      season_cvar: serializeSeasonCvars(
        {
          ...defaults,
          players_per_team: defaults.players_per_team || 5,
          min_players_to_ready: defaults.min_players_to_ready || 1,
          min_spectators_to_ready: defaults.min_spectators_to_ready || 0
        },
        cvars.value
      )
    };
    if (props.season) {
      await seasons.update({ ...body, season_id: props.season.id });
      ui.notify(t("Seasons.SeasonUpdated"), "success");
    } else {
      await seasons.create(body);
      ui.notify(t("Seasons.SeasonCreated"), "success");
    }
    show.value = false;
    emit("saved");
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = false;
  }
}
</script>
