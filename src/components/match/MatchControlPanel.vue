<template>
  <v-expansion-panels v-model="openPanels" variant="accordion" multiple>
    <v-expansion-panel value="control">
      <v-expansion-panel-title>
        <v-icon class="mr-2">mdi-tune</v-icon>{{ $t("Control.Title") }}
        <v-spacer />
        <v-chip
          v-if="health"
          :color="health.reachable ? 'success' : 'error'"
          size="x-small"
          variant="tonal"
          label
          class="mr-2"
        >
          {{ health.reachable ? $t("Control.Reachable") : $t("Control.Unreachable") }}
        </v-chip>
      </v-expansion-panel-title>
      <v-expansion-panel-text>
        <v-row>
          <!-- Match flow -->
          <v-col cols="12" md="6">
            <div class="text-title-small mb-2">{{ $t("Control.Flow") }}</div>
            <div class="d-flex flex-wrap ga-2 mb-3">
              <v-btn
                v-for="button in flowButtons"
                :key="button.action"
                size="small"
                variant="tonal"
                :color="button.confirm ? 'warning' : undefined"
                :prepend-icon="button.icon"
                :loading="busy === button.action"
                @click="button.confirm ? ask(button.action, {}, button.label) : send(button.action)"
              >
                {{ button.label }}
              </v-btn>
            </div>
            <div class="d-flex align-center ga-2 mb-2">
              <v-number-input
                v-model="readyCount"
                :label="$t('Control.ReadyRequired')"
                :min="0"
                :max="10"
                density="compact"
                hide-details
                control-variant="split"
                style="max-width: 280px"
              />
              <v-btn
                size="small"
                :loading="busy === 'ready_required'"
                @click="send('ready_required', { count: readyCount ?? 0 })"
              >
                {{ $t("Control.Set") }}
              </v-btn>
            </div>
            <div class="d-flex align-center flex-wrap ga-2 mb-2">
              <span class="text-body-medium">{{ $t("Control.AddReadyTime") }}</span>
              <v-btn
                v-for="seconds in [60, 120, 300]"
                :key="seconds"
                size="small"
                variant="outlined"
                :loading="busy === 'add_ready_time'"
                @click="send('add_ready_time', { seconds })"
              >
                +{{ seconds / 60 }} min
              </v-btn>
            </div>
            <div class="d-flex align-center ga-2">
              <v-select
                v-model="mapChoice"
                :items="mapItems"
                :label="$t('Control.ChangeMap')"
                density="compact"
                hide-details
                style="max-width: 280px"
              />
              <v-btn
                size="small"
                color="warning"
                variant="tonal"
                :disabled="!mapChoice"
                @click="
                  ask('change_map', { map: mapChoice }, `${$t('Control.ChangeMap')}: ${mapChoice}`)
                "
              >
                {{ $t("Control.Set") }}
              </v-btn>
            </div>
          </v-col>

          <!-- Team names and chat -->
          <v-col cols="12" md="6">
            <div class="text-title-small mb-2">{{ $t("Control.TeamNames") }}</div>
            <div v-for="team in [1, 2] as const" :key="team" class="d-flex align-center ga-2 mb-2">
              <v-text-field
                v-model="teamNames[team]"
                :label="team === 1 ? match.team1_string : match.team2_string"
                density="compact"
                hide-details
                counter="32"
                maxlength="32"
              />
              <v-btn
                size="small"
                :disabled="!teamNames[team]?.trim()"
                :loading="busy === `team_name${team}`"
                @click="send('team_name', { team, name: teamNames[team] }, `team_name${team}`)"
              >
                {{ $t("Control.Rename") }}
              </v-btn>
            </div>

            <div class="text-title-small mt-4 mb-2">{{ $t("Control.Messages") }}</div>
            <div class="d-flex flex-wrap ga-1 mb-2">
              <v-chip
                v-for="template in templates"
                :key="template"
                size="small"
                variant="outlined"
                @click="message = template"
              >
                {{ template }}
              </v-chip>
            </div>
            <div class="d-flex align-center ga-2">
              <v-text-field
                v-model="message"
                density="compact"
                hide-details
                counter="120"
                maxlength="120"
                @keydown.enter="sendMessage"
              />
              <v-btn
                size="small"
                color="primary"
                prepend-icon="mdi-send"
                :disabled="!message.trim()"
                :loading="busy === 'say'"
                @click="sendMessage"
              >
                {{ $t("Control.Send") }}
              </v-btn>
            </div>
          </v-col>

          <!-- Live cvars and server health -->
          <v-col cols="12" md="6">
            <div class="text-title-small mb-2">{{ $t("Control.LiveCvars") }}</div>
            <div class="d-flex align-center ga-2">
              <v-select
                v-model="cvar"
                :items="CVARS"
                item-title="name"
                item-value="name"
                density="compact"
                hide-details
                style="max-width: 280px"
              />
              <v-text-field
                v-model="cvarValue"
                :label="$t('Control.Value')"
                type="number"
                :hint="cvarHint"
                persistent-hint
                density="compact"
                style="max-width: 140px"
              />
              <v-btn
                size="small"
                :disabled="cvarValue === ''"
                :loading="busy === 'cvar'"
                @click="send('cvar', { cvar, value: Number(cvarValue) })"
              >
                {{ $t("Control.Set") }}
              </v-btn>
            </div>
          </v-col>
          <v-col cols="12" md="6">
            <div class="d-flex align-center mb-2">
              <span class="text-title-small">{{ $t("Control.Server") }}</span>
              <v-spacer />
              <v-btn
                size="small"
                variant="text"
                prepend-icon="mdi-refresh"
                :loading="checking"
                @click="checkHealth"
              >
                {{ $t("Control.Refresh") }}
              </v-btn>
            </div>
            <v-table v-if="health?.status" density="compact">
              <tbody>
                <tr v-for="[key, value] in statusRows" :key="key">
                  <td class="text-medium-emphasis">{{ key }}</td>
                  <td>{{ value }}</td>
                </tr>
              </tbody>
            </v-table>
          </v-col>
        </v-row>

        <pre v-if="reply" class="console mt-3">{{ reply }}</pre>
      </v-expansion-panel-text>
    </v-expansion-panel>
  </v-expansion-panels>

  <v-dialog :model-value="pending !== null" max-width="440" @update:model-value="pending = null">
    <v-card :title="$t('Control.ConfirmTitle')" :text="pending?.label">
      <v-card-actions>
        <v-spacer />
        <v-btn variant="text" @click="pending = null">{{ $t("misc.Cancel") }}</v-btn>
        <v-btn color="warning" @click="confirmPending">{{ $t("misc.Confirm") }}</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref } from "vue";
import { useI18n } from "vue-i18n";
import { matches } from "@/api";
import type { Match } from "@/api/types";
import { useUiStore } from "@/stores/ui";
import { mapDisplayName } from "@/utils/format";

/** Live cvars the API accepts (same list and limits as utility/matchcontrol.ts). */
const CVARS = [
  { name: "mp_maxrounds", min: 2, max: 60 },
  { name: "mp_overtime_enable", min: 0, max: 1 },
  { name: "mp_overtime_maxrounds", min: 2, max: 12 },
  { name: "mp_freezetime", min: 0, max: 60 },
  { name: "mp_team_timeout_max", min: 0, max: 10 },
  { name: "mp_team_timeout_time", min: 10, max: 300 },
  { name: "matchzy_enable_tech_pause", min: 0, max: 1 },
  { name: "matchzy_stop_command_available", min: 0, max: 1 },
  { name: "matchzy_pause_after_restore", min: 0, max: 1 }
];

/** MatchZy admin commands for a running match (owner or admin; the API checks and audits each one). */
const props = defineProps<{ match: Match }>();

const { t } = useI18n();
const ui = useUiStore();
const openPanels = ref<string[]>([]);
const busy = ref<string | null>(null);
const reply = ref("");
const readyCount = ref<number | null>(0);
const mapChoice = ref<string | null>(null);
const teamNames = reactive<Record<1 | 2, string>>({ 1: "", 2: "" });
const message = ref("");
const cvar = ref(CVARS[0].name);
const cvarValue = ref<string>("");
const pending = ref<{ action: string; args: Record<string, unknown>; label: string } | null>(null);
const health = ref<{ reachable: boolean; status: Record<string, unknown> | null } | null>(null);
const checking = ref(false);

const flowButtons = computed(() => [
  { action: "start", label: t("Control.ForceStart"), icon: "mdi-play-circle", confirm: true },
  { action: "skip_veto", label: t("Control.SkipVeto"), icon: "mdi-debug-step-over", confirm: true },
  { action: "toggle_knife", label: t("Control.ToggleKnife"), icon: "mdi-knife", confirm: false },
  {
    action: "toggle_playout",
    label: t("Control.TogglePlayout"),
    icon: "mdi-format-list-numbered",
    confirm: false
  },
  {
    action: "toggle_whitelist",
    label: t("Control.ToggleWhitelist"),
    icon: "mdi-account-lock",
    confirm: false
  }
]);
const templates = computed(() => [
  t("Control.TemplateTech"),
  t("Control.TemplateStart"),
  t("Control.TemplateReady"),
  t("Control.TemplateRestore")
]);
/** The match's map pool. */
const mapItems = computed(() =>
  String(props.match.veto_mappool ?? "")
    .split(/[\s,]+/)
    .filter(Boolean)
    .map((map) => ({ value: map, title: mapDisplayName(map) }))
);
const cvarHint = computed(() => {
  const limits = CVARS.find((entry) => entry.name === cvar.value);
  return limits ? `${limits.min}–${limits.max}` : "";
});
const statusRows = computed(() =>
  Object.entries(health.value?.status ?? {})
    .filter(([, value]) => value == null || typeof value !== "object")
    .map(([key, value]) => [key, String(value ?? "")])
);

async function send(action: string, args: Record<string, unknown> = {}, busyKey = action) {
  busy.value = busyKey;
  try {
    const result = await matches.control(props.match.id, { action, ...args });
    reply.value = result.response ? String(result.response) : "";
    ui.notify(t("Control.Sent"), "success");
  } catch (error) {
    ui.notifyError(error);
  } finally {
    busy.value = null;
  }
}

function ask(action: string, args: Record<string, unknown>, label: string) {
  pending.value = { action, args, label };
}
async function confirmPending() {
  const next = pending.value;
  pending.value = null;
  if (next) await send(next.action, next.args);
}

async function sendMessage() {
  if (!message.value.trim()) return;
  await send("say", { message: message.value });
  message.value = "";
}

async function checkHealth() {
  checking.value = true;
  try {
    health.value = await matches.serverStatus(props.match.id);
  } catch (error) {
    ui.notifyError(error);
  } finally {
    checking.value = false;
  }
}

void checkHealth();
</script>

<style scoped>
.console {
  background: #111;
  color: #d6d6d6;
  font-family: ui-monospace, "Cascadia Mono", Consolas, monospace;
  font-size: 12px;
  padding: 12px;
  border-radius: 6px;
  max-height: 240px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
