<template>
  <div>
    <v-textarea
      v-model="input"
      :label="$t('Team.AddPlayersLabel')"
      :hint="$t('Team.AddPlayersHint')"
      persistent-hint
      rows="1"
      auto-grow
      prepend-inner-icon="mdi-account-multiple-plus"
      :loading="resolving"
      @paste="onPaste"
      @keydown.enter.exact.prevent="addFromInput"
    >
      <template #append-inner>
        <v-btn
          size="small"
          variant="tonal"
          color="primary"
          :disabled="!input.trim()"
          @click="addFromInput"
        >
          {{ $t("misc.Add") }}
        </v-btn>
      </template>
    </v-textarea>

    <v-table v-if="rows.length" density="compact" class="mt-3 members">
      <thead>
        <tr>
          <th>{{ $t("Team.Players") }} ({{ rows.length }})</th>
          <th>{{ $t("Team.NicknameShort") }}</th>
          <th class="text-center">{{ $t("Team.CaptainShort") }}</th>
          <th class="text-center">{{ $t("Team.Coach") }}</th>
          <th />
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in rows"
          :key="row.key"
          :class="{ 'row-invalid': row.state === 'invalid' }"
        >
          <td>
            <div class="d-flex align-center ga-2 py-1">
              <v-avatar size="28" color="surface-variant">
                <v-progress-circular
                  v-if="row.state === 'resolving'"
                  indeterminate
                  size="16"
                  width="2"
                />
                <v-img v-else-if="row.image" :src="row.image" alt="" />
                <v-icon v-else size="18" :color="row.state === 'invalid' ? 'error' : undefined">
                  {{ row.state === "invalid" ? "mdi-alert" : "mdi-account" }}
                </v-icon>
              </v-avatar>
              <div class="member-id">
                <div class="text-body-medium">
                  {{
                    row.steamName || (row.state === "resolving" ? $t("Team.Resolving") : row.input)
                  }}
                </div>
                <div
                  class="text-body-small"
                  :class="row.state === 'invalid' ? 'text-error' : 'text-medium-emphasis'"
                >
                  {{
                    row.state === "invalid" ? `${$t("Team.NotSteam")}: ${row.input}` : row.steamId
                  }}
                </div>
              </div>
            </div>
          </td>
          <td style="min-width: 140px">
            <v-text-field
              v-model="row.nickname"
              :placeholder="row.steamName ?? ''"
              density="compact"
              variant="plain"
              hide-details
              :disabled="row.state === 'invalid'"
            />
          </td>
          <td class="text-center">
            <v-checkbox-btn
              v-model="row.captain"
              :disabled="row.state === 'invalid'"
              class="d-inline-flex"
            />
          </td>
          <td class="text-center">
            <v-checkbox-btn
              v-model="row.coach"
              :disabled="row.state === 'invalid'"
              class="d-inline-flex"
            />
          </td>
          <td class="text-right">
            <v-btn icon="mdi-close" size="small" variant="text" @click="rows.splice(index, 1)" />
          </td>
        </tr>
      </tbody>
    </v-table>
    <div v-else class="text-body-medium text-medium-emphasis mt-3">{{ $t("Team.NoMembers") }}</div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { useI18n } from "vue-i18n";
import { teams } from "@/api";
import { useUiStore } from "@/stores/ui";
import { splitIdentifiers } from "@/utils/steamIds";
import type { MemberRow } from "@/components/team/memberRow";

/** The team's players; saved by the parent dialog together with the team info. */
const rows = defineModel<MemberRow[]>({ required: true });

const { t } = useI18n();
const ui = useUiStore();
const input = ref("");
let nextKey = 1;

const resolving = computed(() => rows.value.some((row) => row.state === "resolving"));

/** Pasting several identifiers adds them all at once instead of filling the field. */
function onPaste(event: ClipboardEvent) {
  const text = event.clipboardData?.getData("text") ?? "";
  const ids = splitIdentifiers(text);
  if (ids.length > 1 || (ids.length === 1 && !input.value.trim())) {
    event.preventDefault();
    void add(ids);
  }
}

function addFromInput() {
  const ids = splitIdentifiers(input.value);
  if (ids.length) void add(ids);
}

async function add(ids: string[]) {
  if (ids.length > 50) {
    ui.notify(t("Team.TooMany"), "warning");
    ids = ids.slice(0, 50);
  }
  // Skip what is already listed as typed; duplicates by SteamID64 are dropped once resolved.
  const known = new Set(rows.value.flatMap((row) => [row.input, row.steamId ?? ""]));
  const fresh = ids.filter((id) => !known.has(id));
  let skipped = ids.length - fresh.length;
  input.value = "";
  if (!fresh.length) {
    if (skipped) ui.notify(t("Team.AlreadyListed", { n: skipped }), "info");
    return;
  }
  const added: MemberRow[] = fresh.map((id) => ({
    key: nextKey++,
    input: id,
    steamId: null,
    steamName: null,
    image: null,
    nickname: "",
    captain: false,
    coach: false,
    state: "resolving"
  }));
  rows.value.push(...added);
  try {
    const resolved = await teams.resolveMembers(fresh);
    for (const result of resolved) {
      const row = rows.value.find((r) => r.state === "resolving" && r.input === result.input);
      if (!row) continue;
      const duplicate =
        result.steam_id != null &&
        rows.value.some((r) => r !== row && r.steamId === result.steam_id);
      if (duplicate) {
        rows.value.splice(rows.value.indexOf(row), 1);
        skipped++;
        continue;
      }
      Object.assign(row, {
        steamId: result.steam_id,
        steamName: result.name,
        image: result.image,
        state: result.steam_id ? "ok" : "invalid"
      });
    }
    if (skipped) ui.notify(t("Team.AlreadyListed", { n: skipped }), "info");
  } catch (error) {
    // Couldn't look them up: drop the rows again so nothing half-checked gets saved.
    const addedKeys = new Set(added.map((row) => row.key));
    rows.value = rows.value.filter((row) => !addedKeys.has(row.key));
    input.value = fresh.join("\n");
    ui.notifyError(error);
  }
}
</script>

<style scoped>
.members td {
  vertical-align: middle;
}
.member-id {
  min-width: 0;
  line-height: 1.2;
}
.row-invalid {
  background: rgba(var(--v-theme-error), 0.06);
}
</style>
