<template>
  <v-card>
    <v-card-title class="d-flex align-center flex-wrap ga-2">
      <span>{{ title }}</span>
      <v-spacer />
      <v-btn v-if="editable" color="primary" prepend-icon="mdi-map-plus" @click="openDialog(null)">
        {{ $t("User.MapNew") }}
      </v-btn>
    </v-card-title>
    <v-data-table
      :headers="headers"
      :items="list"
      :loading="loading"
      :no-data-text="$t('misc.NoData')"
      item-value="id"
      density="comfortable"
      :items-per-page="-1"
      hide-default-footer
    >
      <template #[`item.map_display_name`]="{ item }">
        <div class="d-flex align-center ga-2">
          <v-img
            :src="mapImageUrl(item.map_name)"
            width="64"
            height="36"
            cover
            class="rounded flex-grow-0"
          />
          {{ item.map_display_name }}
        </div>
      </template>
      <template #[`item.enabled`]="{ item }">
        <v-switch
          :model-value="Boolean(item.enabled)"
          :disabled="!editable || busyId === item.id"
          color="primary"
          density="compact"
          hide-details
          @update:model-value="(value) => toggle(item, Boolean(value))"
        />
      </template>
      <template #[`item.actions`]="{ item }">
        <div v-if="editable" class="d-flex justify-end">
          <v-btn icon="mdi-pencil" size="small" variant="text" @click="openDialog(item)" />
          <v-btn
            icon="mdi-delete"
            size="small"
            variant="text"
            color="error"
            @click="toDelete = item"
          />
        </div>
      </template>
    </v-data-table>

    <v-dialog v-model="dialog" max-width="520">
      <v-card :title="editing ? $t('User.MapEdit') : $t('User.MapNew')">
        <v-card-text>
          <v-form ref="form" @submit.prevent="save">
            <v-text-field
              v-model.trim="draft.map_display_name"
              :label="$t('User.MapDisplayName')"
              :rules="[(v: string) => !!v || $t('misc.Required')]"
            />
            <v-text-field
              v-model.trim="draft.map_name"
              :label="$t('User.MapName')"
              :hint="$t('User.MapNameHint')"
              persistent-hint
              :rules="[
                (v: string) => /^[A-Za-z0-9_./-]{1,128}$/.test(v ?? '') || $t('User.MapNameInvalid')
              ]"
            />
            <v-switch
              v-model="draft.enabled"
              :label="$t('User.MapEnabled')"
              color="primary"
              hide-details
            />
            <button type="submit" hidden />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" :disabled="saving" @click="dialog = false">{{
            $t("misc.Cancel")
          }}</v-btn>
          <v-btn color="primary" :loading="saving" @click="save">{{ $t("User.MapSave") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog
      :model-value="toDelete !== null"
      max-width="480"
      @update:model-value="toDelete = null"
    >
      <v-card
        :title="$t('User.MapDeleteTitle')"
        :text="$t('User.MapDeleteExplain', { map: toDelete?.map_display_name })"
      >
        <v-card-actions>
          <v-spacer />
          <v-btn variant="text" @click="toDelete = null">{{ $t("misc.Cancel") }}</v-btn>
          <v-btn color="error" :loading="saving" @click="remove">{{ $t("misc.Delete") }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { maps } from "@/api";
import type { MapListEntry } from "@/api/types";
import { useUiStore } from "@/stores/ui";
import { mapImageUrl } from "@/utils/format";

/** A user's map pool (used by the create match form). Only its owner can change it (the API checks too). */
const props = defineProps<{ userId: number; title: string; editable: boolean }>();

const { t } = useI18n();
const ui = useUiStore();
const list = ref<MapListEntry[]>([]);
const loading = ref(true);
const saving = ref(false);
const busyId = ref<number | null>(null);
const dialog = ref(false);
const editing = ref<MapListEntry | null>(null);
const toDelete = ref<MapListEntry | null>(null);
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null);
const draft = reactive({ map_name: "", map_display_name: "", enabled: true });

const headers = computed(() => [
  { title: t("User.MapDisplayName"), key: "map_display_name" },
  { title: t("User.MapName"), key: "map_name" },
  { title: t("User.MapEnabled"), key: "enabled", sortable: false },
  { title: "", key: "actions", sortable: false, align: "end" as const }
]);

async function load() {
  loading.value = true;
  try {
    list.value = await maps.list(props.userId);
  } catch (error) {
    ui.notifyError(error);
  } finally {
    loading.value = false;
  }
}

function openDialog(map: MapListEntry | null) {
  editing.value = map;
  Object.assign(draft, {
    map_name: map?.map_name ?? "",
    map_display_name: map?.map_display_name ?? "",
    enabled: map ? Boolean(map.enabled) : true
  });
  dialog.value = true;
}

async function save() {
  if (saving.value || !(await form.value?.validate())?.valid) return;
  saving.value = true;
  try {
    const body = { ...draft, enabled: draft.enabled ? 1 : 0 };
    const result = editing.value
      ? await maps.update({ ...body, id: editing.value.id })
      : await maps.create(body);
    ui.notify(result.message, "success");
    dialog.value = false;
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    saving.value = false;
  }
}

async function toggle(map: MapListEntry, enabled: boolean) {
  busyId.value = map.id;
  try {
    await maps.update({ id: map.id, enabled: enabled ? 1 : 0 });
    map.enabled = enabled ? 1 : 0;
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busyId.value = null;
  }
}

async function remove() {
  if (!toDelete.value) return;
  saving.value = true;
  try {
    const result = await maps.remove({ id: toDelete.value.id });
    ui.notify(result.message, "success");
    toDelete.value = null;
    await load();
  } catch (error) {
    ui.notifyError(error);
  } finally {
    saving.value = false;
  }
}

watch(() => props.userId, load, { immediate: true });
</script>
