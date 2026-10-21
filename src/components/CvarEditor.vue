<template>
  <div>
    <div v-for="(row, index) in rows" :key="row.id" class="d-flex ga-2 align-start">
      <v-text-field
        v-model.trim="row.name"
        :label="$t('CreateMatch.CvarName')"
        :rules="[nameRule]"
        density="compact"
        class="flex-1-1"
        @update:model-value="emitValue"
      />
      <v-text-field
        v-model="row.value"
        :label="$t('CreateMatch.CvarValue')"
        :rules="[valueRule]"
        density="compact"
        class="flex-1-1"
        @update:model-value="emitValue"
      />
      <v-btn icon="mdi-close" variant="text" size="small" class="mt-1" @click="removeRow(index)" />
    </div>
    <v-btn variant="tonal" size="small" prepend-icon="mdi-plus" @click="addRow">{{
      $t("CreateMatch.CvarAdd")
    }}</v-btn>
    <div v-if="hint" class="text-body-small text-medium-emphasis mt-2">{{ hint }}</div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useI18n } from "vue-i18n";

/** Key/value editor for server cvars, with the same rules the API (and MatchZy) apply. */
const model = defineModel<Record<string, string>>({ default: () => ({}) });
defineProps<{ hint?: string }>();

const { t } = useI18n();
let nextId = 0;
const rows = ref<{ id: number; name: string; value: string }[]>([]);

// Rebuild the rows only when the value changes from outside (not on our own emits).
let lastEmitted: Record<string, string> | null = null;
watch(
  model,
  (value) => {
    if (value === lastEmitted) return;
    rows.value = Object.entries(value ?? {}).map(([name, v]) => ({
      id: nextId++,
      name,
      value: String(v)
    }));
  },
  { immediate: true }
);

function emitValue() {
  const result: Record<string, string> = {};
  for (const row of rows.value) if (row.name) result[row.name] = row.value;
  lastEmitted = result;
  model.value = result;
}

function addRow() {
  rows.value.push({ id: nextId++, name: "", value: "" });
}

function removeRow(index: number) {
  rows.value.splice(index, 1);
  emitValue();
}

const BLOCKED =
  /^(rcon_password|sv_rcon_.*|matchzy_everyone_is_admin|.*_url|.*_header_(key|value))$/i;
const nameRule = (value: string) => {
  if (!value) return true;
  if (!/^[A-Za-z0-9_]{1,64}$/.test(value)) return t("CreateMatch.CvarInvalidName");
  if (BLOCKED.test(value)) return t("CreateMatch.CvarBlocked");
  if (rows.value.filter((row) => row.name === value).length > 1)
    return t("CreateMatch.CvarDuplicate");
  return true;
};
// Control characters are rejected by the API too.
const valueRule = (value: string) =>
  !/[";\x00-\x1f\x7f]/.test(value ?? "") || t("CreateMatch.CvarInvalidValue");
</script>
